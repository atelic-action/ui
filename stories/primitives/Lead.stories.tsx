import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Lead } from "../../src/primitives";
import { longURL } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Sets the larger intro paragraph under a heading. The larger intro paragraph
 * under a heading.
 */
const meta = {
	title: "Primitives/Lead",
	component: Lead,
	parameters: { layout: "padded" },
	args: {
		children:
			"Country sourdough, seeded rye, and the morning buns, baked in the back of the shop every day but Monday.",
	},
} satisfies Meta<typeof Lead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Country sourdough/).tagName).toBe("P");
	},
};

/**
 * A lead carrying a long unbroken address, on a phone: it wraps inside the
 * screen, the address breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: { children: `The full autumn list lives at ${longURL}, updated every Thursday.` },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
