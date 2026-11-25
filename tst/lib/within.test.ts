// @vitest-environment node
import { within } from "../../src/lib/within";

describe("within", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("settles with the task's answer when it comes in time", async () => {
		await expect(
			within(
				1000,
				async () => "answered",
				() => "late",
			),
		).resolves.toBe("answered");
	});

	it("settles late at the limit, aborting the task's signal, though the task never ends", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		let signal: AbortSignal | undefined;
		const pending = within(
			500,
			(given) => {
				signal = given;
				return new Promise<string>(() => {});
			},
			() => "late",
		);
		await vi.advanceTimersByTimeAsync(499);
		expect(signal?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		await expect(pending).resolves.toBe("late");
		expect(signal?.aborted).toBe(true);
	});

	it("rejects with a task that throws, even before it awaits", async () => {
		const thrown = new Error("broken");
		await expect(
			within(
				1000,
				() => {
					throw thrown;
				},
				() => "late",
			),
		).rejects.toBe(thrown);
	});
});
