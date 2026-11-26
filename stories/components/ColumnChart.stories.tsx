import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ColumnChart } from "../../src/components";
import { columnGroups, columnLegend } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Compares one figure across periods in labeled groups, when a trend over time
 * matters more than the parts of a whole; see `StackedBar`. A column chart: a
 * bar a period, the periods in groups that each carry a label and a total. The
 * plot is one picture whose name carries every figure.
 */
const meta = {
	title: "Components/ColumnChart",
	component: ColumnChart,
	decorators: [inWrap],
	args: { groups: columnGroups, legend: columnLegend },
	globals: pin("desktop"),
} satisfies Meta<typeof ColumnChart>;

export default meta;
type Story = StoryObj<typeof meta>;

const plot = (canvas: { getByRole: (role: string) => HTMLElement }) => canvas.getByRole("img");

/** Two quarters a year apart: the picture's name reads every group, total, and month. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(plot(canvas)).toHaveAccessibleName(
			"2025 Q3, 3,210: Jul 1,040, Aug 1,120, Sep 1,050; 2026 Q3, 3,948: Jul 1,210, Aug 1,420, Sep 1,318",
		);
		await expect(canvas.getByText("This quarter")).toBeVisible();
	},
};

/** The tallest bar draws at `height`, the rest in proportion. */
export const Height: Story = {
	args: { height: 200 },
	play: async ({ canvasElement }) => {
		const bars = Array.from(canvasElement.querySelectorAll("[style*='height']")) as HTMLElement[];
		const tallest = Math.max(...bars.map((bar) => bar.getBoundingClientRect().height));
		await expect(Math.round(tallest)).toBe(200);
	},
};

/** One group with no label: a plain chart, and a name of months alone. */
export const SingleGroup: Story = {
	args: {
		legend: undefined,
		groups: [{ bars: columnGroups[1]?.bars ?? [] }],
	},
	play: async ({ canvas }) => {
		await expect(plot(canvas)).toHaveAccessibleName("Jul 1,210, Aug 1,420, Sep 1,318");
	},
};

/** A year of months, no legend. */
export const TwelveMonths: Story = {
	args: {
		legend: undefined,
		groups: [
			{
				label: "2026",
				tone: "info",
				bars: [
					"Jan",
					"Feb",
					"Mar",
					"Apr",
					"May",
					"Jun",
					"Jul",
					"Aug",
					"Sep",
					"Oct",
					"Nov",
					"Dec",
				].map((label, i) => ({ label, value: 800 + ((i * 137) % 700) })),
			},
		],
	},
};

/**
 * One bar marked in its own tone, keyed in the legend as the month the order
 * form was down. The legend's words for that tone reach the picture's name
 * beside the bar's figure, so the marked month is never told by color alone.
 */
export const MarkedBar: Story = {
	args: {
		legend: [
			{ label: "A month the form worked", tone: "good" },
			{ label: "The month the order form was down", tone: "bad" },
		],
		groups: [
			{
				label: "2026 Q3",
				tone: "good",
				bars: [
					{ label: "Jul", value: 1210 },
					{ label: "Aug", value: 640, tone: "bad" },
					{ label: "Sep", value: 1318 },
				],
			},
		],
	},
	play: async ({ canvas }) => {
		await expect(plot(canvas)).toHaveAccessibleName(/order form was down/);
	},
};

/**
 * No bars at all: nothing is thrown, and the chart says so, shown and
 * spoken, by `emptyLabel` ("No data to show").
 */
export const Empty: Story = {
	args: { legend: undefined, groups: [] },
	play: async ({ canvas }) => {
		await expect(plot(canvas)).toHaveAccessibleName("No data to show");
		await expect(canvas.getByText("No data to show")).toBeVisible();
	},
};

/** The empty state in the page's own words. */
export const EmptyLabel: Story = {
	args: { legend: undefined, groups: [], emptyLabel: "No visits recorded yet" },
	play: async ({ canvas }) => {
		await expect(plot(canvas)).toHaveAccessibleName("No visits recorded yet");
		await expect(canvas.getByText("No visits recorded yet")).toBeVisible();
	},
};

/** Two quarters of months on a phone stay inside the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/** The widest a chart gets, two years of months, on a phone. */
export const WidestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		legend: undefined,
		groups: ["2025", "2026"].map((year) => ({
			label: year,
			total: "14,200",
			bars: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((label, i) => ({
				label,
				value: 1000 + i * 31,
				display: `${(1 + i * 0.031).toFixed(1)}k`,
			})),
		})),
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
