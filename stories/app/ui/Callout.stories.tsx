import type { Meta, StoryObj } from "@storybook/react-vite";
import { Lightbulb } from "lucide-react";
import { expect } from "storybook/test";
import { Callout } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

/** A quiet boxed aside with an optional icon: a tip, a hint, a reminder. */
const meta = {
	title: "App/UI/Callout",
	component: Callout,
	parameters: { layout: "padded" },
	args: {
		icon: <Lightbulb className="h-4 w-4" aria-hidden="true" />,
		children: "Scale a recipe by trays, not by loaves: the oven fits whole trays.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Scale a recipe by trays/)).toBeVisible();
	},
};

export const NoIcon: Story = { args: { icon: undefined } };

/** The longest realistic aside wraps beside its icon on a phone. */
export const LongContentPhone: Story = {
	globals: pin("phone"),
	args: {
		children:
			"A standing order changes from the next drop after 20:00, so a change made at 21:00 on a Tuesday reaches Thursday's van, not Wednesday's, and the cafe is billed for Wednesday as it stood.",
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
