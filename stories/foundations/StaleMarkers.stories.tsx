import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { scopedSelector } from "../support/known-issues";
import { selectorList } from "../support/known-issues/selectors";
import {
	judgedTogether,
	judgeFileMarkers,
	judgeIssue,
	judgeStoryMarkers,
} from "../support/known-issues/stale";
import type { Issue } from "../support/known-issues/types";

/**
 * The proof that a marker cannot outlive its bug (`support/known-issues/stale.ts`).
 * Each step builds a probe on the page, judges it with the same functions
 * the preview runs after every story, and takes the probe away again, so the
 * story's own check sees a clean page. Both directions are shown: a real
 * violation keeps its marker green, and a fixed one turns it red, naming the
 * id; the same for a story marked `todo`, and for a file whose stories never
 * show an id at all. Three more prove how a marker is scoped: a page level
 * rule is judged against the whole page, a selector keeps the commas inside
 * its parentheses, and two markers that cannot be told apart are judged as one.
 */
const meta = {
	title: "Foundations/StaleMarkers",
	parameters: { layout: "padded" },
	render: () => <div id="probe-host">Markers are judged against what the page shows.</div>,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grey words on white, 2.85 to 1: the kind of failure a marker lifts. */
const faint: Issue = { rule: "color-contrast", elements: ".probe-words" };
const issues = {
	"probe-faint": faint,
	"probe-elsewhere": { ...faint, elements: ".probe-nowhere" },
};

/** Puts words on the page in a color, and returns a way to take them away. */
function probe(color: string) {
	const words = document.createElement("p");
	words.className = "probe-words";
	words.textContent = "Order by Friday noon for Saturday.";
	words.style.cssText = `color: ${color}; background: #ffffff; font-size: 14px;`;
	document.getElementById("probe-host")?.append(words);
	return () => words.remove();
}

const story = (parameters: Record<string, unknown>) => ({
	id: "foundations-stalemarkers--probe",
	name: "Probe",
	parameters,
	viewMode: "story",
	issues,
});

export const IssueMarkers: Story = {
	play: async ({ step }) => {
		await step("a real violation stays green", async () => {
			const remove = probe("#999999");
			try {
				await expect(await judgeIssue(faint)).toBe("violated");
				await judgeStoryMarkers(story({ knownIssueIds: ["probe-faint"] }));
			} finally {
				remove();
			}
		});
		await step("a fixed one goes red, naming the id", async () => {
			const remove = probe("#151515");
			try {
				await expect(await judgeIssue(faint)).toBe("fixed");
				await expect(judgeStoryMarkers(story({ knownIssueIds: ["probe-faint"] }))).rejects.toThrow(
					/Known issue "probe-faint" no longer reproduces/,
				);
			} finally {
				remove();
			}
		});
		await step("a story that does not show the elements is not judged", async () => {
			await expect(await judgeIssue(faint)).toBe("absent");
			await judgeStoryMarkers(story({ knownIssueIds: ["probe-faint"] }));
		});
		await step("an id no story of a file shows violating fails the file", async () => {
			await judgeStoryMarkers(story({ knownIssueIds: ["probe-elsewhere"] }));
			// The tally holds probe-faint, seen violating above, and probe-elsewhere,
			// never seen: only the second is named. Judging clears the tally.
			await expect(() => judgeFileMarkers()).toThrow(/"probe-elsewhere"/);
			await expect(() => judgeFileMarkers()).not.toThrow();
		});
	},
};

export const TodoMarker: Story = {
	play: async ({ step }) => {
		const todo = { a11y: { test: "todo" } };
		await step("a story whose full check still fails keeps its todo", async () => {
			const remove = probe("#999999");
			try {
				await judgeStoryMarkers(story(todo));
			} finally {
				remove();
			}
		});
		await step("one whose full check passes fails, asking for the opt out to go", async () => {
			await expect(judgeStoryMarkers(story(todo))).rejects.toThrow(
				/marked a11y: \{ test: "todo" \} and its full accessibility check now passes/,
			);
		});
	},
};

/** Puts two navigation landmarks on the page, the second named as given, the first marked, and returns a way to take them away. */
function landmarks(second: string) {
	const host = document.getElementById("probe-host");
	const made = ["Pages", second].map((name, index) => {
		const nav = document.createElement("nav");
		nav.setAttribute("aria-label", name);
		if (index === 0) nav.className = "probe-nav";
		nav.innerHTML = '<a href="#probe-host">Bread</a>';
		host?.append(nav);
		return nav;
	});
	return () => {
		for (const nav of made) nav.remove();
	};
}

/**
 * A rule that compares an element with the rest of the page is judged
 * against the page, not the marked element alone: `landmark-unique` reports
 * the first of two navigations named alike only with the second in scope, so
 * judged on the marked one alone it would call a standing bug fixed (proved
 * by running this story against the old scope, which fails it).
 */
export const PageLevelRule: Story = {
	play: async ({ step }) => {
		const twin: Issue = {
			rule: "landmark-unique",
			elements: ".probe-nav",
			base: "nav, [role=navigation]",
		};
		await step("a navigation named like the one after it is violated", async () => {
			const remove = landmarks("Pages");
			try {
				await expect(await judgeIssue(twin)).toBe("violated");
			} finally {
				remove();
			}
		});
		await step("named apart, it is fixed", async () => {
			const remove = landmarks("Categories");
			try {
				await expect(await judgeIssue(twin)).toBe("fixed");
			} finally {
				remove();
			}
		});
	},
};

/**
 * A selector list splits on its top level commas only, so a base or an
 * element list holding `:not(a, b)` or `:is(...)` stays whole, and the
 * scoped selector axe is given parses and lifts the rule off the element.
 */
export const CommasInsideSelectors: Story = {
	play: async ({ step }) => {
		await step(
			"a comma inside parentheses, brackets, or quotes stays in its selector",
			async () => {
				await expect(
					selectorList("[role='img']:not(img, area), .a:is(.b, .c) > p, [data-x='1,2'], li"),
				).toEqual(["[role='img']:not(img, area)", ".a:is(.b, .c) > p", "[data-x='1,2']", "li"]);
			},
		);
		await step(
			"the scoped selector parses, and the rule skips only the listed element",
			async () => {
				const base = "*:not(select, textarea)";
				const selector = scopedSelector(base, [".probe-words:not(.kept, .other)"]);
				await expect(() => document.querySelectorAll(selector)).not.toThrow();
				const lifted = probe("#999999");
				const kept = probe("#999999");
				document.querySelectorAll(".probe-words")[1]?.classList.add("kept");
				const axe = (await import("axe-core")).default;
				try {
					axe.configure({ rules: [{ id: "color-contrast", selector }] });
					const result = await axe.run(
						{ include: [document.getElementById("probe-host") as Element] },
						{ runOnly: { type: "rule", values: ["color-contrast"] }, elementRef: true },
					);
					const failing = result.violations.flatMap((violation) =>
						violation.nodes.map((node) => (node as { element?: Element }).element),
					);
					// The first probe matches the list and is skipped; the second wears
					// `.kept`, so `:not(.kept, .other)` leaves it judged, and it fails.
					await expect(failing).toHaveLength(1);
					await expect(failing[0]?.classList.contains("kept")).toBe(true);
				} finally {
					axe.reset();
					lifted();
					kept();
				}
			},
		);
	},
};

/**
 * Two markers lifting one rule off one element cannot be judged apart, so
 * they are judged together: one verdict for the set, and a stale message
 * naming every id in it and asking for a merge.
 */
export const IndistinctMarkers: Story = {
	play: async ({ step }) => {
		const shared = {
			"probe-one": { rule: "color-contrast", elements: ".probe-words" },
			"probe-two": { rule: "color-contrast", elements: ".probe-words, .probe-caption" },
			"probe-three": { rule: "link-in-text-block", elements: ".probe-words" },
		} satisfies Record<string, Issue>;
		await step(
			"ids sharing a rule and an element form one set; another rule stands apart",
			async () => {
				await expect(judgedTogether(["probe-one", "probe-two", "probe-three"], shared)).toEqual([
					["probe-one", "probe-two"],
					["probe-three"],
				]);
			},
		);
		const carrying = (ids: string[]) => ({
			...story({ knownIssueIds: ids }),
			issues: shared,
		});
		await step("while the element fails, the set stays green", async () => {
			const remove = probe("#999999");
			try {
				await judgeStoryMarkers(carrying(["probe-one", "probe-two"]));
			} finally {
				remove();
			}
		});
		await step("once it passes, one message names the whole set and asks for a merge", async () => {
			const remove = probe("#151515");
			try {
				await expect(judgeStoryMarkers(carrying(["probe-one", "probe-two"]))).rejects.toThrow(
					/Known issues "probe-one", "probe-two" no longer reproduce .* judged together .* merge/,
				);
			} finally {
				remove();
				judgeFileMarkers();
			}
		});
	},
};
