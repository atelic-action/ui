import { selectorList } from "./selectors";
import type { Issue } from "./types";

/**
 * Stale markers fail the run. A marker lifts an axe rule off the elements
 * that fail it (`knownIssues`), or reports a story's whole check without
 * failing it (`a11y: { test: "todo" }`); either would stay silent forever
 * after the bug it names was fixed. So after every story the preview judges
 * each marker the story carries, with the rule put back:
 *
 * - An issue whose elements the story shows, and on which its rule now
 *   finds nothing, fails the story, naming the id.
 * - An issue whose elements the story does not show is not judged there (a
 *   marker on a meta covers stories without the element).
 * - An issue that no story in a file ever shows violating fails the file
 *   once its last story has run, naming the id.
 * - A story marked `todo` whose full check finds nothing fails, since it no
 *   longer needs the opt out.
 *
 * `knownBug` already fails the day its check passes; this does the same for
 * the accessibility markers.
 */

/** What judging one issue in one story found. */
export type Verdict = "violated" | "fixed" | "absent";

/** The Storybook elements axe never judges, as the a11y addon leaves them out. */
const STORYBOOK = [".sb-wrapper", "#storybook-docs", "#storybook-highlights-root"];

async function loadAxe() {
	const axe = (await import("axe-core")).default;
	axe.reset();
	// The addon switches `region` off for component stories; so does this.
	axe.configure({ rules: [{ id: "region", enabled: false }] });
	return axe;
}

/**
 * Runs an issue's rule, as axe defines it (its own selector, the `base` an
 * issue names), over the whole page as it stands, and asks whether any
 * violation falls on the elements the issue names or inside them. The page
 * is the scope, never the elements alone: a page level rule judges an
 * element against the rest of the page (`heading-order` reads the headings
 * before it, `link-in-text-block` the words around the link), so run on the
 * elements alone it would find a different answer. `violated` while the bug
 * stands, `fixed` once none of its elements fails, `absent` when the page
 * shows none of the elements.
 */
export async function judgeIssue(issue: Issue, root: ParentNode = document): Promise<Verdict> {
	const elements = [...root.querySelectorAll(issue.elements)].filter(
		(element) => !STORYBOOK.some((selector) => element.closest(selector)),
	);
	if (elements.length === 0) return "absent";
	const axe = await loadAxe();
	try {
		const result = await axe.run(
			{ include: [root], exclude: STORYBOOK.map((selector) => [selector]) } as never,
			{
				runOnly: { type: "rule", values: [issue.rule] },
				resultTypes: ["violations"],
				elementRef: true,
			},
		);
		const failing = result.violations.flatMap((violation) =>
			violation.nodes.map((node) => (node as { element?: Element }).element),
		);
		const hit = failing.some(
			(node) => node && elements.some((element) => element === node || element.contains(node)),
		);
		return hit ? "violated" : "fixed";
	} catch (error) {
		// A layer that was closing when it was found is gone by the time axe looks: the page shows none of it.
		if (elements.every((element) => !element.isConnected)) return "absent";
		throw error;
	} finally {
		axe.reset();
	}
}

/**
 * The number of violations the story's whole check finds, run as the a11y
 * addon runs it (its config and context included) but reporting rather than
 * failing, for judging a story marked `todo`.
 */
export async function fullCheckViolations(a11y: {
	config?: { rules?: { id: string; enabled?: boolean; selector?: string }[] };
	options?: Record<string, unknown>;
	context?: unknown;
}): Promise<number> {
	const axe = await loadAxe();
	try {
		axe.configure({
			rules: [{ id: "region", enabled: false }, ...(a11y.config?.rules ?? [])],
		} as never);
		const context = (a11y.context as object | undefined) ?? {
			include: [document.body],
			exclude: STORYBOOK.map((selector) => [selector]),
		};
		const result = await axe.run(
			context as Parameters<typeof axe.run>[0] & object,
			(a11y.options ?? {}) as Record<string, unknown>,
		);
		return result.violations.length;
	} finally {
		axe.reset();
	}
}

