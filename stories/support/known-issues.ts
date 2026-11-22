/**
 * Known issues: accessibility failures a story exposes in a component, which
 * a later pass fixes in `src/`. Each one is listed in stories/FINDINGS.md
 * under its id, and a story that shows it lifts that one axe rule off those
 * elements alone, never off the page and never the whole check:
 *
 *   tags: ["known-issue"],
 *   parameters: { ...knownIssues("white-on-primary") },
 *
 * Always spread it into an object literal. Storybook's docs transform
 * rewrites `parameters` to add a doc comment's text, and a bare call there
 * is silently dropped whenever the meta or the story carries a doc comment.
 *
 * Grep `known-issue` to find every story still carrying one. When the fix
 * lands, delete the entry here and TypeScript names every story to clean up.
 */
const issues = {
	/**
	 * The primary button, the dock's launcher, and the dock panel's head paint their words a literal
	 * `#fff` on `--primary`, 3.42:1 on the theme, and no token lets a theme fix it.
	 */
	"white-on-primary": { rule: "color-contrast", elements: ".btn-primary, .cd-launch, .cd-head" },
	/** Small text colored `--primary` on the page surfaces: 3.04:1 on `--surface`, 2.8:1 on `--surface-alt`. */
	"primary-text-contrast": {
		rule: "color-contrast",
		elements:
			".nav-group-btn.is-current, .nav-links > a.active, .nav-mega-link[aria-current], .eyebrow",
	},
	/** A tile's letter runs into the wordmark, so the lockup's name misses its visible text. */
	"tile-lockup-name": { rule: "label-content-name-mismatch", elements: ".nav-logo" },
	/** The footer's column headings are always `h4`, so a page whose last heading is an `h1` or `h2` skips a level. */
	"footer-heading-order": {
		rule: "heading-order",
		elements: ".footer h4",
		base: "h1, h2, h3, h4, h5, h6, [role=heading]",
	},
	/**
	 * Not a bug: a limit of the checker. On a page taller than the screen axe
	 * scrolls the page as it measures, synchronously, so the transparent header
	 * never hears the scroll and is judged, still clear, against the page below
	 * the hero. Its contrast over the hero is checked where it is true: the
	 * header's own Transparent story, on a page one hero tall.
	 */
	"checker-transparent-header": { rule: "color-contrast", elements: ".nav.is-transparent" },
	/** White words on the primary field (`.on-primary`), 3.42:1 on the theme. */
	"on-primary-contrast": { rule: "color-contrast", elements: ".on-primary" },
} satisfies Record<string, Issue>;

interface Issue {
	/** The axe rule id the story fails. */
	rule: string;
	/** The failing elements, as a selector list; the rule skips them and everything inside. */
	elements: string;
	/**
	 * The rule's own selector, when axe gives it one other than `*` (read it in
	 * axe-core's rule definition). It is replaced, so the scoped one starts from it.
	 */
	base?: string;
}

export type KnownIssue = keyof typeof issues;

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
 * array parameter rather than merging it.
 */
export function knownIssues(...names: KnownIssue[]) {
	const byRule = new Map<string, { base: string; lists: string[] }>();
	for (const name of names) {
		const issue: Issue = issues[name];
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
	return { a11y: { config: { rules } } };
}

/**
 * A behavior bug a story exposes, written as the check the fixed component
 * passes. The step runs the check and expects it to fail, so the suite stays
 * green while the bug stands and goes red the day it is fixed, naming the
 * marker to delete. The id is the bug's line in stories/FINDINGS.md.
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
		`Known bug "${id}" no longer reproduces. Delete its knownBug call and its line in stories/FINDINGS.md.`,
	);
}
