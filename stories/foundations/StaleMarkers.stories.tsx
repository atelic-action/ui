import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { judgeFileMarkers, judgeIssue, judgeStoryMarkers } from "../support/known-issues/stale";
import type { Issue } from "../support/known-issues/types";

/**
 * The proof that a marker cannot outlive its bug (`support/known-issues/stale.ts`).
 * Each step builds a probe on the page, judges it with the same functions
 * the preview runs after every story, and takes the probe away again, so the
 * story's own check sees a clean page. Both directions are shown: a real
 * violation keeps its marker green, and a fixed one turns it red, naming the
 * id; the same for a story marked `todo`, and for a file whose stories never
 * show an id at all.
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
