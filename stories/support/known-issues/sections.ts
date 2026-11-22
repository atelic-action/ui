import type { Issue } from "./types";

/** The sections' known issues. Written only by the sections' writer; see stories/findings/sections.md. */
export const issues = {
	/** Words on the primary field (`.on-primary`): 2.87 to 3.42:1, and a serif accent at 1.38:1, on the theme. */
	"on-primary-field-contrast": { rule: "color-contrast", elements: ".on-primary" },
} satisfies Record<string, Issue>;
