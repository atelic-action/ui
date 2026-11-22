import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Lead } from "../../src/primitives";
import { longURL } from "../fixtures/primitives";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll } from "./support";

/** The larger intro paragraph under a heading. */
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
 * A lead carrying a long unbroken address, on a phone. It should wrap inside the screen; the unbroken word runs
 * past it and the page scrolls sideways (stories/findings/primitives.md,
 * `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: { children: `The full autumn list lives at ${longURL}, updated every Thursday.` },
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
