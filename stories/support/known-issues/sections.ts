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
	/** The marked jump rail tab, `--primary` on the rail's `--surface`: about 3:1 at 15.2px. The primary as small text. */
	"jump-rail-active-contrast": { rule: "color-contrast", elements: ".jump-rail a.active" },
	/** An expand row's mono index, `--primary` on `--surface`: 3.04:1 at 12.5px. The primary as small text. */
	"expand-index-contrast": { rule: "color-contrast", elements: ".xl-num" },
	/** A location card's note, `--primary` on `--card`: 3.31:1 at 11.5px. The primary as small text. */
	"location-note-contrast": { rule: "color-contrast", elements: ".loc-note" },
	/** A profile's mono line and link label, `--primary` on `--card`: 3.31:1 at 12 and 14.7px. The primary as small text. */
	"profile-meta-contrast": { rule: "color-contrast", elements: ".profile-meta, .profile-link" },
	/**
	 * The static map's Get Directions pill, `--on-primary` (white) on
	 * `--primary`: 3.42:1 at 13px. The same cause as `on-primary-field-contrast`.
	 */
	"map-directions-contrast": { rule: "color-contrast", elements: ".map-directions" },
	/**
	 * Soft words on the inset well: the map facade's hint and a gallery
	 * tile's shot brief, `--ink-soft` on `--surface-inset`, 4.4:1 at 12.8 and 13px.
	 */
	"inset-soft-text-contrast": {
		rule: "color-contrast",
		elements: ".map-facade-hint, .gallery-frame.ph",
	},
	/**
	 * The map facade's name, "Load the map to <name>, <address>", does not
	 * contain its visible words, "<address> Tap to load the map", so a reader
	 * who speaks what they see cannot press it by voice.
	 */
	"map-facade-name-mismatch": { rule: "label-content-name-mismatch", elements: ".map-facade" },
	/** The hours block's heading is an `h4` under the section's `h2`, skipping `h3`. */
	"location-hours-heading-order": {
		rule: "heading-order",
		elements: ".loc-block h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
} satisfies Record<string, Issue>;
