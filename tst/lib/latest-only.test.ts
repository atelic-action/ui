import { latestOnly } from "../../src/lib/latestOnly";

/** A promise the test settles by hand, to answer lookups out of order. */
function held<T>() {
	let resolve: (value: T) => void = () => {};
	let reject: (error: unknown) => void = () => {};
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}

describe("latestOnly", () => {
	it("hands back the answer to the latest question", async () => {
		const lookups = latestOnly();
		const answer = await lookups.run(async () => "fresh");
		expect(answer).toEqual({ stale: false, value: "fresh" });
	});

	it("drops an earlier answer that arrives after a later one", async () => {
		const lookups = latestOnly();
		const first = held<string>();
		const second = held<string>();
		const early = lookups.run(() => first.promise);
		const late = lookups.run(() => second.promise);
		second.resolve("second");
		first.resolve("first");
		await expect(late).resolves.toEqual({ stale: false, value: "second" });
		await expect(early).resolves.toEqual({ stale: true });
	});

	it("drops an earlier answer that arrives first, too", async () => {
		const lookups = latestOnly();
		const first = held<string>();
		const early = lookups.run(() => first.promise);
		const late = lookups.run(async () => "second");
		first.resolve("first");
		await expect(early).resolves.toEqual({ stale: true });
		await expect(late).resolves.toEqual({ stale: false, value: "second" });
	});

	it("aborts the signal of the run a newer one replaces, and only that one", async () => {
		const lookups = latestOnly();
		const signals: AbortSignal[] = [];
		const first = held<string>();
		lookups.run((signal) => {
			signals.push(signal);
			return first.promise;
		});
		lookups.run(async (signal) => {
			signals.push(signal);
			return "second";
		});
		expect(signals[0]?.aborted).toBe(true);
		expect(signals[1]?.aborted).toBe(false);
	});

	it("makes whatever is in flight stale on cancel", async () => {
		const lookups = latestOnly();
		const first = held<string>();
		let seen: AbortSignal | undefined;
		const early = lookups.run((signal) => {
			seen = signal;
			return first.promise;
		});
		lookups.cancel();
		first.resolve("first");
		await expect(early).resolves.toEqual({ stale: true });
		expect(seen?.aborted).toBe(true);
	});

	it("rejects a task that throws before it returns a promise, and runs on after it", async () => {
		const lookups = latestOnly();
		const thrown = lookups.run(() => {
			throw new Error("bad input");
		});
		await expect(thrown).rejects.toThrow("bad input");
		await expect(lookups.run(async () => "next")).resolves.toEqual({ stale: false, value: "next" });
	});

	it("rejects with a failure that still matters, and swallows one a later run replaced", async () => {
		const lookups = latestOnly();
		await expect(lookups.run(() => Promise.reject(new Error("down")))).rejects.toThrow("down");
		const first = held<string>();
		const early = lookups.run(() => first.promise);
		lookups.run(async () => "second");
		first.reject(new Error("aborted"));
		await expect(early).resolves.toEqual({ stale: true });
	});
});
