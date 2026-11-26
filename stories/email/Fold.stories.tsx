import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { Card, Fold, LeadRow, List, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Tucks a row's extra detail behind a small control in an email, so the row
 * stays short. A small disclosure inside a row ("+ what they do"), a native
 * `details`, so it opens wherever the mail client allows.
 */
const meta = {
	title: "Email/Fold",
	component: Fold,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					Larkspur Coffee Bar
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		summary: "what they order",
		children: "Two trays of morning buns, one country, one rye.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Fold>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed, the summary alone; a press opens it, and a second press closes it. */
export const OpensOnPress: Story = {
	play: async ({ canvas, canvasElement, step }) => {
		const summary = canvas.getByText(/what they order/);
		const body = canvas.getByText("Two trays of morning buns, one country, one rye.");
		await step("closed, the body is hidden", async () => {
			await expect(summary).toHaveTextContent("+ what they order");
			await expect(body).not.toBeVisible();
		});
		await step("a press opens it", async () => {
			await userEvent.click(summary);
			await expect(body).toBeVisible();
		});
		await step("a second press closes it", async () => {
			await userEvent.click(summary);
			await expect(body).not.toBeVisible();
		});
		await fitsTheColumn(canvasElement);
	},
};

/** A list inside a fold, the way a runner lists what moved. */
export const WithAList: Story = {
	args: {
		summary: "three accounts",
		children: (
			<List fontSize="13px">
				<LeadRow lead="Larkspur" rest="added a Saturday tray." />
				<LeadRow lead="Fairhaven" rest="moved to Wednesday and Friday." />
				<LeadRow lead="Alder Street" rest="paused for the refit." />
			</List>
		),
	},
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByText(/three accounts/));
		await expect(canvas.getByText("Larkspur")).toBeVisible();
	},
};

/** Opened on a phone, a long body wraps inside the card. */
export const LongBodyPhone: Story = {
	args: {
		children:
			"Two trays of morning buns, one of country loaves, and one of the seeded rye, except on the first Saturday of the month, when the rye becomes a tray of cardamom knots for their brunch.",
	},
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await userEvent.click(canvas.getByText(/what they order/));
		await fitsTheColumn(canvasElement);
	},
};
