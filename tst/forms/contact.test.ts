// @vitest-environment node
import {
	type ContactField,
	type ContactFields,
	createContact,
	DEFAULT_CONTACT_TO,
	PLAIN_FIELDS,
	SUBJECT_LIMIT,
} from "../../src/forms/contact";
import { turnstileGuard } from "../../src/forms/guard";
import { DEFAULT_RECEIPT_NOTE } from "../../src/forms/receipt";
import { type DestinationResult, refused, type Submission } from "../../src/forms/relay";

const FROM = "Summit Movement Studio <forms@example.com>";
/** The endpoint with the wait between tries cut to a millisecond, so a down destination's second try needs no clock. */
const POST = createContact({ from: FROM, retryWaitMs: 1 });
/** The endpoint on its defaults, for the tests that walk the clock. */
const TIMED = createContact({ from: FROM });
/** A try's limit, the wait, and the second try's limit. */
const WORST_CASE_MS = 3000 + 1000 + 3000;

function request(body: unknown): Request {
	return new Request("http://localhost/api/contact", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

const VALID = {
	name: "Jane Doe",
	email: "jane@example.com",
	topic: "Dry needling",
	message: "Do you have availability next week?",
	company: "",
};

describe("createContact", () => {
	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("relays a valid submission through Resend", async () => {
		const response = await POST(request(VALID));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });

		const send = vi.mocked(fetch).mock.calls[0];
		expect(send?.[0]).toBe("https://api.resend.com/emails");
		const payload = JSON.parse(String(send?.[1]?.body));
		expect(payload.to).toEqual(["inbox@example.com"]);
		expect(payload.reply_to).toEqual(["jane@example.com"]);
		expect(payload.subject).toBe("Website inquiry: Dry needling");
		expect(payload.html).toContain("Jane Doe");
		expect(send?.[1]?.headers).toMatchObject({ Authorization: "Bearer re_test_key" });
	});

	it("rejects malformed JSON", async () => {
		const response = await POST(request("{nope"));
		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rejects missing required fields", async () => {
		const response = await POST(request({ ...VALID, email: "not-an-email" }));
		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("rejects oversized messages", async () => {
		const response = await POST(request({ ...VALID, message: "x".repeat(5001) }));
		expect(response.status).toBe(400);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("quietly drops honeypot submissions without sending", async () => {
		const response = await POST(request({ ...VALID, company: "Totally Real LLC" }));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("answers a honeypot catch exactly as it answers a real send", async () => {
		const relayed = await POST(request(VALID));
		const dropped = await POST(request({ ...VALID, company: "Totally Real LLC" }));
		expect(dropped.status).toBe(relayed.status);
		expect(await dropped.text()).toBe(await relayed.text());
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("escapes HTML in the relayed message", async () => {
		await POST(request({ ...VALID, message: '<img src=x onerror="pwn()">' }));
		const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(payload.html).not.toContain("<img");
		expect(payload.html).toContain("&lt;img");
	});

	it("rejects JSON that is not an object", async () => {
		for (const body of ["null", "42", '"text"', "[]"]) {
			const response = await POST(request(body));
			expect(response.status).toBe(400);
		}
		expect(fetch).not.toHaveBeenCalled();
	});

	it("returns 500 when the backend env is missing", async () => {
		// A DSN from a local .env would send a report through the mocked fetch.
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", "");
		vi.stubEnv("VERCEL_ENV", "production");
		vi.stubEnv("RESEND_API_KEY", "");
		const response = await POST(request(VALID));
		expect(response.status).toBe(500);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("returns 502 when Resend rejects the send", async () => {
		vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 422 }));
		const response = await POST(request(VALID));
		expect(response.status).toBe(502);
	});

	describe("error reporting", () => {
		const DSN = "https://abc@o1.ingest.us.sentry.io/1";
		const INGEST = "https://o1.ingest.us.sentry.io/api/1/envelope/";
		// Every value a submission or the configuration carries that a report
		// must never hold: the visitor's fields and both inboxes.
		const PRIVATE = [
			VALID.name,
			VALID.email,
			VALID.topic,
			VALID.message,
			"inbox@example.com",
			"monitor@example.com",
		];

		/** Answers the ingest 200 and Resend with `resend`, handed the call's init. */
		function route(resend: (init?: RequestInit) => Response | Promise<Response>) {
			vi.mocked(fetch).mockImplementation(async (input, init) =>
				String(input).startsWith(INGEST) ? new Response("{}", { status: 200 }) : resend(init),
			);
		}

		/** What Node's fetch does with an aborted call: rejects, never answers. */
		function abortError(): DOMException {
			return new DOMException("This operation was aborted", "AbortError");
		}

		/** The calls made to Resend, the ingest's left out. */
		function resendCalls() {
			return vi.mocked(fetch).mock.calls.filter(([url]) => !String(url).startsWith(INGEST));
		}

		/** The envelopes sent to Sentry, once every send in flight has started. */
		async function reports(): Promise<string[]> {
			await new Promise((resolve) => setTimeout(resolve, 0));
			return vi
				.mocked(fetch)
				.mock.calls.filter(([url]) => String(url).startsWith(INGEST))
				.map(([, init]) => String(init?.body));
		}

		/** The one report sent, checked for its route tag and for privacy. */
		async function onlyReport(): Promise<string> {
			const sent = await reports();
			expect(sent).toHaveLength(1);
			const envelope = sent[0] ?? "";
			expect(envelope).toContain('"route":"contact"');
			const event = JSON.parse(envelope.split("\n")[2] ?? "{}");
			// The route and the runtime, and for a failed destination its name
			// and the reason: no tag may carry anything of the submission.
			expect(event.tags).toMatchObject({ runtime: "node", route: "contact" });
			expect(Object.keys(event.tags).sort()).toEqual(
				"destination" in event.tags
					? ["destination", "reason", "route", "runtime"]
					: ["route", "runtime"],
			);
			for (const value of PRIVATE) expect(envelope).not.toContain(value);
			return envelope;
		}

		beforeEach(() => {
			vi.stubEnv("SENTRY_DSN", "");
			vi.stubEnv("VITE_SENTRY_DSN", DSN);
		});

		it("reports a refused send once with Resend's name and message, answering 502", async () => {
			route(
				() =>
					new Response(
						JSON.stringify({
							statusCode: 422,
							name: "validation_error",
							message: "Invalid `to` field.",
							to: ["inbox@example.com"],
						}),
						{ status: 422 },
					),
			);
			const response = await POST(request(VALID));
			expect(response.status).toBe(502);
			await expect(response.json()).resolves.toEqual({
				ok: false,
				error: "Sending failed. Please try again in a moment.",
			});
			const envelope = await onlyReport();
			expect(envelope).toContain("Resend answered 422: validation_error: Invalid `to` field.");
		});

		it("takes an address out of a refusal that quotes one", async () => {
			route(
				() =>
					new Response(
						JSON.stringify({
							name: "validation_error",
							message: "You can only send testing emails to inbox@example.com.",
						}),
						{ status: 403 },
					),
			);
			await POST(request(VALID));
			expect(await onlyReport()).toContain("You can only send testing emails to [address]");
		});

		it("reports a refusal whose body is not JSON by its status alone", async () => {
			route(() => new Response("<html>Bad gateway</html>", { status: 503 }));
			const response = await POST(request(VALID));
			expect(response.status).toBe(502);
			const envelope = await onlyReport();
			expect(envelope).toContain("Resend answered 503");
			expect(envelope).not.toContain("Bad gateway");
		});

		it("answers a thrown Resend fetch with the form's 502 and reports it once", async () => {
			route(() => {
				throw new Error("network down");
			});
			const response = await POST(request(VALID));
			expect(response.status).toBe(502);
			expect(response.headers.get("Content-Type")).toBe("application/json");
			await expect(response.json()).resolves.toMatchObject({ ok: false });
			expect(await onlyReport()).toContain("network down");
		});

		it.each([
			[
				"a DNS miss",
				"ENOTFOUND",
				"getaddrinfo ENOTFOUND api.resend.com",
				"getaddrinfo ENOTFOUND api.resend.com",
			],
			[
				"a TLS failure",
				"CERT_HAS_EXPIRED",
				"certificate has expired",
				"CERT_HAS_EXPIRED: certificate has expired",
			],
			["a reset", "ECONNRESET", "read ECONNRESET", "read ECONNRESET"],
		])(
			"reports a thrown fetch from %s with its cause chained under it",
			async (_fault, code, words, value) => {
				route(() => {
					throw new TypeError("fetch failed", { cause: Object.assign(new Error(words), { code }) });
				});
				const response = await POST(request(VALID));
				expect(response.status).toBe(502);
				const envelope = await onlyReport();
				const event = JSON.parse(envelope.split("\n")[2] ?? "{}");
				// Sentry's chain, innermost first: the cause, with its code leading
				// its words when they do not say it, then the thrown value, then the
				// relay's own line naming the destination.
				expect(
					event.exception.values.map(
						(exception: { type: string; value: string; mechanism?: unknown }) => ({
							type: exception.type,
							value: exception.value,
							mechanism: exception.mechanism,
						}),
					),
				).toEqual([
					{
						type: "Error",
						value,
						mechanism: { type: "chained", source: "cause", exception_id: 2, parent_id: 1 },
					},
					{
						type: "TypeError",
						value: "fetch failed",
						mechanism: { type: "chained", source: "cause", exception_id: 1, parent_id: 0 },
					},
					{
						type: "Error",
						value:
							"Form relay: email was down on both tries, and the submission was dropped for it: fetch failed",
						mechanism: { type: "generic", handled: true, exception_id: 0 },
					},
				]);
			},
		);

		it("answers a send Resend never answers on either try with the form's 502 at seven seconds and reports it once", async () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			route(
				(init) =>
					new Promise<Response>((_resolve, reject) => {
						init?.signal?.addEventListener("abort", () => reject(abortError()));
					}),
			);
			let answered = false;
			const pending = TIMED(request(VALID)).then((response) => {
				answered = true;
				return response;
			});
			await vi.advanceTimersByTimeAsync(WORST_CASE_MS - 1);
			expect(answered).toBe(false);
			await vi.advanceTimersByTimeAsync(1);
			const response = await pending;
			vi.useRealTimers();
			expect(response.status).toBe(502);
			expect(response.headers.get("Content-Type")).toBe("application/json");
			await expect(response.json()).resolves.toEqual({
				ok: false,
				error: "Sending failed. Please try again in a moment.",
			});
			expect(await onlyReport()).toContain("email sent no answer within 3000 ms");
			expect(resendCalls()).toHaveLength(2);
		});

		it("cuts off an answer whose body stalls at the try's limit, on both tries", async () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			route(
				(init) =>
					new Response(
						new ReadableStream({
							start(controller) {
								init?.signal?.addEventListener("abort", () => controller.error(abortError()));
							},
						}),
						{ status: 503 },
					),
			);
			const pending = TIMED(request(VALID));
			await vi.advanceTimersByTimeAsync(WORST_CASE_MS);
			const response = await pending;
			vi.useRealTimers();
			expect(response.status).toBe(502);
			expect(await onlyReport()).toContain("email sent no answer within 3000 ms");
		});

		it("reports a throw the handler did not expect once and throws it again", async () => {
			route(() => new Response("{}", { status: 200 }));
			const thrown = new Error("an unexpected read");
			// A body whose field read throws stands in for any fault the
			// handler does not answer itself; withErrorReporting must report
			// it and hand it on to the platform.
			const odd = {
				method: "POST",
				url: "http://localhost/api/contact",
				headers: new Headers({ "Content-Type": "application/json" }),
				json: async () => ({
					get company(): string {
						throw thrown;
					},
				}),
			} as unknown as Request;
			await expect(POST(odd)).rejects.toBe(thrown);
			expect(await onlyReport()).toContain("an unexpected read");
			expect(resendCalls()).toEqual([]);
		});

		it.each([
			["unset", ""],
			["holding no address", " , "],
		])(
			"sends to the practice's inbox when CONTACT_TO is %s, with no report",
			async (_name, value) => {
				route(() => new Response("{}", { status: 200 }));
				vi.stubEnv("VERCEL_ENV", "production");
				vi.stubEnv("CONTACT_TO", value);
				const response = await POST(request(VALID));
				expect(response.status).toBe(200);
				expect(DEFAULT_CONTACT_TO).toBe("matt@atelic.me");
				expect(JSON.parse(String(resendCalls()[0]?.[1]?.body)).to).toEqual([DEFAULT_CONTACT_TO]);
				expect(await reports()).toEqual([]);
			},
		);

		it("sends one email to every address CONTACT_TO names", async () => {
			route(() => new Response("{}", { status: 200 }));
			vi.stubEnv("CONTACT_TO", "first@example.com, second@example.com,");
			const response = await POST(request(VALID));
			expect(response.status).toBe(200);
			expect(resendCalls()).toHaveLength(1);
			expect(JSON.parse(String(resendCalls()[0]?.[1]?.body)).to).toEqual([
				"first@example.com",
				"second@example.com",
			]);
		});

		it.each([["RESEND_API_KEY", "RESEND_API_KEY unset"]])(
			"reports an unset %s once on production before answering 500",
			async (variable, words) => {
				route(() => new Response("{}", { status: 200 }));
				vi.stubEnv("VERCEL_ENV", "production");
				vi.stubEnv(variable, "");
				const response = await POST(request(VALID));
				expect(response.status).toBe(500);
				const envelope = await onlyReport();
				expect(envelope).toContain(words);
				expect(resendCalls()).toEqual([]);
			},
		);

		it.each([
			["preview", "preview"],
			["development", "development"],
			["unset", ""],
		])(
			"answers an unset variable 500 with no report when VERCEL_ENV is %s",
			async (_name, value) => {
				route(() => new Response("{}", { status: 200 }));
				vi.stubEnv("VERCEL_ENV", value);
				vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
				vi.stubEnv("CONTACT_CANARY_TO", "");
				const canary = await POST(request({ ...VALID, canary: "canary-secret" }));
				expect(canary.status).toBe(500);
				vi.stubEnv("RESEND_API_KEY", "");
				const relay = await POST(request(VALID));
				expect(relay.status).toBe(500);
				await expect(relay.json()).resolves.toEqual({
					ok: false,
					error: "The contact form isn't configured yet.",
				});
				expect(await reports()).toEqual([]);
				expect(resendCalls()).toEqual([]);
			},
		);

		it("reports an unset CONTACT_CANARY_TO once on production when a canary arrives", async () => {
			route(() => new Response("{}", { status: 200 }));
			vi.stubEnv("VERCEL_ENV", "production");
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "");
			const response = await POST(request({ ...VALID, canary: "canary-secret" }));
			expect(response.status).toBe(500);
			const envelope = await onlyReport();
			expect(envelope).toContain("CONTACT_CANARY_TO unset");
			expect(envelope).not.toContain("canary-secret");
		});

		it("answers before the report finishes sending", async () => {
			let release: () => void = () => {};
			vi.mocked(fetch).mockImplementation((input) =>
				String(input).startsWith(INGEST)
					? new Promise<Response>((resolve) => {
							release = () => resolve(new Response("{}", { status: 200 }));
						})
					: Promise.resolve(new Response("{}", { status: 422 })),
			);
			const response = await POST(request(VALID));
			expect(response.status).toBe(502);
			expect(await reports()).toHaveLength(1);
			release();
		});

		it("sends no report for an ordinary relay, a canary, or a validation answer", async () => {
			route(() => new Response('{"id":"re_123"}', { status: 200 }));
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
			await POST(request(VALID));
			await POST(request({ ...VALID, canary: "canary-secret" }));
			await POST(request({ ...VALID, email: "not-an-email" }));
			await POST(request("{nope"));
			await POST(request({ ...VALID, company: "Totally Real LLC" }));
			expect(await reports()).toEqual([]);
		});
	});

	it("never exposes the destination or message id on a normal submission", async () => {
		vi.mocked(fetch).mockResolvedValue(new Response('{"id":"re_123"}', { status: 200 }));
		const response = await POST(request(VALID));
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
	});

	describe("canary", () => {
		beforeEach(() => {
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
			vi.mocked(fetch).mockResolvedValue(new Response('{"id":"re_123"}', { status: 200 }));
		});

		it("relays to the canary inbox and echoes the client destination and id", async () => {
			const response = await POST(request({ ...VALID, canary: "canary-secret" }));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({
				ok: true,
				id: "re_123",
				to: "inbox@example.com",
			});
			const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
			expect(payload.to).toEqual(["monitor@example.com"]);
			expect(payload.subject).toBe("[Canary] Website inquiry: Dry needling");
		});

		it("treats a wrong token as an ordinary submission", async () => {
			const response = await POST(request({ ...VALID, canary: "guess" }));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
			expect(payload.to).toEqual(["inbox@example.com"]);
			expect(payload.subject).toBe("Website inquiry: Dry needling");
		});

		it("ignores the field entirely when no token is configured", async () => {
			vi.stubEnv("CONTACT_CANARY_TOKEN", "");
			const response = await POST(request({ ...VALID, canary: "" }));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
			expect(payload.to).toEqual(["inbox@example.com"]);
		});

		it("returns 500 without sending when the canary inbox is unset", async () => {
			vi.stubEnv("SENTRY_DSN", "");
			vi.stubEnv("VITE_SENTRY_DSN", "");
			vi.stubEnv("VERCEL_ENV", "production");
			vi.stubEnv("CONTACT_CANARY_TO", "");
			const response = await POST(request({ ...VALID, canary: "canary-secret" }));
			expect(response.status).toBe(500);
			expect(fetch).not.toHaveBeenCalled();
		});
	});
});

describe("destinations beside the email", () => {
	const DSN = "https://abc@o1.ingest.us.sentry.io/1";
	const INGEST = "https://o1.ingest.us.sentry.io/api/1/envelope/";

	function crm(...answers: DestinationResult[]) {
		const send = vi.fn(
			async (_: Submission<ContactFields>) =>
				answers[Math.min(send.mock.calls.length - 1, answers.length - 1)] as DestinationResult,
		);
		return { name: "crm", send };
	}

	function resendAnswers(answer: () => Response) {
		vi.mocked(fetch).mockImplementation(async (input) =>
			String(input).startsWith(INGEST) ? new Response("{}", { status: 200 }) : answer(),
		);
	}

	async function reports(): Promise<string[]> {
		await new Promise((resolve) => setTimeout(resolve, 0));
		return vi
			.mocked(fetch)
			.mock.calls.filter(([url]) => String(url).startsWith(INGEST))
			.map(([, init]) => String(init?.body));
	}

	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com");
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", DSN);
		vi.stubGlobal("fetch", vi.fn());
		resendAnswers(() => new Response('{"id":"re_123"}', { status: 200 }));
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("hands every destination the same submission: one id and the fields by key", async () => {
		const lead = crm({ status: "delivered" });
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request(VALID));
		expect(response.status).toBe(200);

		const submission = lead.send.mock.calls[0]?.[0];
		expect(submission?.fields).toEqual({
			name: VALID.name,
			email: VALID.email,
			topic: VALID.topic,
			message: VALID.message,
		});
		const sent = vi.mocked(fetch).mock.calls[0]?.[1];
		expect(new Headers(sent?.headers).get("Idempotency-Key")).toBe(submission?.id);
		expect(await reports()).toEqual([]);
	});

	it("answers success and reports the failed leg when the email lands and another destination refuses", async () => {
		const lead = crm(refused(new Error("crm answered 422")));
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request(VALID));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });

		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain("Form relay: crm refused the submission: crm answered 422");
		expect(sent[0]).toContain('"destination":"crm"');
		for (const value of Object.values(VALID).filter(Boolean)) expect(sent[0]).not.toContain(value);
	});

	it("answers success when the email is refused and another destination takes it", async () => {
		resendAnswers(() => new Response("{}", { status: 422 }));
		const lead = crm({ status: "delivered" });
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request(VALID));
		expect(response.status).toBe(200);
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain('"destination":"email"');
	});

	it("answers failure only when no destination took it, with a report for each", async () => {
		resendAnswers(() => new Response("{}", { status: 422 }));
		const lead = crm(refused(new Error("crm answered 400")));
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request(VALID));
		expect(response.status).toBe(502);
		expect(await reports()).toHaveLength(2);
	});

	it("sends a canary to the canary inbox and to no other destination", async () => {
		vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
		vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
		const lead = crm({ status: "delivered" });
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request({ ...VALID, canary: "canary-secret" }));
		await expect(response.json()).resolves.toEqual({
			ok: true,
			id: "re_123",
			to: "inbox@example.com",
		});
		expect(lead.send).not.toHaveBeenCalled();
	});

	it("carries one idempotency key on both tries, and takes a first try still landing as sent", async () => {
		const answers = [
			() => new Response("{}", { status: 503 }),
			() =>
				new Response(JSON.stringify({ name: "concurrent_idempotent_requests" }), { status: 409 }),
		];
		resendAnswers(() => (answers.shift() ?? answers[0])?.() as Response);
		const post = createContact({ from: FROM, retryWaitMs: 1 });
		const response = await post(request(VALID));
		expect(response.status).toBe(200);

		const keys = vi
			.mocked(fetch)
			.mock.calls.filter(([url]) => !String(url).startsWith(INGEST))
			.map(([, init]) => new Headers(init?.headers).get("Idempotency-Key"));
		expect(keys).toHaveLength(2);
		expect(keys[0]).toBeTruthy();
		expect(keys[1]).toBe(keys[0]);
	});

	it("reports a first try it never saw land, though the visitor is answered success", async () => {
		const answers = [
			() => new Response("{}", { status: 503 }),
			() =>
				new Response(JSON.stringify({ name: "concurrent_idempotent_requests" }), { status: 409 }),
		];
		resendAnswers(() => (answers.shift() ?? answers[0])?.() as Response);
		const post = createContact({ from: FROM, retryWaitMs: 1 });
		expect((await post(request(VALID))).status).toBe(200);
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain("Form relay: email took the submission, unconfirmed");
		expect(sent[0]).toContain('"reason":"unconfirmed"');
	});

	it("takes an address and a number out of a destination's own words before reporting them", async () => {
		const lead = crm(refused(new Error("Contact exists: jane@example.com, (303) 555-0142")));
		const post = createContact({ from: FROM, destinations: [lead] });
		await post(request(VALID));
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain("Contact exists: [address], [number]");
		expect(sent[0]).not.toContain("jane@example.com");
		expect(sent[0]).not.toContain("555-0142");
	});

	it("still hands the submission to the other destinations when the email has no key", async () => {
		vi.stubEnv("RESEND_API_KEY", "");
		vi.stubEnv("VERCEL_ENV", "production");
		const lead = crm({ status: "delivered" });
		const post = createContact({ from: FROM, destinations: [lead] });
		const response = await post(request(VALID));
		expect(response.status).toBe(200);
		expect(lead.send).toHaveBeenCalledOnce();
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain("RESEND_API_KEY unset");
	});

	it("refuses a key reused with other words rather than trying again", async () => {
		resendAnswers(
			() => new Response(JSON.stringify({ name: "invalid_idempotent_request" }), { status: 409 }),
		);
		const post = createContact({ from: FROM, retryWaitMs: 1 });
		const response = await post(request(VALID));
		expect(response.status).toBe(502);
		expect(
			vi.mocked(fetch).mock.calls.filter(([url]) => !String(url).startsWith(INGEST)),
		).toHaveLength(1);
	});
});

