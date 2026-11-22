import type { Issue } from "./types";

/** The sections' known issues. Written only by the sections' writer; see stories/findings/sections.md. */
export const issues = {
	/**
	 * The serif accent in a heading (`em.serif`, base.css) reads `--primary`
	 * whatever the band: 2.8:1 on `--surface-alt` at 67px, under even the
	 * large text floor of 3:1. Shares its cause with the primary as small text.
	 */
	"serif-accent-contrast": { rule: "color-contrast", elements: "em.serif" },
	/** A credential's mono code, `--primary` on `--card`: 3.31:1 at 12.5px. The primary as small text again. */
	"credential-code-contrast": { rule: "color-contrast", elements: ".cert-list .ci" },
	/**
	 * Small muted text set in `--neutral-500`: 3.38:1 on `--surface` and 3.12:1
	 * on `--surface-alt`, at 11.5 to 15.2px. A closed day's hours, the journal's
	 * dates and reading times, a post's way back and byline, the comparison's
	 * heads, ungraded notes, and footnote, and a legal page's dateline.
	 */
	"muted-text-contrast": {
		rule: "color-contrast",
		elements:
			".hours-row.closed, .bi-meta, .bp-back, .bp-meta, .cmp-table thead th, .cmp-grade.is-note, .cmp-footnote, .legal-updated",
	},
	/**
	 * A feature's mono index and a linked card's label read `--primary` as
	 * small text: 3.04:1 on `--surface`, 3.31:1 on `--card`. The primary as small text.
	 */
	"feature-num-contrast": { rule: "color-contrast", elements: ".feature-num, .feature-link" },
	/** The pricing card's ribbon, `--primary` on `--card`: 3.31:1 at 11.5px. The primary as small text. */
	"pricing-ribbon-contrast": { rule: "color-contrast", elements: ".cost-card .ribbon" },
	/**
	 * The pricing band's small words on the primary field: the eyebrow 3.42:1,
	 * the lead 2.71:1, the unit 2.47:1, the detail link 2.64:1. The same cause
	 * as `on-primary-field-contrast`, in a band that does not wear `.on-primary`.
	 */
	"price-band-contrast": {
		rule: "color-contrast",
		elements: ".price-band .eyebrow, .price-band .price-lead, .price-unit, .price-detail",
	},
	/** Each step's title is an `h4` under the band's `h2`, skipping `h3`. */
	"process-step-heading-order": {
		rule: "heading-order",
		elements: ".process .steps h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
} satisfies Record<string, Issue>;
