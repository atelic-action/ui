import type { Issue } from "./types";

/**
 * The known issues of the email kit and the app shell. Written only by that
 * group's writer; see stories/findings/email-app.md. An inline styled email
 * row carries no class to scope a rule by, so an email issue is usually
 * marked `a11y: { test: "todo" }` on the story instead of an entry here.
 */
export const issues = {} satisfies Record<string, Issue>;
