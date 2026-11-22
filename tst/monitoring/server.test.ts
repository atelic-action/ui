// @vitest-environment node
import {
	buildEnvelope,
	parseDSN,
	parseStack,
	refusalError,
	reportRefusedResponse,
	reportServerError,
	reportServerErrorLater,
	withErrorReporting,
} from "../../src/monitoring/server";

const DSN = "https://publickey@o123.ingest.example.com/4567";

/** The three lines of an envelope, parsed. */
function lines(envelope: string) {
	return envelope.split("\n").map((line) => JSON.parse(line));
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe("parseDSN", () => {
	it("reads the key, the project, and the envelope URL", () => {
		expect(parseDSN(DSN)).toEqual({
			key: "publickey",
			projectId: "4567",
			envelopeURL:
				"https://o123.ingest.example.com/api/4567/envelope/?sentry_key=publickey&sentry_version=7",
		});
	});

	it("keeps a path before the project, for a self hosted Sentry under a prefix", () => {
		expect(parseDSN("https://k@sentry.example.com/errors/12")?.envelopeURL).toBe(
			"https://sentry.example.com/errors/api/12/envelope/?sentry_key=k&sentry_version=7",
		);
	});

	it("refuses what is not a DSN", () => {
		for (const value of [
			undefined,
			"",
			"not a url",
			"https://o1.example.com/1",
			"https://k@o1.example.com/",
		]) {
			expect(parseDSN(value)).toBeUndefined();
		}
	});
});

describe("parseStack", () => {
	it("reads V8 frames oldest first, and marks a dependency's frame as not the site's", () => {
		const stack = [
			"Error: Resend refused the send",
			"    at relay (file:///var/task/api/contact.js:88:11)",
			"    at async POST (file:///var/task/api/contact.js:40:3)",
			"    at file:///var/task/node_modules/some-lib/index.js:5:9",
		].join("\n");
		expect(parseStack(stack)).toEqual([
			{
				filename: "file:///var/task/node_modules/some-lib/index.js",
				lineno: 5,
				colno: 9,
				in_app: false,
			},
			{
				function: "async POST",
				filename: "file:///var/task/api/contact.js",
				lineno: 40,
				colno: 3,
				in_app: true,
			},
			{
				function: "relay",
				filename: "file:///var/task/api/contact.js",
				lineno: 88,
				colno: 11,
				in_app: true,
			},
		]);
	});

	it("reads nothing from no stack", () => {
		expect(parseStack(undefined)).toEqual([]);
	});
});

describe("buildEnvelope", () => {
	it("is the envelope header, the item header, and the event, a line each", () => {
		vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123abc");
		vi.stubEnv("VERCEL_ENV", "production");
		const request = new Request(
			"https://kestrelhollow.example.com/api/contact?email=a%40example.com#x",
			{
				method: "POST",
				headers: {
					"user-agent": "Mozilla/5.0 Test",
					cookie: "gate_session=secret",
					"x-forwarded-for": "203.0.113.9",
				},
				body: JSON.stringify({ name: "A Reader", email: "a@example.com", message: "Hello" }),
			},
		);
		const error = new TypeError("Cannot read the relay's answer");
		const [header, item, event] = lines(
			buildEnvelope(
				error,
				DSN,
				{ request, tags: { route: "contact" } },
				new Date("2026-11-22T10:00:00Z"),
			),
		);

		expect(header).toMatchObject({ dsn: DSN, sent_at: "2026-11-22T10:00:00.000Z" });
		expect(header.event_id).toMatch(/^[0-9a-f]{32}$/);
		expect(item).toEqual({ type: "event" });
		expect(event.event_id).toBe(header.event_id);
		expect(event).toMatchObject({
			timestamp: Date.parse("2026-11-22T10:00:00Z") / 1000,
			platform: "javascript",
			level: "error",
			release: "0123abc",
			environment: "production",
			tags: { runtime: "node", route: "contact" },
		});
		expect(event.exception.values[0]).toMatchObject({
			type: "TypeError",
			value: "Cannot read the relay's answer",
		});
		expect(event.exception.values[0].stacktrace.frames.length).toBeGreaterThan(0);
		// The method, the path, and the user agent; never the query, the body, or another header.
		expect(event.request).toEqual({
			method: "POST",
			url: "https://kestrelhollow.example.com/api/contact",
			headers: { "User-Agent": "Mozilla/5.0 Test" },
		});
		const text = JSON.stringify(event);
		for (const secret of [
			"a@example.com",
			"a%40example.com",
			"A Reader",
			"Hello",
			"gate_session",
			"203.0.113.9",
		]) {
			expect(text).not.toContain(secret);
		}
	});

	it("takes the release and environment it is given over the platform's, and a thrown non error as its words", () => {
		vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123abc");
		const [, , event] = lines(
			buildEnvelope("relay down", DSN, { release: "v2", environment: "preview" }),
		);
		expect(event.release).toBe("v2");
		expect(event.environment).toBe("preview");
		expect(event.exception.values[0]).toEqual({ type: "Error", value: "relay down" });
		expect(event.request).toBeUndefined();
	});
});

describe("reportServerError", () => {
	it("sends nothing and resolves false with no DSN", async () => {
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", "");
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		await expect(reportServerError(new Error("x"))).resolves.toBe(false);
		await expect(reportServerError(new Error("x"), { dsn: "not a dsn" })).resolves.toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("posts the envelope to the DSN's ingest, SENTRY_DSN first, then VITE_SENTRY_DSN", async () => {
		const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
		vi.stubGlobal("fetch", fetch);
		vi.stubEnv("VITE_SENTRY_DSN", "https://browserkey@o9.ingest.example.com/9");
		await expect(reportServerError(new Error("x"))).resolves.toBe(true);
		expect(fetch.mock.calls[0]?.[0]).toBe(
			"https://o9.ingest.example.com/api/9/envelope/?sentry_key=browserkey&sentry_version=7",
		);
		vi.stubEnv("SENTRY_DSN", DSN);
		await reportServerError(new Error("x"));
		const [url, init] = fetch.mock.calls[1] as unknown as [string, RequestInit];
		expect(url).toContain("o123.ingest.example.com/api/4567/envelope/");
		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
			"application/x-sentry-envelope",
		);
		expect(lines(init.body as string)).toHaveLength(3);
	});

	it("lets the answer's body go unread rather than holding it open", async () => {
		const cancel = vi.fn(async () => {});
		const answer = new Response("{}", { status: 200 });
		Object.defineProperty(answer, "body", { value: { cancel } });
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => answer),
		);
		await expect(reportServerError(new Error("x"), { dsn: DSN })).resolves.toBe(true);
		expect(cancel).toHaveBeenCalledOnce();
	});

	it("never throws: a failed send, a refusal, and a send that hangs past the timeout all resolve false", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => {
				throw new TypeError("fetch failed");
			}),
		);
		await expect(reportServerError(new Error("x"), { dsn: DSN })).resolves.toBe(false);

		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("no", { status: 429 })),
		);
		await expect(reportServerError(new Error("x"), { dsn: DSN })).resolves.toBe(false);

		vi.stubGlobal(
			"fetch",
			vi.fn(
				(_url: string, init: RequestInit) =>
					new Promise((_resolve, reject) => {
						init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
					}),
			),
		);
		await expect(reportServerError(new Error("x"), { dsn: DSN, timeoutMs: 20 })).resolves.toBe(
			false,
		);
	});
});

