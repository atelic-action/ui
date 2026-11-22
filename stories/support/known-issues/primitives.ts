import type { Issue } from "./types";

/**
 * The known issues of the primitives, the components, and the artifact
 * pieces. Written only by that group's writer; see stories/findings/primitives.md.
 */
export const issues = {
	/**
	 * Not a bug: a limit of the checker. The watermark's tiled layer is faint
	 * on purpose (1.07:1) and hidden from assistive tech, decoration WCAG
	 * exempts, but axe measures hidden text too.
	 */
	"checker-watermark-tiles": { rule: "color-contrast", elements: ".gate-wm-tile" },
} satisfies Record<string, Issue>;
