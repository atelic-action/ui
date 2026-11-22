/**
 * Waits for every running CSS transition and animation on the page to finish,
 * so a check that reads colors reads the resting ones, not a hover fading
 * out under a slow machine.
 */
export async function settled(): Promise<void> {
	await Promise.all(
		document.getAnimations().map((animation) => animation.finished.catch(() => {})),
	);
}
