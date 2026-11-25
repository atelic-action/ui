// @vitest-environment node
import {
	type GuardVerdict,
	SITEVERIFY_URL,
	TURNSTILE_PRIVACY_ADDENDUM_URL,
	TURNSTILE_PRIVACY_NOTICE,
	TURNSTILE_TOKEN_KEY,
	turnstileGuard,
} from "../../src/forms/guard";

describe("the privacy notice", () => {
	it("names Cloudflare Turnstile and references its Privacy Addendum, as the invisible widget requires", () => {
		expect(TURNSTILE_PRIVACY_NOTICE).toContain("Cloudflare Turnstile");
		expect(TURNSTILE_PRIVACY_NOTICE).toContain("Turnstile Privacy Addendum");
		expect(TURNSTILE_PRIVACY_NOTICE).toContain(TURNSTILE_PRIVACY_ADDENDUM_URL);
		expect(TURNSTILE_PRIVACY_ADDENDUM_URL).toBe(
			"https://www.cloudflare.com/turnstile-privacy-policy/",
		);
	});
});

const TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const SECRET = "1x0000000000000000000000000000000AA";
const ID = "5b2c7f4e-1d3a-4c8e-9f60-2a7b8c9d0e1f";

function request(headers: Record<string, string> = {}): Request {
	return new Request("http://localhost/api/contact", { method: "POST", headers });
}

/** A signal the endpoint never aborts. */
function open(): AbortSignal {
	return new AbortController().signal;
}