describe("a site's own fields", () => {
	/** A form with a split name, a required phone, an address, a services list, and a consent box. */
	const FIELDS: ContactField[] = [
		{ key: "name", label: "Name", required: true, limit: 201 },
		{ key: "firstName", label: "First name", show: false },
		{ key: "lastName", label: "Last name", show: false },
		{ key: "email", label: "Email", kind: "email", required: true },
		{ key: "phone", label: "Phone", kind: "phone", required: true },
		{ key: "services", label: "Services", kind: "list" },
		{ key: "topic", label: "Topic", show: false, limit: 2100 },
		{ key: "address", label: "Property", kind: "address" },
		{ key: "consent", label: "Text consent", kind: "checkbox" },
		{ key: "message", label: "Message", required: true, limit: 5000 },
	];
	const WIDE = {
		name: "Jane Doe",
		firstName: "Jane",
		lastName: "Doe",
		email: "jane@example.com",
		phone: "(303) 555-0142",
		services: ["Roof repair", "Gutters"],
		topic: "Roof repair, Gutters",
		address: { street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" },
		consent: true,
		message: "Hail last week.",
		company: "",
	};
	const post = createContact({ from: FROM, fields: FIELDS, subject: ["services", "topic"] });

	function payload() {
		return JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
	}

	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("writes each shown field as a row, in the order listed, under the name", async () => {
		const response = await post(request(WIDE));
		expect(response.status).toBe(200);
		const { text, html, subject, reply_to } = payload();
		expect(text).toBe(
			[
				"Jane Doe",
				"Email: jane@example.com",
				"Phone: (303) 555-0142",
				"Services: Roof repair, Gutters",
				"Property: 418 Alder Street, Fairhaven, CO 80000",
				"Text consent: Checked",
				"",
				"Message:",
				"Hail last week.",
			].join("\n"),
		);
		expect(subject).toBe("Website inquiry: Roof repair, Gutters");
		expect(reply_to).toEqual(["jane@example.com"]);
		expect(html).toContain('<a href="tel:+13035550142">(303) 555-0142</a>');
		expect(html).toContain('<a href="mailto:jane@example.com">jane@example.com</a>');
		// A field kept out of the email is not a row.
		expect(text).not.toContain("First name");
	});

	it("leaves out a row nobody filled and says a box was left unchecked", async () => {
		await post(request({ ...WIDE, services: [], address: { state: "CO" }, consent: false }));
		const { text, subject } = payload();
		expect(text).not.toContain("Services:");
		expect(text).not.toContain("Property:");
		expect(text).toContain("Text consent: Not checked");
		// The subject falls to the next key that holds something.
		expect(subject).toBe("Website inquiry: Roof repair, Gutters");
	});

	it("never reads a key the site did not list", async () => {
		const lead = { name: "crm", send: vi.fn(async () => ({ status: "delivered" }) as const) };
		const wide = createContact({ from: FROM, fields: FIELDS, destinations: [lead] });
		await wide(request({ ...WIDE, injected: "<b>not a field</b>", canary: "guess" }));
		expect(Object.keys(lead.send.mock.calls[0]?.[0].fields ?? {})).toEqual(
			FIELDS.map((field) => field.key),
		);
		expect(payload().html).not.toContain("not a field");
	});

	it("refuses a required phone that cannot be dialed, in its own words", async () => {
		const response = await post(request({ ...WIDE, phone: "call me" }));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Please add a phone number we can call.",
		});
		expect(fetch).not.toHaveBeenCalled();
	});

	it("names every required field left empty", async () => {
		const response = await post(request({ ...WIDE, name: "", phone: "", message: 7 }));
		await expect(response.json()).resolves.toEqual({
			ok: false,
			error: "Please fill in your name, phone, and message.",
		});
	});

	it.each([
		[
			{ services: Array.from({ length: 21 }, (_, index) => `Service ${index}`) },
			"Services: choose 20 or fewer.",
		],
		[{ services: ["Gutters", 7] }, "Services: each choice must be text."],
		[{ services: ["x".repeat(101)] }, "Services: a choice is over 100 characters."],
		[{ phone: "5".repeat(41) }, "Phone is over 40 characters."],
		[
			{ address: { ...WIDE.address, street: "x".repeat(201) } },
			"The street is over 200 characters.",
		],
		[{ message: "x".repeat(5001) }, "Message is over 5000 characters."],
	])("refuses a field over its limit or of the wrong shape (%#)", async (change, error) => {
		const response = await post(request({ ...WIDE, ...change }));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ ok: false, error });
		expect(fetch).not.toHaveBeenCalled();
	});

	it("reads anything that is not words as empty, never as [object Object]", async () => {
		await post(request({ ...WIDE, topic: { a: 1 }, services: [] }));
		expect(payload().subject).toBe("Website inquiry: General");
	});

	it("keeps a line break out of the subject and cuts a long one", async () => {
		await post(
			request({
				...WIDE,
				services: ["Roof\r\nBcc: x@example.com", "y".repeat(100), "z".repeat(100)],
			}),
		);
		const { subject } = payload();
		expect(subject).not.toMatch(/[\r\n]/);
		expect(subject.length).toBeLessThanOrEqual("Website inquiry: ".length + SUBJECT_LIMIT);
		expect(subject.endsWith("…")).toBe(true);
	});

	it("takes a canary's plain body whatever the form requires", async () => {
		vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
		vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
		vi.mocked(fetch).mockResolvedValue(new Response('{"id":"re_9"}', { status: 200 }));
		const response = await post(request({ ...VALID, canary: "canary-secret" }));
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ id: "re_9" });
	});
});