describe("reportServerErrorLater", () => {
	const VERCEL_CONTEXT = Symbol.for("@vercel/request-context");
	afterEach(() => {
		delete (globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT];
	});

	it("returns at once, before the send has answered, and hands the send to the context's waitUntil", async () => {
		let answer: (response: Response) => void = () => {};
		const fetch = vi.fn(() => new Promise<Response>((resolve) => (answer = resolve)));
		vi.stubGlobal("fetch", fetch);
		const held: Promise<unknown>[] = [];
		const context = { waitUntil: vi.fn((promise: Promise<unknown>) => held.push(promise)) };
		expect(reportServerErrorLater(new Error("x"), { dsn: DSN, context })).toBeUndefined();
		expect(fetch).toHaveBeenCalledOnce();
		expect(context.waitUntil).toHaveBeenCalledOnce();
		answer(new Response("{}"));
		await expect(held[0]).resolves.toBe(true);
	});

	it("finds Vercel's own waitUntil on the request context when no context is given", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("{}")),
		);
		const waitUntil = vi.fn();
		(globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT] = { get: () => ({ waitUntil }) };
		reportServerErrorLater(new Error("x"), { dsn: DSN });
		expect(waitUntil).toHaveBeenCalledOnce();
		await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBe(true);
	});

	it("falls through to the platform's waitUntil when the context has none it can call, or its own throws", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("{}")),
		);
		const waitUntil = vi.fn();
		(globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT] = { get: () => ({ waitUntil }) };
		const contexts = [
			{},
			{ waitUntil: "not a function" },
			{
				waitUntil: () => {
					throw new Error("closed");
				},
			},
		];
		for (const context of contexts) {
			expect(() =>
				reportServerErrorLater(new Error("x"), {
					dsn: DSN,
					context: context as unknown as { waitUntil(promise: Promise<unknown>): void },
				}),
			).not.toThrow();
		}
		expect(waitUntil).toHaveBeenCalledTimes(3);
		for (const [promise] of waitUntil.mock.calls) await expect(promise).resolves.toBe(true);
	});

	it("still sends with no waitUntil anywhere, and never throws, a throwing context included", async () => {
		const fetch = vi.fn(async () => new Response("{}"));
		vi.stubGlobal("fetch", fetch);
		expect(() => reportServerErrorLater(new Error("x"), { dsn: DSN })).not.toThrow();
		const context = {
			waitUntil: () => {
				throw new Error("no");
			},
		};
		expect(() => reportServerErrorLater(new Error("x"), { dsn: DSN, context })).not.toThrow();
		await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
	});
});

