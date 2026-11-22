import type { Issue } from "./types";

/**
 * The known issues of the primitives, the components, and the artifact
 * pieces. Written only by that group's writer; see stories/findings/primitives.md.
 */
export const issues = {
	/** `.btn-primary` sets `--on-primary` (white) on `--primary`: 3.42:1 on the theme. */
	"primary-button-contrast": { rule: "color-contrast", elements: ".btn-primary" },
	/** The eyebrow colored `--primary` on `--surface-alt`: 2.8:1 on the theme. */
	"eyebrow-contrast": { rule: "color-contrast", elements: ".eyebrow" },
	/** A bubble's number, `--primary` on `--card`: 3.31:1 on the theme. */
	"bubble-number-contrast": { rule: "color-contrast", elements: ".bubble-num" },
	/** A bubble's badge, `--on-primary` (white) on `--primary`: 3.42:1 at 10 to 11.5px bold. */
	"bubble-badge-contrast": { rule: "color-contrast", elements: ".bubble-badge" },
	/** `SectionHeading` with `onDark` keeps its lead in `--ink-soft` on the dark band: 2.26:1. */
	"section-heading-on-dark-lead": { rule: "color-contrast", elements: ".section-head-lead" },
	/** Quiet text in `--neutral-500` on the page surface: 3.38:1 on the theme. */
	"muted-text-contrast": {
		rule: "color-contrast",
		elements:
			".stat-delta-was, .stat-delta-basis, .stat-delta-change[data-tone='muted'], .stat-change[data-tone='muted'], .stat-period, .stat-out-of, .stat-unit, .stat .note, .stat-row.is-quiet .lbl, .disclosure-meta, .gate-fine, .column-chart-group-label span, .threshold-scale-axis i, .rc-title, .op-shot figcaption",
	},
	/** Words in the package's own `--tone-good` (#1b7f3b) on the page surface: 4.49:1. */
	"tone-good-text-contrast": {
		rule: "color-contrast",
		elements:
			".stat-change[data-tone='good'], .stat-delta-change[data-tone='good'], .threshold-scale-value[data-tone='good'], .threshold-scale-axis [data-tone='good']",
	},
	/** A link inside a report card row's line, `--primary` on `--card`: 3.31:1. */
	"report-card-line-link-contrast": { rule: "color-contrast", elements: ".rc-line a" },
	/**
	 * The error fallback's message box (development builds only) scrolls but
	 * cannot be focused, so a keyboard cannot scroll it. It is inline styled
	 * with no class; it is the screen's one `pre`.
	 */
	"error-fallback-message-unfocusable": {
		rule: "scrollable-region-focusable",
		elements: "pre",
		base: "*:not(select):not(textarea)",
	},
	/** A column chart with no bars is a picture with an empty name. */
	"column-chart-empty-unnamed": {
		rule: "role-img-alt",
		elements: ".column-chart-plot",
		// axe's own selector, written without commas inside :not() since the index splits on them.
		base: "[role='img']:not(img):not(area):not(input):not(object), [role='image']:not(img):not(area):not(input):not(object)",
	},
	/** The gate's small words in `--primary` on the surface (its eyebrow, its links): 3.04:1. */
	"gate-primary-text-contrast": {
		rule: "color-contrast",
		elements: ".gate-eyebrow, .gate-fine a, .gate-link-button",
	},
	/** The sorted column's heading in `--primary` on the surface: 3.04:1 at 11.5px. */
	"data-table-active-sort-contrast": {
		rule: "color-contrast",
		elements: ".data-table thead th button[data-active]",
	},
	/** The gate's fine print link differs from the words around it by color alone, 1.11:1, with no underline. */
	"gate-fine-link-distinct": {
		rule: "link-in-text-block",
		elements: ".gate-fine a",
		base: "a[href], [role=link]",
	},
	/** An editable `StarRating` is a slider holding its half star buttons, which a slider's children may not be. */
	"star-rating-nested-buttons": {
		rule: "nested-interactive",
		elements: ".star-rating.is-editable",
	},
	/**
	 * Not a bug: a limit of the checker. The watermark's tiled layer is faint
	 * on purpose (1.07:1) and hidden from assistive tech, decoration WCAG
	 * exempts, but axe measures hidden text too.
	 */
	"checker-watermark-tiles": { rule: "color-contrast", elements: ".gate-wm-tile" },
} satisfies Record<string, Issue>;