describe("a site's settings", () => {
	const DSN = "https://abc@o1.ingest.us.sentry.io/1";

	async function reported(body: unknown, environment: string): Promise<string[]> {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", DSN);
		vi.stubEnv("VERCEL_ENV", environment);
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
		const response = await createContact({ from: FROM })(request(body));
		expect(response.status).toBe(200);
		await new Promise((resolve) => setTimeout(resolve, 0));
		const sent = vi
			.mocked(fetch)
			.mock.calls.filter(([url]) => String(url).includes("ingest"))
			.map(([, init]) => String(init?.body));
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		return sent;
	}

	it("reports a form that sends a field the function does not list, and still sends the rest", async () => {
		const sent = await reported({ ...VALID, phone: "(303) 555-0142", address: {} }, "production");
		expect(sent).toHaveLength(1);
		expect(sent[0]).toContain(
			"Contact form sends phone, address, which the endpoint's fields do not list",
		);
		expect(sent[0]).not.toContain("555-0142");
	});

	it("says nothing of a stranger's key, or off production", async () => {
		expect(await reported({ ...VALID, injected: "x", utm: "y" }, "production")).toEqual([]);
		expect(await reported({ ...VALID, phone: "(303) 555-0142" }, "preview")).toEqual([]);
	});

	it.each(["company", "canary", "turnstile"])(
		"refuses a field under %s, a key the endpoint reads for itself",
		(key) => {
			expect(() =>
				createContact({ from: FROM, fields: [...PLAIN_FIELDS, { key, label: "Company" }] }),
			).toThrow(`"${key}" is a key the endpoint reads for itself`);
		},
	);

	it("refuses a key listed twice", () => {
		expect(() =>
			createContact({
				from: FROM,
				fields: [...PLAIN_FIELDS, { key: "name", label: "Name again" }],
			}),
		).toThrow('the field "name" is listed twice');
	});
});

