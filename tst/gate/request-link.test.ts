// @vitest-environment node
import { createRequestLink, linkBase, POST } from "../../src/gate/request-link";
import { verifyToken } from "../../src/gate/tokens";

const SECRET = "a-test-secret-long-enough-to-sign-with";

function request(body: unknown): Request {
	return new Request("http://localhost/api/auth/request-link", {
		method: "POST",
		headers: { "Content-Type": "application/json", host: "client.atelic.me" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

/** Runs a handler through its fixed wait on the fake clock. */
async function answer(pending: Promise<Response>): Promise<Response> {
	await vi.advanceTimersByTimeAsync(5000);
	return pending;
}

describe("POST /api/auth/request-link", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
		vi.stubEnv("GATE_ALLOWLIST", "sharon@example.com, owner@example.com");
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("GATE_BASE_URL", "https://client.atelic.me");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("emails a magic link to an allowlisted address", async () => {
		const response = await answer(POST(request({ email: "Sharon@example.com", next: "/about" })));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true });

		const send = vi.mocked(fetch).mock.calls[0];
		expect(send?.[0]).toBe("https://api.resend.com/emails");
		const payload = JSON.parse(String(send?.[1]?.body));
		expect(payload.to).toEqual(["sharon@example.com"]);
		expect(payload.html).toContain("https://client.atelic.me/api/auth/verify?token=");
		expect(send?.[1]?.headers).toMatchObject({ Authorization: "Bearer re_test_key" });
	});

	it.each([
		["/about", "/about"],
		["//evil.example", "/"],
		["/\\evil.example", "/"],
		["/\t/evil.example", "/"],
	])("signs next %j into the link as %j", async (next, signed) => {
		await answer(POST(request({ email: "sharon@example.com", next })));
		const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		const token = new URL(payload.text.match(/https:\S+/)[0]).searchParams.get("token");
		const claims = await verifyToken(token, SECRET);
		expect(claims?.n).toBe(signed);
	});

	it("sends nothing for an address not on the allowlist, but responds identically", async () => {
		const response = await answer(POST(request({ email: "stranger@example.com" })));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rejects malformed JSON", async () => {
		const response = await answer(POST(request("{nope")));
		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("sends nothing when the gate is off (no secret)", async () => {
		vi.stubEnv("GATE_SESSION_SECRET", "");
		const response = await answer(POST(request({ email: "sharon@example.com" })));
		expect(response.status).toBe(200);
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe("POST /api/auth/request-link, hardening", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
		vi.stubEnv("GATE_ALLOWLIST", "sharon@example.com");
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it.each([
		["null", "null"],
		["an array", "[]"],
		["a string", '"sharon@example.com"'],
		["a number", "7"],
	])("answers 400 to a body that parses to %s", async (_name, body) => {
		const response = await answer(POST(request(body)));
		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("never builds the link from a forwarded host", async () => {
		const forged = new Request("https://client.atelic.me/api/auth/request-link", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-forwarded-host": "evil.example",
				"x-forwarded-proto": "http",
			},
			body: JSON.stringify({ email: "sharon@example.com" }),
		});
		await answer(POST(forged));
		const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(payload.text).toContain("https://client.atelic.me/api/auth/verify?token=");
		expect(payload.text).not.toContain("evil.example");
		expect(payload.html).not.toContain("evil.example");
	});

	it("answers a stranger and an allowlisted reader after the same wait", async () => {
		const settledAt = async (email: string) => {
			let settled = false;
			const pending = POST(request({ email })).then((response) => {
				settled = true;
				return response;
			});
			await vi.advanceTimersByTimeAsync(1999);
			const early = settled;
			await vi.advanceTimersByTimeAsync(1);
			await pending;
			return { early, settled };
		};
		expect(await settledAt("stranger@example.com")).toEqual({ early: false, settled: true });
		expect(await settledAt("sharon@example.com")).toEqual({ early: false, settled: true });
	});

	it("names what the link opens when a site says so", async () => {
		const preview = createRequestLink({ noun: "preview" });
		await answer(preview(request({ email: "sharon@example.com" })));
		const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(payload.subject).toBe("Your private link to the preview");
		expect(payload.html).toContain("Open the preview");
	});
});

describe("linkBase", () => {
	const at = (url: string) => new Request(url, { headers: { "x-forwarded-host": "evil.example" } });

	it("uses the configured base, without a trailing slash", () => {
		expect(linkBase(at("https://a.test/x"), { GATE_BASE_URL: "https://client.atelic.me/" })).toBe(
			"https://client.atelic.me",
		);
	});

	it("uses the project's own domain on production", () => {
		expect(
			linkBase(at("https://a.test/x"), {
				VERCEL_ENV: "production",
				VERCEL_PROJECT_PRODUCTION_URL: "client.atelic.me",
			}),
		).toBe("https://client.atelic.me");
	});

	it("otherwise uses the host the request reached, never a forwarded one", () => {
		expect(
			linkBase(at("https://preview-abc.vercel.app/api/auth/request-link"), {
				VERCEL_ENV: "preview",
				VERCEL_PROJECT_PRODUCTION_URL: "client.atelic.me",
			}),
		).toBe("https://preview-abc.vercel.app");
	});
});

describe("POST /api/auth/request-link, a send that goes wrong", () => {
	let logged: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
		vi.stubEnv("GATE_ALLOWLIST", "sharon@example.com");
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		logged = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		logged.mockRestore();
	});

	it("gives a hung send up before the answer is due, so it answers on time", async () => {
		// A send that never settles on its own, only when its signal aborts.
		vi.stubGlobal(
			"fetch",
			vi.fn(
				(_url: string, init: RequestInit) =>
					new Promise((_resolve, reject) => {
						init.signal?.addEventListener("abort", () =>
							reject(new DOMException("aborted", "AbortError")),
						);
					}),
			),
		);
		let settled = false;
		const pending = POST(request({ email: "sharon@example.com" })).finally(() => {
			settled = true;
		});
		// Reading the body and signing are real work off the fake clock, so
		// wait for the send to start before moving the clock.
		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
		await vi.advanceTimersByTimeAsync(1600);
		expect(settled).toBe(false);
		// The send is given up at 1700 and the answer is due at 2000, both
		// counted from before the send began.
		await vi.advanceTimersByTimeAsync(400);
		expect(settled).toBe(true);
		expect((await pending).status).toBe(200);
		expect(logged).toHaveBeenCalledWith(expect.stringContaining("AbortError"));
	});

	it("logs a send Resend refused, and answers as ever", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })));
		const response = await answer(POST(request({ email: "sharon@example.com" })));
		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(logged).toHaveBeenCalledWith(expect.stringContaining("403"));
	});

	it("logs a missing sending key, and answers as ever", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubGlobal("fetch", vi.fn());
		const response = await answer(POST(request({ email: "sharon@example.com" })));
		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(fetch).not.toHaveBeenCalled();
		expect(logged).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY"));
	});

	it.each(["-5", "0", "Infinity", "soon"])(
		"falls back to a fifteen minute link when GATE_LINK_TTL_MIN is %j",
		async (ttl) => {
			vi.stubEnv("GATE_LINK_TTL_MIN", ttl);
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
			const before = Math.floor(Date.now() / 1000);
			await answer(POST(request({ email: "sharon@example.com" })));
			const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
			const token = new URL(payload.text.match(/https?:\S+/)[0]).searchParams.get("token");
			const claims = await verifyToken(token, SECRET);
			expect(claims?.x).toBe(before + 15 * 60);
		},
	);
});

