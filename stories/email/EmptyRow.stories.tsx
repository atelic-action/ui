import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, EmptyRow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Says in an email that a section has nothing to show, rather than leaving its
 * card blank. The empty state: one line of dim text filling a card row.
 */
const meta = {
	title: "Email/EmptyRow",
	component: EmptyRow,
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { text: "No new wholesale accounts this week." },
	globals: pin("desktop"),
} satisfies Meta<typeof EmptyRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("No new wholesale accounts this week.")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** A long empty line wraps on a phone. */
export const LongPhone: Story = {
	args: {
		text: "No cafe opened, paused, or changed a standing order this week, and no trial ends before the next report.",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
