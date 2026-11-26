import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Scoreboard, TargetRow } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** The color a count is drawn in. */
function colorOf(element: HTMLElement) {
	return getComputedStyle(element).color;
}

const INK = "rgb(21, 21, 21)";
/** The accent's ink, `#B8300B`: the bright accent fails as small words. */
const ACCENT_INK = "rgb(184, 48, 11)";

/**
 * Shows one target in an email's scoreboard: its label, count, bar, and note.
 * One target: its label, the count over the target (in the accent's ink when
 * short), the bar, and a faint note. The bar is decoration beside the count
 * that says it.
 */
const meta = {
	title: "Email/TargetRow",
	component: TargetRow,
	decorators: [
		(Story) => (
			<Card>
				<Scoreboard>
					<Story />
				</Scoreboard>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { text: "Cafe visits", logged: 3, target: 5, note: "two booked", last: true },
	globals: pin("desktop"),
} satisfies Meta<typeof TargetRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Short of the target: the count in the accent's ink, and the bar silent beside it. */
export const Short: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(colorOf(canvas.getByText("3 / 5"))).toBe(ACCENT_INK);
		await expect(canvas.queryByRole("img")).toBeNull();
		await fitsTheColumn(canvasElement);
	},
};

/** On target: the count in the ink. */
export const Met: Story = {
	args: { logged: 5 },
	play: async ({ canvas }) => {
		await expect(colorOf(canvas.getByText("5 / 5"))).toBe(INK);
	},
};

/** A count with nothing to measure it against: no target, no bar, the ink. */
export const NoTarget: Story = {
	args: { logged: 11, target: null, note: "no target" },
	play: async ({ canvas }) => {
		const count = canvas.getByText("11");
		await expect(colorOf(count)).toBe(INK);
		await expect((count.nextElementSibling as HTMLElement).querySelector("table")).toBeNull();
	},
};

/** A zero target draws no bar and cannot be short. */
export const ZeroTarget: Story = {
	args: { logged: 0, target: 0, note: "" },
	play: async ({ canvas }) => {
		await expect(colorOf(canvas.getByText("0 / 0"))).toBe(INK);
	},
};

/** A long label and note on a phone wrap inside the card. */
export const LongPhone: Story = {
	args: {
		text: "Wholesale tastings at new cafes",
		logged: 1,
		target: 4,
		note: "Larkspur's moved to the week after next",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
