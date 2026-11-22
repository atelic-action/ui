import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, EmptyRow, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** A card: paper on a hairline with rounded corners, holding rows. */
const meta = {
	title: "Email/Card",
	component: Card,
	decorators: [inColumn],
	args: {
		children: (
			<>
				<Row last={false}>Eleven cafes took the morning bake.</Row>
				<Row last>Two asked about Saturdays.</Row>
			</>
		),
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two rows stacked in the card, the column's full width. */
export const TwoRows: Story = {
	play: async ({ canvas, canvasElement }) => {
		const first = canvas.getByText("Eleven cafes took the morning bake.").getBoundingClientRect();
		const second = canvas.getByText("Two asked about Saturdays.").getBoundingClientRect();
		await expect(second.top).toBeGreaterThanOrEqual(first.bottom);
		await fitsTheColumn(canvasElement);
	},
};

/** A card with nothing to say: one empty row. */
export const Empty: Story = {
	args: { children: <EmptyRow text="No new wholesale accounts this week." /> },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("No new wholesale accounts this week.")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** On a phone the card takes the screen's width. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
