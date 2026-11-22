import { expect, waitFor } from "storybook/test";

/*
 * Waiting on a Radix layer (a menu, a popover, a select's list, a dialog, a
 * sheet) by what it is doing, never by a clock. A layer opens and closes with
 * an animation, and Radix unmounts a closing layer only when its exit
 * animation ends; a page under load runs both late. A wait that gives up
 * after a second fails there, and a step that acts on a layer still closing
 * finds the old one. So each wait here holds until the condition is true,
 * bounded only by the story's own time.
 *
 * The app group's copy of the shared settling (stories/support/settle.ts),
 * scoped to one layer; it moves there once that file grows the layer forms.
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
