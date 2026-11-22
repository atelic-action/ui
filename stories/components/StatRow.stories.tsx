import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StatRow } from "../../src/components";
import { longWord, stats } from "../fixtures/primitives";
import { expectNoSidewaysScroll, inWrap } from "../primitives/support";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A row of large figures, each over what it counts and its period, with its
 * comparisons beneath. Arrows and triangles are read aloud as up, down, or
 * unchanged, so a direction is never color alone.
 */
const meta = {
	title: "Components/StatRow",
	component: StatRow,
	decorators: [inWrap],
	args: { stats },
	globals: pin("desktop"),
} satisfies Meta<typeof StatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The quiet words and the good tone's words fail contrast on the surface (stories/findings/primitives.md). */
const quietWords = {
	parameters: { ...knownIssues("muted-text-contrast", "tone-good-text-contrast") },
} satisfies Story;

/** The loud row: a report's headline figures, four across at desktop width. */
export const Loud: Story = {
	tags: ["known-issue"],
	...quietWords,

	play: async ({ canvas }) => {
		const tops = ["3,948", "6", "4.1", "12"].map(
			(figure) => canvas.getByText(figure).getBoundingClientRect().top,
		);
		await expect(new Set(tops).size).toBe(1);
		await expect(canvas.getAllByRole("img", { name: "Up" }).length).toBeGreaterThanOrEqual(2);
		await expect(canvas.getAllByRole("img", { name: "Down" }).length).toBeGreaterThanOrEqual(2);
		await expect(canvas.getByTitle("year over year")).toHaveTextContent("YoY");
	},
};

/** The quiet row: a glance row for a working page, divided by hairlines. */
export const Quiet: Story = {
	tags: ["known-issue"],
	...quietWords,
	args: { variant: "quiet" },
};

/** A figure that is a share: a big 6 and a small /7. */
export const OutOf: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },

	args: { stats: [{ value: "6", outOf: "7", label: "Pages in the index" }] },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Pages in the index")).toBeVisible();
		await expect(canvas.getByText("/7")).toBeVisible();
	},
};

/** The change beside a figure, in each direction; a flat change reads "Unchanged". */
export const Changes: Story = {
	tags: ["known-issue"],
	...quietWords,

	args: {
		stats: [
			{ value: "100", label: "Reviews", change: { direction: "up", text: "+26" } },
			{
				value: "3.2",
				unit: "s",
				label: "Menu paint",
				change: { direction: "down", text: "0.4 s" },
			},
			{ value: "12", label: "Orders", change: { direction: "flat", text: "0" } },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Unchanged" })).toBeVisible();
	},
};

/** One stat, the figure alone over its label. */
export const Single: Story = {
	args: { stats: [{ value: "Since 2014", label: "On Alder Street" }] },
};

/** No stats: an empty row. */
export const Empty: Story = {
	args: { stats: [] },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.textContent?.trim()).toBe("");
	},
};

/** On a phone the loud row is two columns. */
export const Phone: Story = {
	tags: ["known-issue"],
	...quietWords,

	globals: pin("phone"),
	play: async ({ canvas }) => {
		const top = (name: string) => canvas.getByText(name).getBoundingClientRect().top;
		await expect(top("3,948")).toBe(top("6"));
		await expect(top("4.1")).toBeGreaterThan(top("3,948"));
		await expectNoSidewaysScroll();
	},
};

export const QuietOnPhone: Story = {
	tags: ["known-issue"],
	...quietWords,

	globals: pin("phone"),
	args: { variant: "quiet" },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * The longest figures a report carries, a figure in one long word among
 * them, on a phone. The figure is meant to break inside its column; it runs
 * past the screen instead (stories/findings/primitives.md, `stat-figure-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	...quietWords,
	globals: pin("phone"),
	args: {
		stats: [
			...stats,
			{ value: `${longWord}`, label: "The loaf people ask for by name" },
			{
				value: "$12,047",
				label: "Wholesale invoiced across every cafe and grocer on a standing order",
				period: "2026 Q3",
				change: { direction: "up", text: "+$1,904" },
			},
		],
	},
	play: async () => {
		await knownBug("stat-figure-word-overflow", expectNoSidewaysScroll);
	},
};