describe("the office's email", () => {
	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com");
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response('{"id":"re_1"}', { status: 200 })),
		);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	it("keeps a pictograph whole where the subject is cut", async () => {
		const post = createContact({ from: FROM });
		await post(request({ ...VALID, topic: `${"x".repeat(118)}\u{1F3E0}${"y".repeat(20)}` }));
		const { subject } = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(subject.isWellFormed()).toBe(true);
		expect(subject.endsWith("\u{1F3E0}\u2026")).toBe(true);
	});

	it("keeps the name and the message out of the email when a site says so", async () => {
		const post = createContact({
			from: FROM,
			fields: [
				{ key: "name", label: "Name", required: true, show: false },
				{ key: "email", label: "Email", kind: "email", required: true },
				{ key: "message", label: "Message", required: true, show: false },
			],
		});
		await post(request(VALID));
		const { text } = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(text).toBe("Email: jane@example.com");
	});

	it("counts a field's characters as a visitor would, a pictograph being one", async () => {
		const post = createContact({ from: FROM });
		const response = await post(request({ ...VALID, message: "\u{1F3E0}".repeat(3000) }));
		expect(response.status).toBe(200);
	});

	it("takes a services picker's joined choices as the plain form's topic", async () => {
		const post = createContact({ from: FROM });
		const topic = Array.from(
			{ length: 8 },
			(_, index) => `Residential window replacement ${index}`,
		).join(", ");
		const response = await post(request({ ...VALID, topic }));
		expect(response.status).toBe(200);
	});

	it("never lets an address set the subject or the body of the office's reply", async () => {
		const post = createContact({ from: FROM });
		await post(request({ ...VALID, email: "x@example.com?subject=Invoice&body=Wire%20it" }));
		const { html } = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(html).toContain('href="mailto:x@example.com%3Fsubject%3DInvoice%26body%3DWire%2520it"');
		expect(html).not.toContain("mailto:x@example.com?subject");
	});

	it("sends a canary to every address CONTACT_CANARY_TO names", async () => {
		vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
		vi.stubEnv("CONTACT_CANARY_TO", "ops@example.com, monitor@example.com");
		const post = createContact({ from: FROM });
		const response = await post(request({ ...VALID, canary: "canary-secret" }));
		expect(response.status).toBe(200);
		const { to } = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
		expect(to).toEqual(["ops@example.com", "monitor@example.com"]);
	});

	it.each(["canary-secre", "canary-secret-", "Canary-secret", ""])(
		"takes %j as no canary",
		async (guess) => {
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
			const post = createContact({ from: FROM });
			const response = await post(request({ ...VALID, canary: guess }));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
		},
	);
});

