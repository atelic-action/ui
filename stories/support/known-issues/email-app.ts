import type { Issue } from "./types";

/**
 * The known issues of the email kit and the app shell. Written only by that
 * group's writer; see stories/findings/email-app.md. An inline styled email
 * row carries no class to scope a rule by, so an email issue is usually
 * marked `a11y: { test: "todo" }` on the story instead of an entry here.
 */
export const issues = {
	/** The kit's destructive red (`--destructive`, #ef4444): white words on it at 3.6:1, and it as words on the light ground at 3.6 to 3.8:1. */
	"app-destructive-contrast": {
		rule: "color-contrast",
		elements: ".bg-destructive, .text-destructive",
	},
	/** Muted words on the muted well (`text-muted-foreground` on `bg-muted`): 4.39:1 at 12px. */
	"app-muted-well-contrast": {
		rule: "color-contrast",
		elements: ".bg-muted.text-muted-foreground",
	},
	/** The error fallback's details box scrolls but cannot take focus, so a keyboard cannot scroll it. */
	"error-details-not-focusable": {
		rule: "scrollable-region-focusable",
		elements: "pre.bg-muted",
		base: "*:not(select,textarea)",
	},
	/** The rail's user menu trigger shows the user's name but is named "User menu". */
	"user-menu-name-mismatch": {
		rule: "label-content-name-mismatch",
		elements: '[aria-label="User menu"]',
	},
	/** A collapsed rail's links drop their label and carry no name; the tooltip only describes. */
	"collapsed-rail-links-unnamed": {
		rule: "link-name",
		elements: "aside[aria-label] nav a",
		base: "a[href]",
	},
	/** A toolbar action is named by its label alone, so a trailing time (`ago`) shows but is not in the name. */
	"toolbar-action-time-name": {
		rule: "label-content-name-mismatch",
		elements: ".ap-actions .btn-ghost, .ap-actions .btn-solid",
	},
	/**
	 * Not a bug: a limit of the checker. A modal Radix menu hides the rest of
	 * the page with `aria-hidden` (marking each element `data-aria-hidden`) and
	 * holds focus inside itself, so the page's links cannot be reached while it
	 * is open; axe still counts them as focusable inside a hidden region.
	 */
	"checker-radix-hides-page": {
		rule: "aria-hidden-focus",
		elements: '[data-aria-hidden="true"]',
		base: '[aria-hidden="true"]',
	},
} satisfies Record<string, Issue>;
