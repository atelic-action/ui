// @vitest-environment node
import { resendDestination } from "../../src/forms/resend";

const SUBMISSION = { id: "0b6f3c1e-7d2a-4c5b-9e8f-1a2b3c4d5e6f", fields: {} };

function destination(keyNamespace?: string) {
	return resendDestination({
		apiKey: "re_test_key",
		from: "Summit <forms@example.com>",
		to: ["inbox@example.com"],
		keyNamespace,
		compose: () => ({ subject: "Hi", html: "<p>Hi</p>", text: "Hi" }),
	});
}

function answer(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status });
}

const send = (keyNamespace?: string) =>
	destination(keyNamespace).send(SUBMISSION, {
		signal: new AbortController().signal,
		attempt: 2,
	});

afterEach(() => vi.unstubAllGlobals());

describe("resendDestination", () => {
	it("leaves no answer to a send still in flight unread", async () => {
		const response = answer(409, { name: "concurrent_idempotent_requests" });
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
		const result = await send();
		expect(result).toMatchObject({ status: "duplicate" });
		// The body was read, so the runtime holds nothing open for it.
		expect(response.bodyUsed).toBe(true);
	});

	it("still reads a 409 of another kind as a refusal, in Resend's own words", async () => {
		const response = answer(409, {
			name: "invalid_idempotent_request",
			message: "Same idempotency key used with a different request payload",
		});
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
		const result = await send();
		expect(result).toMatchObject({ status: "failed", reason: "refused" });
		expect(result.status === "failed" && result.cause.message).toBe(
			"Resend answered 409: invalid_idempotent_request: Same idempotency key used with a different request payload",
		);
		expect(response.bodyUsed).toBe(true);
	});

	it("writes the key under the namespace when one is given, and as the id alone otherwise", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(async () => answer(200, { id: "re_1" })),
		);
		await send("summit.example.com");
		await send();
		const keys = vi
			.mocked(fetch)
			.mock.calls.map(([, init]) => new Headers(init?.headers).get("Idempotency-Key"));
		expect(keys).toEqual([`summit.example.com/${SUBMISSION.id}`, SUBMISSION.id]);
	});
});
