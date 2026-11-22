import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StarRow } from "../../src/primitives";

/** A row of filled stars, read as one picture: "4 out of 5 stars". */
const meta = {
	title: "Primitives/StarRow",
	component: StarRow,
	parameters: { layout: "padded" },
	args: { rating: 5 },
} satisfies Meta<typeof StarRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five stars, one image named by the count, the glyphs hidden. */
export const Five: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "5 out of 5 stars" })).toBeVisible();
		await expect(canvasElement.querySelectorAll("svg")).toHaveLength(5);
	},
};

export const Three: Story = {
	args: { rating: 3 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "3 out of 5 stars" })).toBeVisible();
	},
};

/** A fraction rounds: 4.4 draws four. */
export const RoundsDown: Story = {
	args: { rating: 4.4 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "4 out of 5 stars" })).toBeVisible();
	},
};

/** A half rounds up: 4.5 draws and reads as five. */
export const HalfRoundsUp: Story = {
	args: { rating: 4.5 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "5 out of 5 stars" })).toBeVisible();
	},
};

/** Out of range clamps into 1 to 5: zero still draws one star. */
export const ClampsLow: Story = {
	args: { rating: 0 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "1 out of 5 stars" })).toBeVisible();
	},
};

export const ClampsHigh: Story = {
	args: { rating: 9 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "5 out of 5 stars" })).toBeVisible();
	},
};

/** A larger glyph, beside an aggregate score. */
export const Large: Story = {
	args: { size: 28 },
	play: async ({ canvasElement }) => {
		const star = canvasElement.querySelector("svg") as SVGElement;
		await expect(star.getBoundingClientRect().width).toBe(28);
	},
};
