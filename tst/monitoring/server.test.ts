// @vitest-environment node
import {
	buildEnvelope,
	parseDSN,
	parseStack,
	refusalError,
	reportRefusedResponse,
	reportServerError,
	reportServerErrorLater,
	scrub,
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

describe("buildEnvelope's chain of causes", () => {
	const valuesOf = (error: unknown) => lines(buildEnvelope(error, DSN))[2].exception.values;

	it("sends a two level cause chain innermost first, each cause linked to the one it caused", () => {
		const dns = Object.assign(new Error("getaddrinfo ENOTFOUND relay.example.com"), {
			code: "ENOTFOUND",
		});
		const socket = new Error("connect failed", { cause: dns });
		const thrown = new TypeError("fetch failed", { cause: socket });
		const values = valuesOf(thrown);
		expect(values).toHaveLength(3);
		expect(values.map((value: { type: string }) => value.type)).toEqual([
			"Error",
			"Error",
			"TypeError",
		]);
		expect(values[0].value).toBe("getaddrinfo ENOTFOUND relay.example.com");
		expect(values[1].value).toBe("connect failed");
		expect(values[2].value).toBe("fetch failed");
		expect(values[0].mechanism).toEqual({
			type: "chained",
			source: "cause",
			exception_id: 2,
			parent_id: 1,
		});
		expect(values[1].mechanism).toEqual({
			type: "chained",
			source: "cause",
			exception_id: 1,
			parent_id: 0,
		});
		expect(values[2].mechanism).toEqual({ type: "generic", handled: true, exception_id: 0 });
		for (const value of values) expect(value.stacktrace.frames.length).toBeGreaterThan(0);
	});

	it("ends a cyclic chain at the first cause met twice", () => {
		const first = new Error("first");
		const second = new Error("second", { cause: first });
		(first as { cause?: unknown }).cause = second;
		const values = valuesOf(first);
		expect(values.map((value: { value: string }) => value.value)).toEqual(["second", "first"]);
		const self = new Error("self");
		(self as { cause?: unknown }).cause = self;
		expect(valuesOf(self)).toEqual([expect.objectContaining({ value: "self" })]);
	});

	it("follows no more than five causes", () => {
		let error: Error = new Error("cause 9");
		for (let at = 8; at >= 0; at--) error = new Error(`cause ${at}`, { cause: error });
		const values = valuesOf(error);
		expect(values).toHaveLength(6);
		expect(values[0].value).toBe("cause 5");
	});

	it("carries a cause's code, alone or ahead of words that do not say it", () => {
		const bare = new TypeError("fetch failed", { cause: { code: "ECONNRESET" } });
		const [reset] = valuesOf(bare);
		expect(reset).toEqual(expect.objectContaining({ type: "Error", value: "ECONNRESET" }));
		expect(reset.stacktrace).toBeUndefined();
		const tls = Object.assign(new Error("unable to verify the first certificate"), {
			code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
			stack: undefined,
		});
		const [verify] = valuesOf(new TypeError("fetch failed", { cause: tls }));
		expect(verify.value).toBe(
			"UNABLE_TO_VERIFY_LEAF_SIGNATURE: unable to verify the first certificate",
		);
	});

	it("scrubs an address and a number in a cause's words, and cuts each message to 300 characters", () => {
		const cause = new Error(`Rejected owner@example.com, call 555-555-0142 ${"x".repeat(400)}`);
		const values = valuesOf(new Error("y".repeat(400), { cause }));
		expect(values[0].value.startsWith("Rejected [address], call [number] ")).toBe(true);
		expect(values[0].value).toHaveLength(300);
		expect(values[1].value).toHaveLength(300);
		expect(JSON.stringify(values)).not.toContain("owner@example.com");
		expect(JSON.stringify(values)).not.toContain("555-555-0142");
	});

	it("scrubs a plain object thrown at the top, its nested cause included", () => {
		const thrown = {
			reason: "Rejected owner@example.com",
			cause: { detail: "call 555-555-0142", deeper: { cause: "ops@example.com" } },
		};
		const values = valuesOf(thrown);
		const sent = JSON.stringify(values);
		expect(sent).not.toContain("owner@example.com");
		expect(sent).not.toContain("555-555-0142");
		expect(sent).not.toContain("ops@example.com");
		// The thrown value is last, as Sentry orders a chain, and still reads as
		// itself; its cause is a link of its own, scrubbed too.
		expect(values.at(-1).value).toContain("Rejected [address]");
		expect(values[0].value).toContain("call [number]");
	});

	it("leaves a plain object's own cause out of its JSON, since the chain reports it", () => {
		const values = valuesOf({ reason: "first", cause: { detail: "second" } });
		expect(values).toHaveLength(2);
		expect(values.at(-1).value).toBe('{"reason":"first"}');
		expect(values[0].value).toBe('{"detail":"second"}');
	});

	it("cuts a huge plain object before the scrub, and leaves no part of a number the cut split", () => {
		// Addresses the scrub shortens, then a number the cut at 500 splits after
		// "555-5", so what is left of it would slide inside the 300 kept.
		const addresses = Array.from({ length: 5 }, (_, at) => `${"u".repeat(60)}${at}@example.com`);
		const head = `{"a":"${addresses.join(" ")} `;
		const fill = "x".repeat(500 - head.length - '","b":"call 555-5'.length);
		const thrown = { a: `${addresses.join(" ")} ${fill}`, b: "call 555-555-0142 now" };
		expect(JSON.stringify(thrown).slice(0, 500).endsWith("call 555-5")).toBe(true);
		const [only] = valuesOf(thrown);
		expect(only.value.length).toBeLessThanOrEqual(300);
		expect(only.value).toContain("[address]");
		expect(only.value).not.toMatch(/555/);
		// A huge object is cut to the cap, whatever its size.
		const huge = { list: Array.from({ length: 50_000 }, (_, at) => `item ${at}`) };
		expect(valuesOf(huge)[0].value).toHaveLength(300);
	});

	it("drops only the field whose getter throws, on the thrown value and on any cause", () => {
		const trap = (keep: Record<string, unknown>, bad: string[]) => {
			const value = Object.assign(new Error("placeholder"), keep);
			for (const key of bad) {
				Object.defineProperty(value, key, {
					get() {
						throw new Error(`no ${key}`);
					},
				});
			}
			return value;
		};
		for (const key of ["message", "name", "stack", "code"]) {
			const cause = trap({ code: "ECONNRESET" }, [key]);
			const thrown = trap({}, [key]);
			Object.defineProperty(thrown, "cause", { value: cause });
			const envelope = () => buildEnvelope(thrown, DSN);
			expect(envelope, key).not.toThrow();
			const values = valuesOf(thrown);
			expect(values, key).toHaveLength(2);
			if (key !== "message") expect(values[1].value, key).toBe("placeholder");
			if (key === "name") expect(values[1].type).toBe("Error");
			if (key === "code") expect(values[0].value).toBe("placeholder");
			else if (key !== "message") expect(values[0].value).toBe("ECONNRESET: placeholder");
		}
	});

	it("reads a proxy whose every trap throws as an error with no words, never throwing", () => {
		const hostile = new Proxy(
			{},
			{
				get() {
					throw new Error("trap");
				},
				has() {
					throw new Error("trap");
				},
				getPrototypeOf() {
					throw new Error("trap");
				},
				ownKeys() {
					throw new Error("trap");
				},
			},
		);
		expect(() => buildEnvelope(hostile, DSN)).not.toThrow();
		expect(() => buildEnvelope(new Error("outer", { cause: hostile }), DSN)).not.toThrow();
	});

	it("writes a value with no prototype that JSON cannot write without throwing", () => {
		const bare = Object.create(null) as Record<string, unknown>;
		bare.size = 10n;
		const [only] = valuesOf(bare);
		expect(only).toEqual({ type: "Error", value: "A value that cannot be written was thrown" });
		const plain = Object.create(null) as Record<string, unknown>;
		plain.reason = "owner@example.com";
		expect(valuesOf(plain)[0].value).toBe('{"reason":"[address]"}');
	});

	it("leaves an error with no cause the one exception it always was, with no mechanism", () => {
		const [only, ...rest] = valuesOf(new Error("relay exploded"));
		expect(rest).toEqual([]);
		expect(only.mechanism).toBeUndefined();
		expect(only.value).toBe("relay exploded");
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

	it("scrubs a phone however it is grouped and separated", async () => {
		const numbers = [
			"(555) 555-0142",
			"(555)555-0142",
			"+1 555 555 0143",
			"+1-555-555-0143",
			"555.555.0144",
			"555/555-0144",
			"555\u2013555\u20130145",
			"555\u2014555\u20140145",
			"555\u2011555\u20110146",
			"555\u00a0555\u00a00147",
			"+44 20 7946 0958",
			"+15555550142",
		];
		for (const number of numbers) {
			const error = await refusalError(
				refused({ name: "refused", message: `Call ${number} to confirm` }),
			);
			expect(error.message, number).toBe(
				"The upstream service answered 422: refused: Call [number] to confirm",
			);
		}
	});

	it("scrubs a country code written without a plus sign", async () => {
		for (const number of [
			"1-555-555-0142",
			"1 555 555 0142",
			"1.555.555.0142",
			"1 (555) 555-0142",
		]) {
			const error = await refusalError(
				refused({ name: "refused", message: `Call ${number} to confirm` }),
			);
			expect(error.message, number).toBe(
				"The upstream service answered 422: refused: Call [number] to confirm",
			);
		}
	});

	it("scrubs a trailing extension with the number, leaving nothing of it behind", async () => {
		for (const number of [
			"555-555-0142x12",
			"555-555-0142 x12",
			"555-555-0142 ext. 12",
			"555-555-0142 Ext 12",
			"(555) 555-0142 extension 12",
			"+1 555 555 0142 ext. 12",
			"+15555550142x7",
		]) {
			const error = await refusalError(
				refused({ name: "refused", message: `Call ${number} to confirm` }),
			);
			expect(error.message, number).toBe(
				"The upstream service answered 422: refused: Call [number] to confirm",
			);
		}
	});

	it("leaves a dotted IPv4 address alone, whole", async () => {
		for (const ip of ["192.168.10.200", "10.120.130.140", "203.0.113.255", "255.255.255.0"]) {
			const message = `Refused from ${ip} after 3 tries`;
			const kept = await refusalError(refused({ name: "forbidden", message }));
			expect(kept.message, ip).toBe(`The upstream service answered 422: forbidden: ${message}`);
			const port = `Refused from ${ip}:8443.`;
			const withPort = await refusalError(refused({ name: "forbidden", message: port }));
			expect(withPort.message, ip).toBe(`The upstream service answered 422: forbidden: ${port}`);
		}
	});

	it("leaves a date, a bare id, a count beside a year, and a status alone", async () => {
		for (const message of [
			"On 2026-11-23 send 12345678 failed: 429 after 120 2026 sends",
			"Retry after 2026-11-23T10:00:00Z, status 503, request 4815162342",
			"1 of 3 failed at 2026-11-23, 12 2026 sends extra",
			"Code 422 on 2026/11/23 for id 90210",
		]) {
			const kept = await refusalError(refused({ name: "rate_limit", message }));
			expect(kept.message, message).toBe(
				`The upstream service answered 422: rate_limit: ${message}`,
			);
		}
	});

	it.each([
		["a slash written date", "Retry on 11/23/2026 at 10:00", true],
		["a slash written date, short year", "Retry on 1/2/26 at 10:00", true],
		["a dotted date", "Due 23.11.2026", true],
		["a hyphen written date", "Due 11-23-2026", true],
		["a leading zero street number", "Ship to 0123 Main St", true],
		["a count beside a year", "120 2026 sends", true],
		["a bare id", "id 12345678", true],
		["a ZIP", "ZIP 90210", true],
		["a ZIP and four", "ZIP 80202-1234", true],
		["a status", "status 429", true],
		["a seven digit number with a hyphen", "Call 555-0142 today", false],
		["a seven digit number with a space", "Call 555 0142 today", false],
		["seven digits run together, an id or a count", "Call 5550142 today", true],
		["a count of bytes", "read 4194304 bytes", true],
		["a round count", "count 9000000", true],
		["a count beside a year, three digits", "350 2026 sends", true],
		[
			"a number whose four digits read as a year, a trade the scrub takes",
			"Call 555 1999 today",
			true,
		],
		["two ports side by side, scrubbed the safe way", "port 443 8080", false],
		["a seven digit number with a dash", "Call 555\u20130142 today", false],
		["seven digits with a dot, read as a decimal", "Call 555.0142 today", true],
		["a time in seconds", "took 250.1234 s", true],
		["a price", "total 299.9900 USD", true],
		["a seven digit number with an extension", "Call 555-0142 x12 today", false],
		["a full number", "Call (555) 555-0142 today", false],
		["a slashed number", "Call 555/555-0144 today", false],
		["a country code", "Call 1-555-555-0142 today", false],
		["an area code in parentheses with a leading zero", "Call (0303) 555 0142 today", false],
		["E.164", "Call +15555550142 today", false],
		["a number abroad written with its trunk 0", "Call 020 7946 0958 today", false],
		// A leaked number is worse than a scrubbed address, so a street number
		// written as a run of groups is taken for one.
		["a leading zero street number run", "Ship to 0100 200 300 Main", false],
	])("scrub on %s", (_, text, kept) => {
		const scrubbed = scrub(text);
		if (kept) expect(scrubbed).toBe(text);
		else {
			expect(scrubbed).toContain("[number]");
			expect(scrubbed).not.toMatch(/\d{3}/);
		}
	});

	it("catches an internationalized domain and an underscore in a label", async () => {
		const error = await refusalError(
			refused({
				name: "refused",
				message: "To owner@b\u00e4ckerei.example and ops@mail_relay.example.com.",
			}),
		);
		expect(error.message).toBe(
			"The upstream service answered 422: refused: To [address] and [address].",
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
