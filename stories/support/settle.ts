/**
 * Waits for every running CSS transition and animation on the page to finish,
 * so a check that reads colors or opacity reads the resting ones, not a hover
 * fading out or an entrance fading in under a slow machine. A loop that never
 * ends (a marquee) is left out, since it never finishes.
 *
 * It waits only for what is already running: for an entrance that starts a
 * moment after an action, first wait for it to begin (or to have ended), then
 * settle.
 */
export async function settled(): Promise<void> {
	await Promise.all(
		document
			.getAnimations()
			.filter((animation) => animation.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY)
			.map((animation) => animation.finished.catch(() => {})),
	);
}
