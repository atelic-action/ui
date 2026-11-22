import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, GroupRow, Scoreboard, TargetRow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * The card row a scoreboard's groups and targets sit in: a four column
 * table of label, count, bar, and note. Its group names and a short count
 * wear the accent's ink.
 */
const meta = {
	title: "Email/Scoreboard",
	component: Scoreboard,
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		children: (
			<>
				<GroupRow text="Outreach" first />
				<TargetRow text="Cafe visits" logged={3} target={5} note="two booked" last={false} />
				<TargetRow text="Tastings" logged={2} target={2} note="" last={false} />
				<TargetRow text="Samples left" logged={11} target={null} note="no target" last />
				<GroupRow text="Kitchen" first={false} />
				<TargetRow text="Recipe tests" logged={0} target={3} note="oven down Tue" last />
			</>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Scoreboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two groups of targets, each row's four parts on one line. */
export const TwoGroups: Story = {
	play: async ({ canvas, canvasElement }) => {
		const label = canvas.getByText("Cafe visits").getBoundingClientRect();
		const count = canvas.getByText("3 / 5").getBoundingClientRect();
		const note = canvas.getByText("two booked").getBoundingClientRect();
		await expect(count.left).toBeGreaterThanOrEqual(label.right);
		await expect(note.left).toBeGreaterThan(count.right);
		await expect(canvas.getByText("Kitchen").getBoundingClientRect().top).toBeGreaterThanOrEqual(
			canvas.getByText("Samples left").getBoundingClientRect().bottom,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** On a phone the four columns still fit the card. */
export const TwoGroupsPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
