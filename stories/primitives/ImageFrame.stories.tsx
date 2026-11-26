import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ImageFrame } from "../../src/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Frames an image in the package's rounded shape, or a labeled placeholder
 * until the photograph exists. A rounded media frame, and a labeled
 * placeholder block until the photograph exists.
 */
const meta = {
	title: "Primitives/ImageFrame",
	component: ImageFrame,
	parameters: { layout: "padded" },
	args: {
		src: "/images/bakery-loop-first-frame.jpg",
		alt: "The ovens at dawn, the first trays going in",
		aspectRatio: "4/3",
		maxWidth: "520px",
	},
} satisfies Meta<typeof ImageFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Below the fold by default: the picture loads lazily. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const img = canvas.getByRole("img", { name: "The ovens at dawn, the first trays going in" });
		await expect(img).toHaveAttribute("loading", "lazy");
		await expect(img).not.toHaveAttribute("fetchpriority");
	},
};

/** Above the fold: fetched first, never lazily. */
export const Priority: Story = {
	args: { priority: true },
	play: async ({ canvas }) => {
		const img = canvas.getByRole("img");
		await expect(img).not.toHaveAttribute("loading");
		await expect(img).toHaveAttribute("fetchpriority", "high");
	},
};

/** The frame holds its aspect ratio whatever the file's own shape. */
export const Portrait: Story = {
	args: { aspectRatio: "4/5", maxWidth: "320px" },
	play: async ({ canvas }) => {
		const { width, height } = canvas.getByRole("img").getBoundingClientRect();
		await expect(Math.abs(width / height - 0.8)).toBeLessThan(0.01);
	},
};

/** No `src` yet: the shot brief, as a labeled block. */
export const Placeholder: Story = {
	args: { src: undefined, placeholder: "The counter at opening, from the door" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("The counter at opening, from the door")).toBeVisible();
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** No `src` and no brief: the block says "Image". */
export const PlaceholderUnlabeled: Story = {
	args: { src: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Image")).toBeVisible();
	},
};

/** Decorative: an empty `alt` leaves the picture out of the accessibility tree. */
export const Decorative: Story = {
	args: { alt: undefined },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector("img")).toHaveAttribute("alt", "");
	},
};

/** On a phone a capped frame centers in its column and stays inside the screen. */
export const Phone: Story = {
	globals: pin("phone"),
	args: { maxWidth: "720px" },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
