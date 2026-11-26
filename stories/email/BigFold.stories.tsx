import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { BigFold, Card, FoldRow, Item } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Folds a whole card's rows behind a summary in an email, when a card would
 * otherwise run long. A card level disclosure: a bold summary with an optional
 * faint count beside it, opening on the rows it holds.
 */
const meta = {
	title: "Email/BigFold",
	component: BigFold,
	decorators: [
		(Story) => (
			<Card>
				<FoldRow last>
					<Story />
				</FoldRow>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		summary: "Quiet accounts",
		count: "3",
		children: (
			<table role="presentation" width="100%">
				<tbody>
					<Item
						name="Fairhaven Grocery Cooperative"
						right="9d"
						subparts={["Trial", "Wed and Fri"]}
						last
					/>
				</tbody>
			</table>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof BigFold>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The summary and its count on one line; a press opens the rows. */
export const WithCount: Story = {
	play: async ({ canvas, canvasElement }) => {
		const summary = canvas.getByText(/Quiet accounts/);
		await expect(summary).toHaveTextContent("+ Quiet accounts 3");
		await expect(canvas.getByText("Fairhaven Grocery Cooperative")).not.toBeVisible();
		await userEvent.click(summary);
		await expect(canvas.getByText("Fairhaven Grocery Cooperative")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** An empty count drops, and nothing trails the summary. */
export const NoCount: Story = {
	args: { count: "" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Quiet accounts/)).toHaveTextContent(/^\+ Quiet accounts$/);
	},
};

/** A zero is a count, and shows. */
export const ZeroCount: Story = {
	args: { count: 0 },
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Quiet accounts/)).toHaveTextContent("+ Quiet accounts 0");
	},
};

/** Opened on a phone, the rows fit the card. */
export const OpenPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await userEvent.click(canvas.getByText(/Quiet accounts/));
		await fitsTheColumn(canvasElement);
	},
};
