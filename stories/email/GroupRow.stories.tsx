import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, GroupRow, Scoreboard, TargetRow } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A group's name spanning the scoreboard, in the accent's ink over a
 * hairline.
 */
const meta = {
	title: "Email/GroupRow",
	component: GroupRow,
	decorators: [
		(Story) => (
			<Card>
				<Scoreboard>
					<Story />
					<TargetRow text="Cafe visits" logged={3} target={5} note="" last />
				</Scoreboard>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { text: "Outreach", first: true },
} satisfies Meta<typeof GroupRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first group sits flush at the top. */
export const First: Story = {
	play: async ({ canvas, canvasElement }) => {
		const group = canvas.getByText("Outreach");
		await expect(group).toHaveAttribute("colspan", "4");
		await expect(getComputedStyle(group).paddingTop).toBe("0px");
		await fitsTheColumn(canvasElement);
	},
};

/** A later group leaves room above it. */
export const Later: Story = {
	args: { first: false, text: "Kitchen" },
	play: async ({ canvas }) => {
		await expect(getComputedStyle(canvas.getByText("Kitchen")).paddingTop).toBe("18px");
	},
};
