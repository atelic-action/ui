import type { Issue } from "./types";

/**
 * The chrome's known issues, and the setup's (the foundations stories).
 * Written only by the chrome's writer; each id has its line in
 * stories/findings/chrome.md.
 */
export const issues = {
	/**
	 * Not a bug: a limit of the checker. On a page taller than the screen axe
	 * scrolls the page as it measures, synchronously, so the transparent header
	 * never hears the scroll and is judged, still clear, against the page below
	 * the hero. Its contrast over the hero is checked in SiteHeader's
	 * Transparent story, on a page one hero tall.
	 */
	"checker-transparent-header": { rule: "color-contrast", elements: ".nav.is-transparent" },
} satisfies Record<string, Issue>;
