/** What a lookup run through `latestOnly` settles to. */
export type LatestAnswer<T> = { stale: false; value: T } | { stale: true };

/**
 * Runs asynchronous lookups of which only the latest answer counts: an
 * address search asks again on every pause in the typing, and an answer to
 * an earlier question that arrives after a later one is dropped rather than
 * shown over it. Each new run aborts the signal handed to the one before, so
 * a provider that passes the signal to `fetch` stops the request too. A
 * failed run settles stale when a later run has started, and rejects
 * otherwise, so the caller hears only the failures that still matter.
 */
export function latestOnly() {
	let current = 0;
	let controller: AbortController | null = null;

	return {
		run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<LatestAnswer<T>> {
			controller?.abort();
			const mine = new AbortController();
			controller = mine;
			current += 1;
			const ticket = current;
			return task(mine.signal).then(
				(value) =>
					ticket === current ? { stale: false as const, value } : { stale: true as const },
				(error: unknown) => {
					if (ticket !== current) return { stale: true as const };
					throw error;
				},
			);
		},
		/** Drops whatever is in flight: its answer, when it comes, is stale. */
		cancel() {
			controller?.abort();
			controller = null;
			current += 1;
		},
	};
}
