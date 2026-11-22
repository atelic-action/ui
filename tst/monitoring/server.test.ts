// @vitest-environment node
import {
	buildEnvelope,
	parseDSN,
	parseStack,
	reportServerError,
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
