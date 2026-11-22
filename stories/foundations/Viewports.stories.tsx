import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { pin } from "../support/viewports";

/**
 * The proof that a pinned viewport is the page's real width in the test run,
 * not a frame drawn around it: media queries, `window.innerWidth`, and a
 * component's own measurements all see the pinned size.
 */
const meta = {
	title: "Foundations/Viewports",
	parameters: { layout: "padded" },
	render: () => <p>The page is as wide as the viewport this story pins.</p>,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone: Story = {
	globals: pin("phone"),
	play: async () => {
		await expect(window.innerWidth).toBe(390);
		await expect(window.innerHeight).toBe(844);
		await expect(window.matchMedia("(max-width: 899px)").matches).toBe(true);
	},
};

export const SmallPhone: Story = {
	globals: pin("smallPhone"),
	play: async () => {
		await expect(window.innerWidth).toBe(320);
		await expect(window.innerHeight).toBe(640);
	},
};

export const Tablet: Story = {
	globals: pin("tablet"),
	play: async () => {
		await expect(window.innerWidth).toBe(820);
	},
};

export const Desktop: Story = {
	globals: pin("desktop"),
	play: async () => {
		await expect(window.innerWidth).toBe(1280);
		await expect(window.matchMedia("(max-width: 899px)").matches).toBe(false);
	},
};

/**
 * A story that pins nothing runs at Storybook's default, 1200 by 900, in the
 * test run. In the browser it is as wide as the window, so it is a test only.
 */
export const Unpinned: Story = {
	tags: ["!dev", "!autodocs"],
	play: async () => {
		await expect(window.innerWidth).toBe(1200);
		await expect(window.innerHeight).toBe(900);
	},
};
