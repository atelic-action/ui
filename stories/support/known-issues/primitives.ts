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
} satisfies Record<string, Issue>;
