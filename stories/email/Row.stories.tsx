import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Row } from "../../src/email";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** A card row holding any block, with the card's padding and a hairline under all but the last. */
const meta = {
	title: "Email/Row",
	component: Row,
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { last: true, children: "Thirteen orders out by 07:30, the earliest drop yet this month." },
	globals: pin("desktop"),
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The last row closes the card clean. */
export const Last: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText(/Thirteen orders out/)).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** A row and the last row: the first carries the hairline between them. */
export const WithAHairline: Story = {
	render: (args) => (
		<>
			<Row last={false}>Larkspur Coffee Bar asked about Saturdays.</Row>
			<Row {...args} />
		</>
	),
	play: async ({ canvas }) => {
		const first = canvas.getByText(/Larkspur Coffee Bar/);
		await expect(getComputedStyle(first).borderBottomWidth).toBe("1px");
		await expect(getComputedStyle(canvas.getByText(/Thirteen orders out/)).borderBottomWidth).toBe(
			"0px",
		);
	},
};

/**
 * A long unbroken address in a row on a phone should wrap inside the card.
 * A row sets no `overflow-wrap`, so the address holds its cell open and the
 * email runs wider than the phone.
 */
export const LongWordPhone: Story = {
	tags: ["known-issue"],
	args: {
		children:
			"The ledger export lives at https://example.test/bakehouse/ledgers/2026-W47/wholesale-accounts-export.csv",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await knownBug("email-long-word-widens", async () => {
			await fitsTheColumn(canvasElement);
		});
	},
};
