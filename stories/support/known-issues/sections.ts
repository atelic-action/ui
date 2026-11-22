import type { Issue } from "./types";

/**
 * The sections' known issues. Written only by the sections' writer; see
 * stories/findings/sections.md. A cause shared across components carries one
 * id, whatever components show it.
 */
export const issues = {
	/**
	 * Soft words on the inset well: the map facade's hint and a gallery tile's
	 * shot brief, `--neutral-600` (`#6b6559`) on `--surface-inset`, 4.4:1 at 12.8 and 13px.
	 */
	"inset-soft-text-contrast": {
		rule: "color-contrast",
		elements: ".map-facade-hint, .gallery-frame.ph",
	},
	/** The carousel's "/ 5" beside the score, `--neutral-300` on `--surface`: 2.05:1 at 25.6px, under the large text floor. */
	"review-score-out-contrast": { rule: "color-contrast", elements: ".rvc-score-out" },
	/**
	 * The contact form's error words in `--primary-deep`: a field's message
	 * 4.17:1 on `--surface` at 13.1px, the send failure 3.96:1 on `--primary-tint` at 17px.
	 */
	"form-error-contrast": { rule: "color-contrast", elements: ".field .err, .form-error" },
	/**
	 * The map facade's name, "Load the map to <name>, <address>", does not
	 * contain its visible words, "<address> Tap to load the map", so a reader
	 * who speaks what they see cannot press it by voice.
	 */
	"map-facade-name-mismatch": { rule: "label-content-name-mismatch", elements: ".map-facade" },
	/** Each step's title is an `h4` under the band's `h2`, skipping `h3`. */
	"process-step-heading-order": {
		rule: "heading-order",
		elements: ".process .steps h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
	/** The hours block's heading is an `h4` under the section's `h2`, skipping `h3`. */
	"location-hours-heading-order": {
		rule: "heading-order",
		elements: ".loc-block h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
} satisfies Record<string, Issue>;