describe("linkBase, a configured base", () => {
	const here = new Request("https://preview-abc.vercel.app/api/auth/request-link");

	it("reads a bare host as https", () => {
		expect(linkBase(here, { GATE_BASE_URL: "client.atelic.me" })).toBe("https://client.atelic.me");
	});

	it("keeps the host and drops any path", () => {
		expect(linkBase(here, { GATE_BASE_URL: "https://client.atelic.me/writeup/" })).toBe(
			"https://client.atelic.me",
		);
	});

	it("falls back to the request's own host when it is not a URL at all", () => {
		const logged = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(linkBase(here, { GATE_BASE_URL: "https://" })).toBe("https://preview-abc.vercel.app");
		expect(logged).toHaveBeenCalledWith(expect.stringContaining("GATE_BASE_URL"));
		logged.mockRestore();
	});
});

describe("POST /api/auth/request-link, what the email carries", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
		vi.stubEnv("GATE_ALLOWLIST", "sharon@example.com");
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	const sent = () => JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));

	it("escapes the noun in the HTML and leaves the text as written", async () => {
		const handler = createRequestLink({ noun: "Q&A <draft>" });
		await answer(handler(request({ email: "sharon@example.com" })));
		expect(sent().html).toContain("Open the Q&amp;A &lt;draft&gt;");
		expect(sent().html).not.toContain("<draft>");
		expect(sent().text).toContain("Your private link to the Q&A <draft>:");
	});

	it("signs a whole second expiry from a fractional lifetime", async () => {
		vi.stubEnv("GATE_LINK_TTL_MIN", "0.51");
		const before = Math.floor(Date.now() / 1000);
		await answer(POST(request({ email: "sharon@example.com" })));
		const token = new URL(sent().text.match(/https?:\S+/)[0]).searchParams.get("token");
		expect((await verifyToken(token, SECRET))?.x).toBe(before + 31);
	});

	it("drops a next too long to be a real path", async () => {
		await answer(POST(request({ email: "sharon@example.com", next: `/${"a".repeat(4000)}` })));
		const token = new URL(sent().text.match(/https?:\S+/)[0]).searchParams.get("token");
		expect((await verifyToken(token, SECRET))?.n).toBe("/");
	});
});
