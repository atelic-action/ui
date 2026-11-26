import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Credit } from "../../src/chrome";

/**
 * Credits the practice that built the site, as the closing bar's default right
 * side. The practice's credit, the closing bar's default right side: the
 * practice in one link.
 */
const meta = {
	title: "Chrome/Credit",
	component: Credit,
	parameters: { layout: "padded" },
} satisfies Meta<typeof Credit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Made with/)).toBeVisible();
		const link = canvas.getByRole("link", { name: "Atelic" });
		await expect(link).toHaveAttribute("href", "https://atelic.me");
		await expect(link).toHaveAttribute("target", "_blank");
		await expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
	},
};
