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
			".stat-delta-was, .stat-delta-basis, .stat-delta-change[data-tone='muted'], .stat-change[data-tone='muted'], .stat-period, .stat-out-of, .stat-unit, .stat .note, .stat-row.is-quiet .lbl, .disclosure-meta",
	},
	/** Words in the package's own `--tone-good` (#1b7f3b) on the page surface: 4.49:1. */
	"tone-good-text-contrast": {
		rule: "color-contrast",
		elements: ".stat-change[data-tone='good'], .stat-delta-change[data-tone='good']",
	},
	/**
	 * Not a bug: a limit of the checker. The watermark's tiled layer is faint
	 * on purpose (1.07:1) and hidden from assistive tech, decoration WCAG
	 * exempts, but axe measures hidden text too.
	 */
	"checker-watermark-tiles": { rule: "color-contrast", elements: ".gate-wm-tile" },
} satisfies Record<string, Issue>;
