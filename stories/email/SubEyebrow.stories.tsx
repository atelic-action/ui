import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Row, SubEyebrow } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/** Labels a block inside an email's card. A faint eyebrow inside a card, over a block. */
const meta = {
	title: "Email/SubEyebrow",
	component: SubEyebrow,
	decorators: [
		(Story) => (
			<Card>
				<Story />
				<Row last>Larkspur, Wicket Lane, Fairhaven.</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { text: "This week's drops" },
} satisfies Meta<typeof SubEyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Over its block, in capitals. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const eyebrow = canvas.getByText("This week's drops");
		await expect(getComputedStyle(eyebrow).textTransform).toBe("uppercase");
		await expect(eyebrow.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			canvas.getByText(/Larkspur, Wicket Lane/).getBoundingClientRect().top + 1,
		);
		await fitsTheColumn(canvasElement);
	},
};
