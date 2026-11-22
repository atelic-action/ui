import type { Issue } from "./types";

/**
 * The chrome's known issues, and the setup's (the foundations stories).
 * Written only by the chrome's writer; each id has its line in
 * stories/findings/chrome.md.
 */
export const issues = {
	/** The dock's launcher and panel head set `--on-primary` (white) on `--primary`: 3.42:1 on the theme. */
	"dock-on-primary-contrast": { rule: "color-contrast", elements: ".cd-launch, .cd-head" },
	/** Small text colored `--primary` on `--surface`, 3.04:1 on the theme. */
	"nav-current-contrast": {
		rule: "color-contrast",
		elements: ".nav-group-btn.is-current, .nav-links > a.active, .nav-mega-link[aria-current]",
	},
	/** The highlighted icon row: its words on the primary field. */
	"nav-row-highlight-contrast": { rule: "color-contrast", elements: ".nav-mega-row.is-highlight" },
	/** A panel link's badge: `--on-primary` (white) on `--primary`, 3.42:1 at 10.5px on the theme. */
	"nav-badge-contrast": { rule: "color-contrast", elements: ".nav-mega-badge" },
	/** The feature card's eyebrow, `--primary-bright` on the card's deep primary: 1.89:1 on the theme. */
	"nav-feature-eyebrow-contrast": { rule: "color-contrast", elements: ".nav-feature-eyebrow" },
	/** A tile's letter runs into the wordmark, so the lockup's name misses its visible text. */
	"tile-lockup-name": { rule: "label-content-name-mismatch", elements: ".nav-logo" },
	/** The footer's column headings are always `h4`, so a page ending on an `h1` or `h2` skips levels. */
	"footer-heading-order": {
		rule: "heading-order",
		elements: ".footer h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
	/**
	 * Not a bug: a limit of the checker. On a page taller than the screen axe
	 * scrolls the page as it measures, synchronously, so the transparent header
	 * never hears the scroll and is judged, still clear, against the page below
	 * the hero. Its contrast over the hero is checked in SiteHeader's
	 * Transparent story, on a page one hero tall.
	 */
	"checker-transparent-header": { rule: "color-contrast", elements: ".nav.is-transparent" },
} satisfies Record<string, Issue>;
