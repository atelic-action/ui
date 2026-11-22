import type { Issue } from "./types";

/** The sections' known issues. Written only by the sections' writer; see stories/findings/sections.md. */
export const issues = {} satisfies Record<string, Issue>;