/**
 * The ids a story carries, in sets that can be judged apart. Two issues
 * lifting one rule off one element cannot be: putting the rule back on the
 * element gives one verdict for both. Such ids are judged together, as one
 * set: stale only when the element passes, which ends every cause they name,
 * and the message names them all and asks for them to be merged. The cost,
 * stated plainly: while any one of them still fails, a sibling whose own
 * cause is fixed cannot be told stale in that story, so a cause should be
 * carried alone by at least one story, or the ids merged into one.
 */
export function judgedTogether(ids: string[], all: Record<string, Issue>): string[][] {
	const sets: string[][] = [];
	const keys = (id: string) => {
		const issue = all[id];
		return issue ? selectorList(issue.elements).map((element) => `${issue.rule} ${element}`) : [];
	};
	for (const id of ids) {
		const mine = keys(id);
		const set = sets.find((existing) =>
			existing.some((other) => keys(other).some((key) => mine.includes(key))),
		);
		if (set) set.push(id);
		else sets.push([id]);
	}
	return sets;
}

/** One file's tally: every id its stories carried, and whether any showed it violating. */
const ledger = new Map<string, { violated: boolean; stories: string[] }>();

/** The message a story or a file fails with when a marker outlived its bug. */
export function staleMessage(id: string, where: string): string {
	return `Known issue "${id}" no longer reproduces ${where}. Delete its knownIssues entry, the marker on the stories, and its line in stories/findings/.`;
}

/**
 * Judges every marker a story carries, after its play function and the
 * addon's own check. Throws, failing the story, when an issue's elements are
 * on the page and its rule finds nothing there, or when a `todo` story's
 * full check passes.
 */
export async function judgeStoryMarkers(context: {
	id: string;
	name: string;
	parameters: Record<string, unknown>;
	viewMode?: string;
	issues: Record<string, Issue>;
}): Promise<void> {
	if (context.viewMode && context.viewMode !== "story") return;
	const ids = ((context.parameters.knownIssueIds as string[] | undefined) ?? []).filter(
		(id) => context.issues[id],
	);
	const fixed: string[] = [];
	for (const set of judgedTogether(ids, context.issues)) {
		// A set's issues share their rule, and at least one element: one
		// judgment over all their elements serves them all.
		const first = context.issues[set[0] as string] as Issue;
		const verdict = await judgeIssue({
			...first,
			elements: set.map((id) => (context.issues[id] as Issue).elements).join(", "),
		});
		for (const id of set) {
			const entry = ledger.get(id) ?? { violated: false, stories: [] };
			entry.stories.push(context.name);
			if (verdict === "violated") entry.violated = true;
			ledger.set(id, entry);
		}
		if (verdict !== "fixed") continue;
		fixed.push(
			set.length === 1
				? staleMessage(set[0] as string, `in "${context.name}": the elements are here and pass`)
				: `Known issues ${set.map((id) => `"${id}"`).join(", ")} no longer reproduce in "${context.name}": they lift one rule off one element, so they are judged together and the element now passes. Delete them, or merge any whose cause stands into one id for the shared cause.`,
		);
	}
	if (fixed.length > 0) throw new Error(fixed.join("\n"));
	const a11y = context.parameters.a11y as Parameters<typeof fullCheckViolations>[0] & {
		test?: string;
	};
	if (a11y?.test === "todo" && (await fullCheckViolations(a11y)) === 0) {
		throw new Error(
			`Story "${context.name}" is marked a11y: { test: "todo" } and its full accessibility check now passes. Remove the opt out, and its line in stories/findings/.`,
		);
	}
}

/**
 * Run after a file's last story: an id carried in the file that no story
 * there ever showed violating fails the file, so a marker set on stories
 * that never show its elements cannot linger either.
 */
export function judgeFileMarkers(): void {
	const stale = [...ledger].filter(([, entry]) => !entry.violated);
	ledger.clear();
	if (stale.length === 0) return;
	throw new Error(
		stale
			.map(([id, entry]) =>
				staleMessage(id, `in any story of this file (carried by ${entry.stories.join(", ")})`),
			)
			.join("\n"),
	);
}
