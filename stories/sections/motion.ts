/**
 * Turns the reader's `prefers-reduced-motion` setting on or off for the page,
 * through the test browser's DevTools protocol, so a stylesheet's
 * `@media (prefers-reduced-motion: reduce)` really applies: answering
 * `matchMedia` in script, as FullBleedVideo's story does, reaches a
 * component that decides in script and never a sheet. Outside the test run
 * (the Storybook site, `storybook build`) it does nothing and says so, and a
 * story reads the answer to skip what it cannot show.
 *
 * Kept with the sections' stories because the sections' writer may write
 * only here; it belongs in stories/support/ beside the viewports once the
 * shared files open again.
 */
export async function emulateReducedMotion(reduce: boolean): Promise<boolean> {
	if (!import.meta.env.VITEST_STORYBOOK) return false;
	const { cdp } = await import("vitest/browser");
	// The session's type is filled in by the provider's own types, which the
	// stories' config does not load; Playwright's Chromium session has `send`.
	const session = cdp() as unknown as { send(method: string, params: object): Promise<unknown> };
	await session.send("Emulation.setEmulatedMedia", {
		features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
	});
	return true;
}

/** A story's `beforeEach` that emulates reduced motion and restores it after. */
export const withReducedMotion = async () => {
	await emulateReducedMotion(true);
	return async () => {
		await emulateReducedMotion(false);
	};
};
