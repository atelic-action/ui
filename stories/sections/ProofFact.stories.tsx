import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StarRow } from "../../src/primitives";
import { ProofFact } from "../../src/sections";

/**
 * Shows one short proof fact, its figure over its label, wherever a row of
 * proof is set: `ProofStrip` draws a row of them, and a `Marquee` scrolls
 * them when each is put inside it. The figure may carry a star row.
 */
const meta = {
	title: "Sections/ProofFact",
	component: ProofFact,
	args: {
		value: (
			<>
				4.9 <StarRow rating={5} size={15} />
			</>
		),
		label: "212 reviews",
	},
} satisfies Meta<typeof ProofFact>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The figure with its stars, over the label. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const figure = canvas.getByText("4.9").getBoundingClientRect();
		const label = canvas.getByText("212 reviews").getBoundingClientRect();
		await expect(label.top).toBeGreaterThanOrEqual(figure.bottom - 1);
	},
};

/** A figure of words, with no stars. */
export const Words: Story = {
	args: { value: "Since 2014", label: "On Alder Street" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Since 2014")).toBeVisible();
	},
};
