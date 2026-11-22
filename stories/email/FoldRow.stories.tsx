import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { BigFold, Card, FoldRow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** The card row a card level fold sits in, with the card's padding and a hairline under all but the last. */
const meta = {
	title: "Email/FoldRow",
	component: FoldRow,
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
		last: true,
		children: <BigFold summary="Paused accounts">Alder Street Reading Room</BigFold>,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof FoldRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Last: Story = {
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/** Two fold rows: the first carries the hairline. */
export const Stacked: Story = {
	render: (args) => (
		<>
			<FoldRow last={false}>
				<BigFold summary="Quiet accounts">Fairhaven Grocery Cooperative</BigFold>
			</FoldRow>
			<FoldRow {...args} />
		</>
	),
	play: async ({ canvas }) => {
		const first = canvas.getByText(/Quiet accounts/).closest("td") as HTMLElement;
		await expect(getComputedStyle(first).borderBottomWidth).toBe("1px");
	},
};

export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
