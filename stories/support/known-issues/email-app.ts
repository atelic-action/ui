import type { Issue } from "./types";

/**
 * The known issues of the email kit and the app shell. Written only by that
 * group's writer; see stories/findings/email-app.md. An inline styled email
 * row carries no class to scope a rule by, so an email issue is usually
 * marked `a11y: { test: "todo" }` on the story instead of an entry here.
 */
export const issues = {
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