describe("withErrorReporting", () => {
	it("passes a handler's answer through untouched", async () => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const handler = withErrorReporting(async () => new Response("ok"), { dsn: DSN });
		const response = await handler(new Request("https://example.com/api/contact"));
		expect(await response.text()).toBe("ok");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("reports a throw with the request, then throws it again", async () => {
		const fetch = vi.fn(async () => new Response("{}"));
		vi.stubGlobal("fetch", fetch);
		const boom = new Error("relay exploded");
		const handler = withErrorReporting(
			async (_request: Request) => {
				throw boom;
			},
			{ dsn: DSN, tags: { route: "contact" } },
		);
		await expect(
			handler(new Request("https://example.com/api/contact?x=1", { method: "POST" })),
		).rejects.toBe(boom);
		const body = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string;
		const [, , event] = lines(body);
		expect(event.request).toMatchObject({ method: "POST", url: "https://example.com/api/contact" });
		expect(event.tags.route).toBe("contact");
		expect(event.exception.values[0].value).toBe("relay exploded");
	});
});

describe("refusalError and reportRefusedResponse", () => {
	const VERCEL_CONTEXT = Symbol.for("@vercel/request-context");
	afterEach(() => {
		delete (globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT];
	});

	const refused = (body: unknown, status = 422) =>
		new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

	it("keeps the status and the body's name and message alone", async () => {
		const error = await refusalError(
			refused({ name: "validation_error", message: "Bad domain.", statusCode: 422, extra: "x" }),
			"Resend",
		);
		expect(error.message).toBe("Resend answered 422: validation_error: Bad domain.");
		expect((await refusalError(refused("<html>oops</html>", 500))).message).toBe(
			"The upstream service answered 500",
		);
		expect((await refusalError(refused({ name: 7, message: "  " }, 429))).message).toBe(
			"The upstream service answered 429",
		);
	});

	it("never lets an address in the refusal survive, in any shape it is quoted", async () => {
		const addresses = [
			"jane.doe+forms@example.com",
			"<Jane.Doe@Mail.Example.com>",
			'"sam_o\'neil@example.com"',
			"mailto:owner@sub.example.com",
			"a@b.example.com, c@d.example.test",
			"x%y@example.test;",
		];
		for (const address of addresses) {
			const error = await refusalError(
				refused({ name: `refused ${address}`, message: `The to field ${address} is invalid` }),
			);
			expect(error.message, address).not.toMatch(/@/);
			expect(error.message).toContain("[address]");
		}
	});

	it("keeps a sentence's closing period outside the address it scrubs", async () => {
		const error = await refusalError(
			refused({ name: "validation_error", message: "Cannot send to owner@example.com." }),
		);
		expect(error.message).toBe(
			"The upstream service answered 422: validation_error: Cannot send to [address].",
		);
	});

	it("scrubs phone number shapes, and leaves a status, a count, and a year", async () => {
		for (const number of ["(555) 555-0142", "+1 555 555 0143", "555.555.0144", "5555550145"]) {
			const error = await refusalError(
				refused({ name: "refused", message: `Call ${number} to confirm` }),
			);
			expect(error.message, number).toBe(
				"The upstream service answered 422: refused: Call [number] to confirm",
			);
		}
		const kept = await refusalError(
			refused({ name: "rate_limit", message: "429 after 120 sends since 2026" }),
		);
		expect(kept.message).toBe(
			"The upstream service answered 422: rate_limit: 429 after 120 sends since 2026",
		);
	});

	it("cuts each field to 300 characters", async () => {
		const error = await refusalError(refused({ name: "n", message: "m".repeat(1000) }));
		expect(error.message.length).toBeLessThan(360);
	});

	it("reports the refusal later, on the platform's waitUntil, with no address in what is sent", async () => {
		const fetch = vi.fn(async () => new Response("{}"));
		vi.stubGlobal("fetch", fetch);
		const waitUntil = vi.fn();
		(globalThis as Record<symbol, unknown>)[VERCEL_CONTEXT] = { get: () => ({ waitUntil }) };
		await reportRefusedResponse(
			refused({ name: "validation_error", message: "Cannot send to owner@example.com" }),
			{ dsn: DSN, service: "Resend", tags: { route: "contact" } },
		);
		expect(waitUntil).toHaveBeenCalledOnce();
		await waitUntil.mock.calls[0]?.[0];
		const body = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string;
		expect(body).not.toContain("owner@example.com");
		const [, , event] = lines(body);
		expect(event.exception.values[0].value).toBe(
			"Resend answered 422: validation_error: Cannot send to [address]",
		);
		expect(event.tags.route).toBe("contact");
	});
});
