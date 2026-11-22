import { expect, waitFor } from "storybook/test";

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

/*
 * Waiting on a Radix layer (a menu, a popover, a select's list, a dialog, a
 * sheet) by what it is doing, never by a clock. A layer opens and closes with
 * an animation, and Radix unmounts a closing layer only when its exit
 * animation ends; a page under load runs both late. A wait that gives up
 * after a second fails there, and a step that acts on a layer still closing
 * finds the old one. So each wait here holds until the condition is true,
 * bounded only by the story's own time.
 */

/** The longest a wait holds: past any load, inside the story's own timeout. */
const AS_LONG_AS_IT_TAKES = 30_000;

/** Every animation on a layer and inside it has run to its end, or been replaced. */
export async function settledLayer(layer: Element): Promise<void> {
	await Promise.all(
		layer.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
	);
}

/** Wait for a layer to appear, then for its entrance to finish; hands it back. */
export async function layerOpened<T extends HTMLElement>(find: () => T): Promise<T> {
	const layer = await waitFor(find, { timeout: AS_LONG_AS_IT_TAKES });
	await settledLayer(layer);
	return layer;
}

/** Wait for a layer to finish leaving: its exit run and the element unmounted. */
export async function layerClosed(layer: Element): Promise<void> {
	await settledLayer(layer);
	await waitFor(() => expect(layer.isConnected).toBe(false), { timeout: AS_LONG_AS_IT_TAKES });
}

/** Wait until nothing answers a query any more (no menu on the page, say). */
export async function noneLeft(query: () => Element | null): Promise<void> {
	await waitFor(() => expect(query()).toBeNull(), { timeout: AS_LONG_AS_IT_TAKES });
}

/** Wait on any other condition as long as it takes. */
export async function until(check: () => unknown): Promise<void> {
	await waitFor(check, { timeout: AS_LONG_AS_IT_TAKES });
}