describe("the guard and the receipt", () => {
	const DSN = "https://abc@o1.ingest.us.sentry.io/1";
	const INGEST = "https://o1.ingest.us.sentry.io/api/1/envelope/";
	const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
	const RESEND = "https://api.resend.com/emails";
	const TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
	const SIGNED = { ...VALID, turnstile: TOKEN };

	/** How each service answers this test's calls. */
	let answers: {
		siteverify: () => Response | Promise<Response>;
		office: () => Response | Promise<Response>;
		receipt: (init?: RequestInit) => Response | Promise<Response>;
	};

	const isReceipt = (init?: RequestInit) =>
		String(new Headers(init?.headers).get("Idempotency-Key")).endsWith("-receipt");

	const calls = (url: string) =>
		vi.mocked(fetch).mock.calls.filter(([called]) => String(called).startsWith(url));
	const siteverifyCalls = () => calls(SITEVERIFY);
	const officeCalls = () => calls(RESEND).filter(([, init]) => !isReceipt(init));
	const receiptCalls = () => calls(RESEND).filter(([, init]) => isReceipt(init));

	async function reports(): Promise<string[]> {
		await new Promise((resolve) => setTimeout(resolve, 0));
		return calls(INGEST).map(([, init]) => String(init?.body));
	}

	function crm() {
		const send = vi.fn(async (_: Submission<ContactFields>) => ({ status: "delivered" }) as const);
		return { name: "crm", send };
	}

	const guarded = (extra: Partial<Parameters<typeof createContact>[0]> = {}) =>
		createContact({ from: FROM, guard: turnstileGuard(), receipt: {}, ...extra });

	beforeEach(() => {
		vi.stubEnv("RESEND_API_KEY", "re_test_key");
		vi.stubEnv("CONTACT_TO", "inbox@example.com, front@example.com");
		vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
		vi.stubEnv("SENTRY_DSN", "");
		vi.stubEnv("VITE_SENTRY_DSN", DSN);
		answers = {
			siteverify: () => new Response('{"success":true}', { status: 200 }),
			office: () => new Response('{"id":"re_office"}', { status: 200 }),
			receipt: () => new Response('{"id":"re_receipt"}', { status: 200 }),
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				if (url.startsWith(INGEST)) return new Response("{}", { status: 200 });
				if (url.startsWith(SITEVERIFY)) return answers.siteverify();
				if (isReceipt(init)) return answers.receipt(init);
				return answers.office();
			}),
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
	});

	describe("a check that passes", () => {
		it("delivers and sends exactly one receipt to the visitor, replies going to the office", async () => {
			const lead = crm();
			const response = await guarded({ destinations: [lead] })(request(SIGNED));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: true });
			expect(officeCalls()).toHaveLength(1);
			expect(receiptCalls()).toHaveLength(1);
			const receipt = JSON.parse(String(receiptCalls()[0]?.[1]?.body));
			expect(receipt.to).toEqual(["jane@example.com"]);
			// From the no-reply address, with no reply address, closing on the note.
			expect(receipt.from).toBe("Summit Movement Studio <no-reply@example.com>");
			expect(receipt).not.toHaveProperty("reply_to");
			expect(receipt.text.endsWith(DEFAULT_RECEIPT_NOTE)).toBe(true);
			expect(receipt.html).toContain(DEFAULT_RECEIPT_NOTE);
			expect(receipt.subject).toBe("We have your message");
			// The default receipt repeats nothing the visitor wrote.
			expect(receipt.text.split("\n")[0]).toBe("We have your message.");
			for (const value of [VALID.name, VALID.topic, VALID.message]) {
				expect(`${receipt.subject}${receipt.html}${receipt.text}`).not.toContain(value);
			}
			// The receipt carries a key of its own, so it never collides with the office's.
			const office = new Headers(officeCalls()[0]?.[1]?.headers).get("Idempotency-Key");
			const own = new Headers(receiptCalls()[0]?.[1]?.headers).get("Idempotency-Key");
			expect(own).toBe(`${office}-receipt`);
			expect(lead.send.mock.calls[0]?.[0].checked).toBe(true);
			expect(await reports()).toEqual([]);
		});

		it("checks the token once, under the submission's id", async () => {
			await guarded()(request(SIGNED));
			expect(siteverifyCalls()).toHaveLength(1);
			const body = JSON.parse(String(siteverifyCalls()[0]?.[1]?.body));
			expect(body.response).toBe(TOKEN);
			const office = new Headers(officeCalls()[0]?.[1]?.headers).get("Idempotency-Key");
			expect(body.idempotency_key).toBe(office);
		});

		it("sends no receipt when no destination took the submission", async () => {
			answers.office = () => new Response("{}", { status: 422 });
			const response = await guarded()(request(SIGNED));
			expect(response.status).toBe(502);
			expect(receiptCalls()).toEqual([]);
		});

		it("answers 200 with receipt false, and reports it, when the receipt fails", async () => {
			answers.receipt = () =>
				new Response(JSON.stringify({ name: "validation_error", message: "Bad to" }), {
					status: 422,
				});
			const response = await guarded()(request(SIGNED));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(receiptCalls()).toHaveLength(1);
			const sent = await reports();
			expect(sent).toHaveLength(1);
			expect(sent[0]).toContain("Form receipt: the copy to the visitor was not sent");
			expect(sent[0]).toContain('"reason":"receipt"');
			expect(sent[0]).not.toContain("jane@example.com");
		});

		it("gives the receipt one try, cut off at its limit, and still answers 200", async () => {
			vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
			answers.receipt = (init) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () =>
						reject(new DOMException("This operation was aborted", "AbortError")),
					);
				});
			const pending = guarded()(request(SIGNED));
			await vi.advanceTimersByTimeAsync(3000);
			const response = await pending;
			vi.useRealTimers();
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(receiptCalls()).toHaveLength(1);
		});

		it("sends the receipt from the site's own sender when it names one", async () => {
			await guarded({ receipt: { from: "Front Desk <desk@example.com>" } })(request(SIGNED));
			const receipt = JSON.parse(String(receiptCalls()[0]?.[1]?.body));
			expect(receipt.from).toBe("Front Desk <desk@example.com>");
			expect(receipt).not.toHaveProperty("reply_to");
			// The signature is still the endpoint's display name.
			expect(receipt.text).toContain("Summit Movement Studio");
		});

		it("sends no receipt when the site turned none on, and says so", async () => {
			const response = await createContact({ from: FROM, guard: turnstileGuard() })(
				request(SIGNED),
			);
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(receiptCalls()).toEqual([]);
		});

		it("sends no receipt when the submission holds no email address", async () => {
			const post = guarded({
				fields: [
					{ key: "name", label: "Name", required: true },
					{ key: "email", label: "Email", kind: "email" },
					{ key: "message", label: "Message", required: true },
				],
			});
			const response = await post(request({ ...SIGNED, email: "" }));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(receiptCalls()).toEqual([]);
		});

		it("keeps the office's email free of the unchecked line", async () => {
			await guarded()(request(SIGNED));
			const office = JSON.parse(String(officeCalls()[0]?.[1]?.body));
			expect(office.text).not.toContain("not checked for spam");
			expect(office.html).not.toContain("not checked for spam");
		});
	});

	describe("a check that fails", () => {
		it("refuses with 403, reaching no destination and sending no receipt", async () => {
			answers.siteverify = () =>
				new Response('{"success":false,"error-codes":["invalid-input-response"]}', {
					status: 200,
				});
			const lead = crm();
			const response = await guarded({ destinations: [lead] })(request(SIGNED));
			expect(response.status).toBe(403);
			await expect(response.json()).resolves.toEqual({
				ok: false,
				code: "guard",
				error: "We could not confirm this came from a person. Please call us instead.",
			});
			expect(calls(RESEND)).toEqual([]);
			expect(lead.send).not.toHaveBeenCalled();
			expect(await reports()).toEqual([]);
		});
	});

	describe("a check that cannot answer", () => {
		it.each([
			[
				"Cloudflare could not read the request",
				SIGNED,
				() => new Response('{"success":false,"error-codes":["bad-request"]}'),
			],
			[
				"Cloudflare's own fault",
				SIGNED,
				() => new Response('{"success":false,"error-codes":["internal-error"]}'),
			],
			["Cloudflare unreachable", SIGNED, () => Promise.reject(new TypeError("fetch failed"))],
		])("delivers, sends no receipt, and reports when %s", async (_name, body, siteverify) => {
			answers.siteverify = siteverify;
			const lead = crm();
			const response = await guarded({ destinations: [lead] })(request(body));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(officeCalls()).toHaveLength(1);
			expect(receiptCalls()).toEqual([]);
			expect(lead.send.mock.calls[0]?.[0].checked).toBe(false);
			const sent = await reports();
			expect(sent).toHaveLength(1);
			expect(sent[0]).toContain(
				"Form guard: turnstile could not answer, and the submission was let through",
			);
			const event = JSON.parse(sent[0]?.split("\n")[2] ?? "{}");
			expect(event.tags).toMatchObject({
				route: "contact",
				guard: "turnstile",
				reason: "guard-unanswered",
			});
			expect(sent[0]).not.toContain(TOKEN);
			expect(sent[0]).not.toContain("1x0000000000000000000000000000000AA");
			for (const value of [VALID.name, VALID.email, VALID.message]) {
				expect(sent[0]).not.toContain(value);
			}
		});

		it("does not call Cloudflare for a submission with no token", async () => {
			await guarded()(request(VALID));
			expect(siteverifyCalls()).toEqual([]);
		});

		it("delivers a submission with no token unchecked and with no receipt, and files no report", async () => {
			// The form reported a real visitor whose browser could not run the
			// check; a bot that leaves the token out would bury every other report.
			vi.stubEnv("VERCEL_ENV", "production");
			const lead = crm();
			const response = await guarded({ destinations: [lead] })(request(VALID));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(officeCalls()).toHaveLength(1);
			expect(receiptCalls()).toEqual([]);
			expect(lead.send.mock.calls[0]?.[0].checked).toBe(false);
			expect(JSON.parse(String(officeCalls()[0]?.[1]?.body)).text).toContain(
				"This one was not checked for spam.",
			);
			expect(await reports()).toEqual([]);
		});

		it("says so in the office's email, in both bodies", async () => {
			await guarded()(request(VALID));
			const office = JSON.parse(String(officeCalls()[0]?.[1]?.body));
			expect(office.text.endsWith("This one was not checked for spam.")).toBe(true);
			expect(office.html).toContain("This one was not checked for spam.");
		});

		it("takes a guard that throws as one that could not answer", async () => {
			const post = createContact({
				from: FROM,
				guard: {
					name: "custom",
					tokenKey: "proof",
					check: async () => {
						throw new Error("broken");
					},
				},
				receipt: {},
			});
			const response = await post(request({ ...VALID, proof: "x" }));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			const sent = await reports();
			expect(sent).toHaveLength(1);
			expect(sent[0]).toContain("Form guard: custom could not answer");
		});

		it("reports an unset secret on production alone, and delivers either way", async () => {
			vi.stubEnv("TURNSTILE_SECRET_KEY", "");
			vi.stubEnv("VERCEL_ENV", "preview");
			expect((await guarded()(request(SIGNED))).status).toBe(200);
			expect(await reports()).toEqual([]);
			vi.stubEnv("VERCEL_ENV", "production");
			expect((await guarded()(request(SIGNED))).status).toBe(200);
			const sent = await reports();
			expect(sent).toHaveLength(1);
			expect(sent[0]).toContain("TURNSTILE_SECRET_KEY unset");
			expect(siteverifyCalls()).toEqual([]);
			expect(receiptCalls()).toEqual([]);
		});
	});

	describe("the endpoint's bound on the guard", () => {
		/** A guard whose check never answers, saying it takes `timeoutMs`. */
		function stuck(timeoutMs?: number) {
			const check = vi.fn(() => new Promise<never>(() => {}));
			return { name: "custom", tokenKey: "proof", timeoutMs, check };
		}

		it.each([
			["the time the guard names and half a second", 1000, 1500],
			["3500 ms for a guard that names none", undefined, 3500],
			["3500 ms for a guard that names more, the ceiling", 10_000, 3500],
		])(
			"cuts off a check that never answers at %s, delivering unchecked and reporting",
			async (_name, timeoutMs, bound) => {
				vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
				const guard = stuck(timeoutMs);
				const lead = crm();
				let answered = false;
				const pending = createContact({ from: FROM, guard, receipt: {}, destinations: [lead] })(
					request({ ...VALID, proof: "x" }),
				).then((response) => {
					answered = true;
					return response;
				});
				await vi.advanceTimersByTimeAsync(bound - 1);
				expect(answered).toBe(false);
				expect(lead.send).not.toHaveBeenCalled();
				await vi.advanceTimersByTimeAsync(1);
				const response = await pending;
				vi.useRealTimers();
				await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
				expect(guard.check).toHaveBeenCalledOnce();
				expect(lead.send.mock.calls[0]?.[0].checked).toBe(false);
				expect(receiptCalls()).toEqual([]);
				const sent = await reports();
				expect(sent).toHaveLength(1);
				expect(sent[0]).toContain(`custom sent no verdict within ${bound} ms`);
				expect(sent[0]).toContain('"reason":"guard-unanswered"');
			},
		);

		it("holds Turnstile to its own limit and half a second", () => {
			expect(turnstileGuard().timeoutMs).toBe(3000);
			expect(turnstileGuard({ timeoutMs: 1200 }).timeoutMs).toBe(1200);
		});
	});

	describe("fields before the check", () => {
		it("refuses a field with 400 without calling Cloudflare, so no token is spent", async () => {
			const response = await guarded()(request({ ...SIGNED, email: "not-an-email" }));
			expect(response.status).toBe(400);
			expect(siteverifyCalls()).toEqual([]);
			expect(fetch).not.toHaveBeenCalled();
		});

		it("never asks a site's own guard about a submission it refuses", async () => {
			const check = vi.fn(async () => ({ status: "passed" }) as const);
			const post = createContact({
				from: FROM,
				guard: { name: "custom", tokenKey: "proof", check },
			});
			const response = await post(request({ ...VALID, message: "", proof: "x" }));
			expect(response.status).toBe(400);
			expect(check).not.toHaveBeenCalled();
		});
	});

	describe("before and around the check", () => {
		it("answers the honeypot before Cloudflare is called", async () => {
			const response = await guarded()(request({ ...SIGNED, company: "Totally Real LLC" }));
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(fetch).not.toHaveBeenCalled();
		});

		it("passes a canary with no token, never calling Cloudflare, and sends it no receipt", async () => {
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
			const lead = crm();
			const response = await guarded({ destinations: [lead] })(
				request({ ...VALID, canary: "canary-secret" }),
			);
			expect(response.status).toBe(200);
			await expect(response.json()).resolves.toEqual({
				ok: true,
				id: "re_office",
				to: "inbox@example.com, front@example.com",
			});
			expect(siteverifyCalls()).toEqual([]);
			expect(receiptCalls()).toEqual([]);
			expect(lead.send).not.toHaveBeenCalled();
			expect(await reports()).toEqual([]);
		});

		it("hands a canary's office email no checked mark and no unchecked line", async () => {
			vi.stubEnv("CONTACT_CANARY_TOKEN", "canary-secret");
			vi.stubEnv("CONTACT_CANARY_TO", "monitor@example.com");
			await guarded()(request({ ...SIGNED, canary: "canary-secret" }));
			expect(JSON.parse(String(officeCalls()[0]?.[1]?.body)).text).not.toContain("not checked");
		});

		it("leaves checked unset on a submission to an endpoint with no guard", async () => {
			const lead = crm();
			await createContact({ from: FROM, destinations: [lead] })(request(VALID));
			expect(lead.send.mock.calls[0]?.[0]).not.toHaveProperty("checked");
		});
	});

	describe("a form with the check and a function without it", () => {
		it("reports a token sent to an endpoint that names no guard, on production, and delivers", async () => {
			vi.stubEnv("VERCEL_ENV", "production");
			const lead = crm();
			const response = await createContact({ from: FROM, destinations: [lead] })(request(SIGNED));
			await expect(response.json()).resolves.toEqual({ ok: true, receipt: false });
			expect(lead.send).toHaveBeenCalledOnce();
			expect(siteverifyCalls()).toEqual([]);
			const sent = await reports();
			expect(sent).toHaveLength(1);
			expect(sent[0]).toContain(
				"Contact form sends a spam check token and the endpoint names no guard, so nothing is checked",
			);
			expect(sent[0]).not.toContain(TOKEN);
		});

		it("says nothing of an empty token, of a guarded endpoint, or off production", async () => {
			vi.stubEnv("VERCEL_ENV", "production");
			await createContact({ from: FROM })(request({ ...VALID, turnstile: "" }));
			await guarded()(request(SIGNED));
			vi.stubEnv("VERCEL_ENV", "preview");
			await createContact({ from: FROM })(request(SIGNED));
			expect(await reports()).toEqual([]);
		});
	});

	describe("a site's settings", () => {
		it("throws at load for a receipt with no guard", () => {
			expect(() => createContact({ from: FROM, receipt: {} })).toThrow(
				"a receipt is only ever sent behind a guard",
			);
		});

		it("throws at load for a field under the guard's token key", () => {
			const guard = { ...turnstileGuard(), tokenKey: "proof" };
			expect(() =>
				createContact({
					from: FROM,
					guard,
					fields: [...PLAIN_FIELDS, { key: "proof", label: "Proof" }],
				}),
			).toThrow(`"proof" is the key the guard's token arrives under`);
			expect(() =>
				createContact({
					from: FROM,
					guard: turnstileGuard(),
					fields: [...PLAIN_FIELDS, { key: "turnstile", label: "Token" }],
				}),
			).toThrow('"turnstile" is a key the endpoint reads for itself');
		});
	});
});
