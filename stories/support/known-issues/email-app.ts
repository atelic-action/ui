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
	/**
	 * Muted words (`--muted-foreground`, #71717a) on the kit's grey (`--muted`
	 * and `--accent`, #f4f4f5): 4.39:1 at 12px. The error fallback's details,
	 * a highlighted command item's shortcut.
	 */
	"app-muted-on-grey-contrast": {
		rule: "color-contrast",
		elements:
			".bg-muted.text-muted-foreground, [cmdk-item][data-selected=true] .text-muted-foreground",
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
	/** `AlertTitle` is always an `h5`, so under a page's `h1` the levels skip. */
	"alert-title-heading-level": {
		rule: "heading-order",
		elements: "[role=alert] h5",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
	/** `CommandDialog` renders its dialog with no title and takes none, so the dialog has no name. */
	"command-dialog-unnamed": {
		rule: "aria-dialog-name",
		elements: "[role=dialog]",
		base: '[role="dialog"], [role="alertdialog"]',
	},
	/** A `CommandSeparator` is a `separator` inside the command's `listbox`, which may hold only options and groups. */
	"command-separator-in-listbox": { rule: "aria-required-children", elements: "[cmdk-list]" },
	/** With nothing matching, the command's `listbox` holds no option (the empty line sits beside them). */
	"command-empty-listbox": { rule: "aria-required-children", elements: "[cmdk-list]" },
	/** The country dropdown sets its search box inside its `listbox`, which may hold only options and groups. */
	"country-list-holds-the-search": { rule: "aria-required-children", elements: "[cmdk-list]" },
	/** The country dropdown's popover is a `dialog` with no name. */
	"country-popover-unnamed": {
		rule: "aria-dialog-name",
		elements: "[data-radix-popper-content-wrapper] > [role=dialog]",
		base: '[role="dialog"], [role="alertdialog"]',
	},
	/** Pagination's Prev shows "Prev" and is named "Previous page", which does not hold the word it shows. */
	"pagination-prev-name": {
		rule: "label-content-name-mismatch",
		elements: 'button[aria-label="Previous page"]',
	},
	/** The slider's thumb is drawn by the wrapper with no props, so the `slider` a reader reaches has no name. */
	"slider-thumb-unnamed": {
		rule: "aria-input-field-name",
		elements: "[role=slider]",
		base: '[role="combobox"], [role="listbox"], [role="searchbox"], [role="slider"], [role="spinbutton"], [role="textbox"]',
	},
	/** The shell's default toaster is sonner with `richColors`: the success and error words on their tints fail contrast. */
	"toast-rich-colors-contrast": { rule: "color-contrast", elements: "[data-sonner-toaster]" },
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