function answer(body: unknown, status = 200): Response {
	return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

/** The body of the one call made to siteverify. */
function sentBody(): Record<string, unknown> {
	const call = vi.mocked(fetch).mock.calls[0];
	expect(call?.[0]).toBe(SITEVERIFY_URL);
	return JSON.parse(String(call?.[1]?.body));
}

/** A verdict's cause, checked to carry neither the token nor the secret. */
function causeOf(verdict: GuardVerdict): string {
	if (verdict.status === "passed") throw new Error("a passed verdict has no cause");
	const words = `${verdict.cause.message} ${String((verdict.cause.cause as Error | undefined)?.message ?? "")}`;
	expect(words).not.toContain(TOKEN);
	expect(words).not.toContain(SECRET);
	return verdict.cause.message;
}

describe("turnstileGuard", () => {
	beforeEach(() => {
		vi.stubEnv("TURNSTILE_SECRET_KEY", SECRET);
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(answer({ success: true })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("is named turnstile and reads its token from the turnstile key", () => {
		const guard = turnstileGuard();
		expect(guard.name).toBe("turnstile");
		expect(guard.tokenKey).toBe("turnstile");
		expect(TURNSTILE_TOKEN_KEY).toBe("turnstile");
	});

	it("passes a token Cloudflare passes, sending the secret, the token, the address, and the id", async () => {
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
			signal: open(),
		});
		expect(verdict).toEqual({ status: "passed" });
		expect(sentBody()).toEqual({
			secret: SECRET,
			response: TOKEN,
			remoteip: "203.0.113.7",
			idempotency_key: ID,
		});
		expect(vi.mocked(fetch).mock.calls[0]?.[1]?.method).toBe("POST");
	});

	it("leaves the address out when the platform gave none", async () => {
		await turnstileGuard().check(TOKEN, { id: ID, request: request(), signal: open() });
		expect(sentBody()).not.toHaveProperty("remoteip");
	});

	it("reads the secret at each check, and takes one given in the options first", async () => {
		const guard = turnstileGuard();
		vi.stubEnv("TURNSTILE_SECRET_KEY", "later-secret");
		await guard.check(TOKEN, { id: ID, request: request(), signal: open() });
		expect(sentBody().secret).toBe("later-secret");
		vi.mocked(fetch).mockClear();
		await turnstileGuard({ secret: "given-secret" }).check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(sentBody().secret).toBe("given-secret");
	});

	it("calls an empty token unanswered without calling Cloudflare", async () => {
		const verdict = await turnstileGuard().check("", {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict).toMatchObject({ status: "unanswered", quiet: true });
		expect(causeOf(verdict)).toBe("the form sent no token");
		expect(fetch).not.toHaveBeenCalled();
	});

	it.each([["invalid-input-response"], ["timeout-or-duplicate"]])(
		"refuses a token Cloudflare answers %s",
		async (code) => {
			vi.mocked(fetch).mockResolvedValue(answer({ success: false, "error-codes": [code] }));
			const verdict = await turnstileGuard().check(TOKEN, {
				id: ID,
				request: request(),
				signal: open(),
			});
			expect(verdict.status).toBe("failed");
			expect(causeOf(verdict)).toBe(`Turnstile refused the token: ${code}`);
		},
	);

	it.each([
		["internal-error"],
		["invalid-input-secret"],
		["missing-input-secret"],
		["missing-input-response"],
		// A request Cloudflare could not read is the endpoint's fault, never the visitor's.
		["bad-request"],
	])("lets a token through unanswered when Cloudflare answers %s", async (code) => {
		vi.mocked(fetch).mockResolvedValue(answer({ success: false, "error-codes": [code] }));
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict).toMatchObject({ status: "unanswered" });
		expect(verdict).not.toHaveProperty("unset");
		expect(verdict).not.toHaveProperty("quiet");
		expect(causeOf(verdict)).toBe(`Turnstile could not answer: ${code}`);
	});

	it("lets a token through when a refusing code comes beside one that cannot answer", async () => {
		vi.mocked(fetch).mockResolvedValue(
			answer({ success: false, "error-codes": ["invalid-input-response", "internal-error"] }),
		);
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict.status).toBe("unanswered");
	});

	it("lets a token through when Cloudflare says no with no code at all", async () => {
		vi.mocked(fetch).mockResolvedValue(answer({ success: false }));
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict.status).toBe("unanswered");
		expect(causeOf(verdict)).toBe("Turnstile could not answer: no error code");
	});

	it("marks an unset secret as a missing setting, without calling Cloudflare", async () => {
		vi.stubEnv("TURNSTILE_SECRET_KEY", "");
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict).toMatchObject({ status: "unanswered", unset: true });
		expect(causeOf(verdict)).toContain("TURNSTILE_SECRET_KEY unset");
		expect(fetch).not.toHaveBeenCalled();
	});

	it("reads a missing token with no secret as the missing setting, not the missing token", async () => {
		vi.stubEnv("TURNSTILE_SECRET_KEY", "");
		const verdict = await turnstileGuard().check("", {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict).toMatchObject({ status: "unanswered", unset: true });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("lets a token through when the fetch throws, the error chained under the cause", async () => {
		const thrown = new TypeError("fetch failed");
		vi.mocked(fetch).mockRejectedValue(thrown);
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict.status).toBe("unanswered");
		expect(causeOf(verdict)).toBe("Turnstile could not be reached");
		if (verdict.status === "unanswered") expect(verdict.cause.cause).toBe(thrown);
	});

	it.each([[500], [429], [404]])(
		"lets a token through when Cloudflare answers %i",
		async (status) => {
			vi.mocked(fetch).mockResolvedValue(answer({ success: true }, status));
			const verdict = await turnstileGuard().check(TOKEN, {
				id: ID,
				request: request(),
				signal: open(),
			});
			expect(verdict.status).toBe("unanswered");
			expect(causeOf(verdict)).toBe(`Turnstile answered ${status}`);
		},
	);

	it.each([
		["not JSON", "<html>oops</html>"],
		["JSON that is not an object", "null"],
	])("lets a token through when the answer is %s", async (_name, body) => {
		vi.mocked(fetch).mockResolvedValue(answer(body));
		const verdict = await turnstileGuard().check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		expect(verdict.status).toBe("unanswered");
		expect(causeOf(verdict)).toBe("Turnstile's answer was not JSON");
	});

	it("gives up at the time limit, aborting the call, and lets the token through", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		let aborted = false;
		vi.mocked(fetch).mockImplementation(
			(_input, init) =>
				new Promise<Response>(() => {
					init?.signal?.addEventListener("abort", () => {
						aborted = true;
					});
				}),
		);
		let settled: GuardVerdict | undefined;
		const pending = turnstileGuard()
			.check(TOKEN, { id: ID, request: request(), signal: open() })
			.then((verdict) => {
				settled = verdict;
			});
		await vi.advanceTimersByTimeAsync(2999);
		expect(settled).toBeUndefined();
		await vi.advanceTimersByTimeAsync(1);
		await pending;
		expect(aborted).toBe(true);
		expect(settled?.status).toBe("unanswered");
		if (settled) expect(causeOf(settled)).toBe("Turnstile sent no answer within 3000 ms");
	});

	it("takes its own time limit", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		vi.mocked(fetch).mockImplementation(() => new Promise<Response>(() => {}));
		const pending = turnstileGuard({ timeoutMs: 500 }).check(TOKEN, {
			id: ID,
			request: request(),
			signal: open(),
		});
		await vi.advanceTimersByTimeAsync(500);
		const verdict = await pending;
		expect(causeOf(verdict)).toBe("Turnstile sent no answer within 500 ms");
	});
});

describe("turnstileGuard and the endpoint's signal", () => {
	beforeEach(() => {
		vi.stubEnv("TURNSTILE_SECRET_KEY", SECRET);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("aborts its call when the endpoint stops waiting, before its own limit", async () => {
		let seen: AbortSignal | undefined;
		vi.stubGlobal(
			"fetch",
			vi.fn(
				(_input: RequestInfo | URL, init?: RequestInit) =>
					new Promise<Response>((_resolve, reject) => {
						seen = init?.signal ?? undefined;
						init?.signal?.addEventListener("abort", () =>
							reject(new DOMException("This operation was aborted", "AbortError")),
						);
					}),
			),
		);
		const endpoint = new AbortController();
		const pending = turnstileGuard({ timeoutMs: 60_000 }).check(TOKEN, {
			id: ID,
			request: request(),
			signal: endpoint.signal,
		});
		await vi.waitFor(() => expect(seen).toBeDefined());
		endpoint.abort();
		expect(seen?.aborted).toBe(true);
		const verdict = await pending;
		expect(verdict.status).toBe("unanswered");
	});
});
