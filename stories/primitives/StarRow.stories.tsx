import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StarRow } from "../../src/primitives";

/**
 * A row of filled stars, read as one picture named by the rating as given:
 * "4.5 out of 5 stars". It draws to the nearest half star.
 */
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

/** The stars a row draws, whole and half, read off their glyphs. */
const drawn = (canvasElement: HTMLElement) => ({
	whole: canvasElement.querySelectorAll(".lucide-star").length,
	half: canvasElement.querySelectorAll(".lucide-star-half").length,
});

/** A fraction is said as given, to one decimal, and drawn to the nearest half: 4.2 draws four. */
export const RoundsDown: Story = {
	args: { rating: 4.2 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.2 out of 5 stars" })).toBeVisible();
		await expect(drawn(canvasElement)).toEqual({ whole: 4, half: 0 });
	},
};

/** A half rating is said and drawn as itself: four stars and a half, never five. */
export const HalfStar: Story = {
	args: { rating: 4.5 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.5 out of 5 stars" })).toBeVisible();
		await expect(drawn(canvasElement)).toEqual({ whole: 4, half: 1 });
	},
};

/** Near a half, it draws the half: 4.3 draws four and a half, said as 4.3. */
export const NearAHalf: Story = {
	args: { rating: 4.3 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.3 out of 5 stars" })).toBeVisible();
		await expect(drawn(canvasElement)).toEqual({ whole: 4, half: 1 });
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
