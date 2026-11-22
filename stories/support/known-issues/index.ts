import { issues as chrome } from "./chrome";
import { issues as emailApp } from "./email-app";
import { issues as primitives } from "./primitives";
import { issues as sections } from "./sections";
import type { Issue } from "./types";

/**
 * Known issues: failures a story exposes in a component, which a later pass
 * fixes in `src/`. Each writer group keeps its own file beside this one
 * (`chrome.ts`, `sections.ts`, `primitives.ts`, `email-app.ts`) and its own
 * findings file in stories/findings/, so parallel writers never edit one
 * file; this index only merges them and is edited by nobody in a story pass.
 *
 * An accessibility rule is lifted off the failing elements alone, never off
 * the page and never the whole check:
 *
 *   tags: ["known-issue"],
 *   parameters: { ...knownIssues("primary-button-contrast") },
 *
 * Always spread it into an object literal. Storybook's docs transform
 * rewrites `parameters` to add a doc comment's text, and a bare call there
 * is silently dropped whenever the meta or the story carries a doc comment.
 *
 * Grep `known-issue` to find every story still carrying one. A marker
 * cannot outlive its bug: after each story the preview puts the rule back on
 * the marked elements and fails the story, naming the id, when it finds
 * nothing there (stale.ts). Delete the entry and TypeScript names every story
 * to clean up.
 */
const groups = { chrome, sections, primitives, emailApp };

/** Every group's issues by id, for the preview's stale marker check. */
export const issues: Record<string, Issue> = {};
for (const [group, entries] of Object.entries(groups)) {
	for (const [id, issue] of Object.entries(entries)) {
		if (id in issues) throw new Error(`Known issue "${id}" is declared twice (again in ${group}).`);
		issues[id] = issue;
	}
}

export type KnownIssue =
	| keyof typeof chrome
	| keyof typeof sections
	| keyof typeof primitives
	| keyof typeof emailApp;

/** Every element of a selector list, and everything inside them. */
function andInside(elements: string): string {
	return elements
		.split(",")
		.map((part) => part.trim())
		.flatMap((part) => [`:not(${part})`, `:not(${part} *)`])
		.join("");
}

/**
 * The parameters that scope each named issue's rule away from its elements.
 * Issues sharing a rule are folded into one selector, since axe takes one
 * selector per rule, and they all go in one call, since Storybook replaces an
 * array parameter rather than merging it. The ids ride along as
 * `knownIssueIds`, which the preview judges after the story (stale.ts).
 */
export function knownIssues(...names: KnownIssue[]) {
	const byRule = new Map<string, { base: string; lists: string[] }>();
	for (const name of names) {
		const issue = issues[name] as Issue;
		const entry = byRule.get(issue.rule) ?? { base: issue.base ?? "*", lists: [] };
		entry.lists.push(issue.elements);
		byRule.set(issue.rule, entry);
	}
	const rules = [...byRule].map(([id, { base, lists }]) => {
		const skip = lists.map(andInside).join("");
		return {
			id,
			selector: base
				.split(",")
				.map((part) => `${part.trim()}${skip}`)
				.join(", "),
		};
	});
	return { a11y: { config: { rules } }, knownIssueIds: names };
}

/**
 * A behavior bug a story exposes, written as the check the fixed component
 * passes. The step runs the check and expects it to fail, so the suite stays
 * green while the bug stands and goes red the day it is fixed, naming the
 * marker to delete. The id is the bug's line in its group's findings file.
 *
 *   await knownBug("sticky-bar-covers-closing-bar", async () => {
 *     await expect(closingBar.bottom).toBeLessThanOrEqual(bar.top);
 *   });
 */
export async function knownBug(id: string, check: () => Promise<void> | void) {
	try {
		await check();
	} catch {
		return;
	}
	throw new Error(
		`Known bug "${id}" no longer reproduces. Delete its knownBug call and its line in stories/findings/.`,
	);
}
