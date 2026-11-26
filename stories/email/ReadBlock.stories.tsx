import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, ReadBlock, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Puts the written read of a section at the top of that section's card in an
 * email. A model written read at the top of a section card, under a "The Read"
 * eyebrow in the accent's ink.
 */
const meta = {
	title: "Email/ReadBlock",
	component: ReadBlock,
	decorators: [
		(Story) => (
			<Card>
				<Story />
				<Row last>Eleven cafes on a standing order.</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		text: "A steady week: every standing order went out on time, and the one new trial is the first grocer.",
		divider: true,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ReadBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The eyebrow over the read, a hairline before the card's rows. */
export const WithDivider: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("The Read")).toBeVisible();
		const block = canvas.getByText("The Read").closest("td") as HTMLElement;
		await expect(getComputedStyle(block).borderBottomWidth).toBe("1px");
		await fitsTheColumn(canvasElement);
	},
};

/** No hairline, when the read is the card's only block. */
export const NoDivider: Story = {
	args: { divider: false },
	play: async ({ canvas }) => {
		const block = canvas.getByText("The Read").closest("td") as HTMLElement;
		await expect(getComputedStyle(block).borderBottomWidth).toBe("0px");
	},
};

/** A long read on a phone wraps. */
export const LongPhone: Story = {
	args: {
		text: "A steady week: every standing order went out on time, the harbor van ran forty minutes late on Saturday when the market moved its hours, and the one new trial is the first grocer to take the morning bake, which may change how the north loop is drawn.",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
