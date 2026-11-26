// @vitest-environment node
import {
	type Destination,
	type DestinationResult,
	down,
	legError,
	refused,
	relay,
	type Submission,
} from "../../src/forms/relay";

const DSN = "https://abc@o1.ingest.us.sentry.io/1";
const INGEST = "https://o1.ingest.us.sentry.io/api/1/envelope/";

const SUBMISSION: Submission = {
	id: "sub-1",
	fields: { name: "Jane Doe", email: "jane@example.com", message: "A private message." },
};

const delivered: DestinationResult = { status: "delivered", reference: "ref-1" };

/** A destination that answers each try with the next of `answers`, the last one repeating. */
function scripted(name: string, ...answers: (DestinationResult | Error)[]) {
	const send = vi.fn(async () => {
		const answer = answers[Math.min(send.mock.calls.length - 1, answers.length - 1)];
		if (answer instanceof Error) throw answer;
		return answer as DestinationResult;
	});
	return { name, send } satisfies Destination;
}

/** A destination that never answers, and records whether its signal was aborted. */
function silent(name: string, timeoutMs?: number) {
	const signals: AbortSignal[] = [];
	const send = vi.fn((_: Submission, context: { signal: AbortSignal }) => {
		signals.push(context.signal);
		return new Promise<DestinationResult>(() => {});
	});
	return { name, timeoutMs, send, signals };
}

