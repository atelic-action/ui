import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Eyebrow, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A section label between cards: small mono capitals in the faint ink, or,
 * strong, larger and bold in the ink, so it reads as a heading on a phone.
 * An aside (a count, a legend) can sit at the right of the same line.
 */
const meta = {
	title: "Email/Eyebrow",
	component: Eyebrow,
	decorators: [inColumn],
	args: { text: "Wholesale" },
	render: (args) => (
		<>
			<Eyebrow {...args} />
			<Card>
				<Row last>Eleven cafes on a standing order this week.</Row>
			</Card>
		</>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The faint eyebrow, over its card. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const label = canvas.getByText("Wholesale");
		await expect(label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			canvas.getByText(/Eleven cafes/).getBoundingClientRect().top,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** Strong: larger, bold, in the ink, readable as a heading. */
export const Strong: Story = {
	args: { strong: true },
	play: async ({ canvas, canvasElement }) => {
		await expect(Number.parseFloat(getComputedStyle(canvas.getByText("Wholesale")).fontSize)).toBe(
			15,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** An aside on the right of the same line, bottom aligned to the text. */
export const WithAside: Story = {
	args: { aside: <span>13 cafes</span> },
	play: async ({ canvas, canvasElement }) => {
		const label = canvas.getByText("Wholesale").getBoundingClientRect();
		const aside = canvas.getByText("13 cafes").getBoundingClientRect();
		await expect(aside.left).toBeGreaterThan(label.right);
		await expect(Math.abs(aside.bottom - label.bottom)).toBeLessThan(4);
		await fitsTheColumn(canvasElement);
	},
};

/** A long label with an aside on a phone wraps rather than widening the column. */
export const LongWithAsidePhone: Story = {
	args: { text: "Wholesale accounts that asked about Saturdays", aside: <span>13 cafes</span> },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
