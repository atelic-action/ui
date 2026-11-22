import type { Issue } from "./types";

/**
 * The known issues of the primitives, the components, and the artifact
 * pieces. Written only by that group's writer; see stories/findings/primitives.md.
 */
export const issues = {
	/** `SectionHeading` with `onDark` keeps its lead in `--ink-soft` on the dark band: 2.26:1. */
	"section-heading-on-dark-lead": { rule: "color-contrast", elements: ".section-head-lead" },
	/**
	 * Quiet text in `--neutral-500` on the page surface: 3.38:1 on the theme
	 * (3.68:1 on the card). A theme change to a darker quiet gray is pending
	 * on another branch; the stale ones go once both are on main.
	 */
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
