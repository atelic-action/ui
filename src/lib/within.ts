/**
 * One call held to a limit: settles with what `task` gives, or with
 * `late()` once `ms` pass, whichever comes first. The signal handed to
 * `task` is aborted at the limit, so a fetch inside it stops too, and the
 * limit answers for a task that ignores its signal, so nothing can hold the
 * caller past it. A task that throws or rejects rejects the call.
 *
 * Plain TypeScript with no imports, so the contact endpoint and its guard,
 * which ship compiled, use this one copy.
 */
export async function within<T>(
	ms: number,
	task: (signal: AbortSignal) => Promise<T>,
	late: () => T,
): Promise<T> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const cutOff = new Promise<T>((resolve) => {
		timer = setTimeout(() => {
			controller.abort();
			resolve(late());
		}, ms);
	});
	// Started inside a promise, so a task that throws before it awaits is a
	// rejection like any other.
	const answered = Promise.resolve().then(() => task(controller.signal));
	try {
		return await Promise.race([answered, cutOff]);
	} finally {
		clearTimeout(timer);
	}
}
