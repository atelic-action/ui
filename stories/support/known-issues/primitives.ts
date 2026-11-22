import type { Issue } from "./types";

/**
 * The known issues of the primitives, the components, and the artifact
 * pieces. Written only by that group's writer; see stories/findings/primitives.md.
 */
export const issues = {} satisfies Record<string, Issue>;
