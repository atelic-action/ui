import type { Issue } from "./types";

/**
 * The sections' known issues. Written only by the sections' writer; see
 * stories/findings/sections.md. A cause shared across components carries one
 * id, whatever components show it. None stands.
 */
export const issues = {} satisfies Record<string, Issue>;
