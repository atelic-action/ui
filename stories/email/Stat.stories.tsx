import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Stat, StatsRow } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A big number over a small caption: one cell of a `StatsRow`. The caption
 * takes the row's faint ink, which fails contrast on the paper, so a story
 * with a caption is marked.
 */
const meta = {
	title: "Email/Stat",
	component: Stat,
	decorators: [
		(Story) => (
			<Card>
				<StatsRow>
					<Story />
				</StatsRow>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { n: 41, caption: "trays" },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The number over its caption. */
export const WithCaption: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	play: async ({ canvas, canvasElement }) => {
		const number = canvas.getByText("41").getBoundingClientRect();
		await expect(canvas.getByText(/trays/).getBoundingClientRect().bottom).toBeGreaterThan(
			number.bottom,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** A number alone, no caption. */
export const NumberOnly: Story = {
	args: { caption: undefined, n: "06:15" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("06:15")).toBeVisible();
	},
};

/** A zero is still a number. */
export const Zero: Story = {
	args: { caption: undefined, n: 0 },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("0")).toBeVisible();
	},
};