/** The envelopes sent to Sentry, once every send in flight has started. */
async function reports(): Promise<{ envelope: string; event: Record<string, unknown> }[]> {
	await vi.advanceTimersByTimeAsync(0);
	return vi
		.mocked(fetch)
		.mock.calls.filter(([url]) => String(url).startsWith(INGEST))
		.map(([, init]) => {
			const envelope = String(init?.body);
			return { envelope, event: JSON.parse(envelope.split("\n")[2] ?? "{}") };
		});
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.stubEnv("SENTRY_DSN", "");
	vi.stubEnv("VITE_SENTRY_DSN", DSN);
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

describe("relay", () => {
	it("hands the submission to every destination and reports nothing when all take it", async () => {
		const email = scripted("email", delivered);
		const crm = scripted("crm", { status: "duplicate" });
		const result = await relay(SUBMISSION, [email, crm]);

		expect(result.taken).toBe(true);
		expect(result.legs).toEqual([
			{ destination: "email", result: delivered, attempts: 1 },
			{ destination: "crm", result: { status: "duplicate" }, attempts: 1 },
		]);
		expect(email.send).toHaveBeenCalledWith(SUBMISSION, expect.objectContaining({ attempt: 1 }));
		expect(await reports()).toHaveLength(0);
	});

	it("starts every destination at once, so a slow one never delays another", async () => {
		const slow = silent("slow");
		const fast = scripted("fast", delivered);
		const running = relay(SUBMISSION, [slow, fast]);
		// Nothing has been waited on, and both have been called.
		await vi.advanceTimersByTimeAsync(0);
		expect(slow.send).toHaveBeenCalledTimes(1);
		expect(fast.send).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(8000);
		const result = await running;
		expect(result.taken).toBe(true);
		expect(result.legs[1]).toEqual({ destination: "fast", result: delivered, attempts: 1 });
	});

	it("tries a down destination once more after the wait, and takes the second answer", async () => {
		const email = scripted("email", down(new Error("connect ECONNRESET")), delivered);
		const running = relay(SUBMISSION, [email]);
		await vi.advanceTimersByTimeAsync(999);
		expect(email.send).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		const result = await running;

		expect(email.send).toHaveBeenCalledTimes(2);
		expect(email.send).toHaveBeenLastCalledWith(
			SUBMISSION,
			expect.objectContaining({ attempt: 2 }),
		);
		expect(result).toEqual({
			taken: true,
			legs: [{ destination: "email", result: delivered, attempts: 2 }],
		});
		expect(await reports()).toHaveLength(0);
	});

	it("waits the configured time before the second try", async () => {
		const email = scripted("email", down(new Error("down")), delivered);
		const running = relay(SUBMISSION, [email], { retryWaitMs: 250 });
		await vi.advanceTimersByTimeAsync(249);
		expect(email.send).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		await running;
		expect(email.send).toHaveBeenCalledTimes(2);
	});

	it("drops a destination that is down twice and reports it by name and cause", async () => {
		const email = scripted("email", delivered);
		const crm = scripted("crm", down(new Error("crm answered 503")));
		const running = relay(SUBMISSION, [email, crm], {
			request: new Request("http://localhost/api/contact?x=1", { method: "POST" }),
			tags: { route: "contact" },
		});
		await vi.advanceTimersByTimeAsync(1000);
		const result = await running;

		// The visitor's submission was taken, by the email alone.
		expect(result.taken).toBe(true);
		expect(crm.send).toHaveBeenCalledTimes(2);
		expect(result.legs[1]?.attempts).toBe(2);

		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.event.tags).toEqual({
			runtime: "node",
			route: "contact",
			destination: "crm",
			reason: "down",
		});
		expect(sent[0]?.envelope).toContain("Form relay: crm was down on both tries");
		expect(sent[0]?.envelope).toContain("crm answered 503");
		// Nothing of the submission rides along.
		for (const value of Object.values(SUBMISSION.fields)) {
			expect(sent[0]?.envelope).not.toContain(String(value));
		}
	});

	it("never retries a refusal, and reports it", async () => {
		const crm = scripted("crm", refused(new Error("crm answered 422: bad field")));
		const result = await relay(SUBMISSION, [crm]);

		expect(crm.send).toHaveBeenCalledTimes(1);
		expect(result.taken).toBe(false);
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.event.tags).toMatchObject({ destination: "crm", reason: "refused" });
		expect(sent[0]?.envelope).toContain("Form relay: crm refused the submission");
	});

	it("counts a throw as down and tries again", async () => {
		const email = scripted("email", new Error("getaddrinfo ENOTFOUND"), delivered);
		const running = relay(SUBMISSION, [email]);
		await vi.advanceTimersByTimeAsync(1000);
		const result = await running;
		expect(result.taken).toBe(true);
		expect(email.send).toHaveBeenCalledTimes(2);
	});

	it("gives up a try at the destination's limit, aborts it, and counts it as down", async () => {
		const email = silent("email");
		const running = relay(SUBMISSION, [email]);
		await vi.advanceTimersByTimeAsync(2999);
		expect(email.signals[0]?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(email.signals[0]?.aborted).toBe(true);
		// The wait, then the second try, given up at its own limit: seven seconds in all.
		await vi.advanceTimersByTimeAsync(1000);
		expect(email.send).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(2999);
		let settled = false;
		void running.then(() => {
			settled = true;
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(settled).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		const result = await running;

		expect(result.taken).toBe(false);
		expect(result.legs[0]?.attempts).toBe(2);
		const sent = await reports();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.envelope).toContain("email sent no answer within 3000 ms");
	});

	it("honors a destination's own limit", async () => {
		const crm = silent("crm", 500);
		const running = relay(SUBMISSION, [crm]);
		await vi.advanceTimersByTimeAsync(500);
		expect(crm.signals[0]?.aborted).toBe(true);
		await vi.advanceTimersByTimeAsync(1500);
		const result = await running;
		expect(result.legs[0]?.attempts).toBe(2);
	});

	it("cuts every destination off at the deadline, whatever their limits add up to", async () => {
		const crm = silent("crm", 60_000);
		const email = scripted("email", delivered);
		const running = relay(SUBMISSION, [email, crm], { deadlineMs: 2000 });
		await vi.advanceTimersByTimeAsync(1999);
		expect(crm.signals[0]?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		const result = await running;

		expect(crm.signals[0]?.aborted).toBe(true);
		expect(crm.send).toHaveBeenCalledTimes(1);
		expect(result.taken).toBe(true);
		expect(result.legs[1]?.result).toMatchObject({ status: "failed", reason: "down" });
		const sent = await reports();
		expect(sent[0]?.envelope).toContain("the relay's deadline of 2000 ms passed");
	});

	it("makes no second try when the deadline passes during the wait", async () => {
		const crm = scripted("crm", down(new Error("down")));
		const running = relay(SUBMISSION, [crm], { retryWaitMs: 5000, deadlineMs: 1000 });
		await vi.advanceTimersByTimeAsync(1000);
		const result = await running;
		expect(crm.send).toHaveBeenCalledTimes(1);
		expect(result.taken).toBe(false);
	});

	it("does nothing after it resolves: no timer is left running", async () => {
		const email = scripted("email", delivered);
		await relay(SUBMISSION, [email]);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("sends the reports before it resolves when nothing was taken, since the visitor is waiting", async () => {
		let land: (response: Response) => void = () => {};
		vi.mocked(fetch).mockImplementation(
			() =>
				new Promise<Response>((resolve) => {
					land = resolve;
				}),
		);
		const crm = scripted("crm", refused(new Error("crm answered 422")));
		let settled = false;
		const running = relay(SUBMISSION, [crm]).then((result) => {
			settled = true;
			return result;
		});
		await vi.advanceTimersByTimeAsync(0);
		// The report is in flight, and the relay waits on it.
		expect(
			vi.mocked(fetch).mock.calls.filter(([url]) => String(url).startsWith(INGEST)),
		).toHaveLength(1);
		expect(settled).toBe(false);
		land(new Response("{}", { status: 200 }));
		const result = await running;
		expect(result.taken).toBe(false);
	});

	it("never waits on a report when something was taken", async () => {
		vi.mocked(fetch).mockImplementation(() => new Promise<Response>(() => {}));
		const email = scripted("email", delivered);
		const crm = scripted("crm", refused(new Error("crm answered 422")));
		const result = await relay(SUBMISSION, [email, crm]);
		expect(result.taken).toBe(true);
		expect(await reports()).toHaveLength(1);
		await vi.advanceTimersByTimeAsync(2000);
	});

	it("is not taken with no destinations", async () => {
		expect(await relay(SUBMISSION, [])).toEqual({ taken: false, legs: [] });
	});
});

describe("legError", () => {
	it("is nothing for a leg that was taken", () => {
		expect(legError({ destination: "email", result: delivered, attempts: 1 })).toBeUndefined();
	});

	it("keeps the cause, so a report carries the chain", () => {
		const cause = new Error("fetch failed", { cause: new Error("getaddrinfo ENOTFOUND") });
		const error = legError({ destination: "email", result: down(cause), attempts: 2 });
		expect(error?.cause).toBe(cause);
	});
});
