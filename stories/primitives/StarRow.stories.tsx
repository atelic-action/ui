import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StarRow } from "../../src/primitives";

/**
 * Shows a rating as a row of five stars filled to the rating; use
 * `StarRating` when the reader can set it. One picture named by the rating
 * as given, "4.8 out of 5 stars", and drawn as given: a 4.8 fills four stars
 * and eight tenths of the fifth.
 */
const meta = {
	title: "Primitives/StarRow",
	component: StarRow,
	parameters: { layout: "padded" },
	args: { rating: 5 },
} satisfies Meta<typeof StarRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The stars the row fills, read off where the filled row is cut: 15px stars, 2px apart. */
function filled(canvasElement: HTMLElement): number {
	const cut = /inset\(0(?:px)? ([\d.]+)px/.exec(
		(canvasElement.querySelector(".star-row-fill") as HTMLElement).style.clipPath,
	);
	const reach = 83 - Number(cut?.[1] ?? 0);
	const whole = Math.floor((reach + 0.01) / 17);
	return whole + Math.min(reach - whole * 17, 15) / 15;
}

/** Five stars, one image named by the count, the glyphs hidden. */
export const Five: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "5 out of 5 stars" })).toBeVisible();
		await expect(canvasElement.querySelectorAll(".star-row-fill svg")).toHaveLength(5);
		await expect(filled(canvasElement)).toBeCloseTo(5, 1);
	},
};

export const Three: Story = {
	args: { rating: 3 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "3 out of 5 stars" })).toBeVisible();
	},
};

/** A rating just over a whole star barely begins the next one: 4.2 is never drawn as four and a half. */
export const JustOver: Story = {
	args: { rating: 4.2 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.2 out of 5 stars" })).toBeVisible();
		await expect(filled(canvasElement)).toBeGreaterThan(4);
		await expect(filled(canvasElement)).toBeLessThan(4.4);
	},
};

/** A half rating is said and drawn as itself: four stars and half of the fifth. */
export const HalfStar: Story = {
	args: { rating: 4.5 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.5 out of 5 stars" })).toBeVisible();
		await expect(filled(canvasElement)).toBeCloseTo(4.5, 1);
	},
};

/** A rating near the top is never rounded up to it: 4.8 leaves the fifth star short of full. */
export const NearlyFive: Story = {
	args: { rating: 4.8 },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("img", { name: "4.8 out of 5 stars" })).toBeVisible();
		await expect(filled(canvasElement)).toBeGreaterThan(4.6);
		await expect(filled(canvasElement)).toBeLessThan(4.9);
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
