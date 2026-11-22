import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Copyright } from "../../src/chrome";

/** The copyright line: the mark, this year, and the business's name. The closing bar's default left side. */
const meta = {
	title: "Chrome/Copyright",
	component: Copyright,
	parameters: { layout: "padded" },
	args: { name: "Kestrel Hollow Bakehouse" },
} satisfies Meta<typeof Copyright>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		const year = new Date().getFullYear();
		await expect(canvas.getByText(`© ${year} Kestrel Hollow Bakehouse`)).toBeVisible();
	},
};

/** An attribution follows the name after a middle dot. */
export const WithAttribution: Story = {
	args: { attribution: "A family bakery since 2014" },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByText(/Kestrel Hollow Bakehouse · A family bakery since 2014$/),
		).toBeVisible();
	},
};
