import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ClosingBar, Copyright } from "../../src/chrome";

/** The line that closes every page: two sides, each taking anything. */
const meta = {
	title: "Chrome/ClosingBar",
	component: ClosingBar,
	args: { name: "Kestrel Hollow Bakehouse" },
} satisfies Meta<typeof ClosingBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default sides: the copyright with the name, and the practice's credit. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/© \d{4} Kestrel Hollow Bakehouse/)).toBeVisible();
		const credit = canvas.getByRole("link", { name: "Atelic" });
		await expect(credit).toHaveAttribute("href", "https://atelic.me");
		await expect(credit).toHaveAttribute("target", "_blank");
	},
};

/** With nothing on the left, the credit sits alone, centered. */
export const CreditAlone: Story = {
	args: { name: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/©/)).toBeNull();
		const credit = canvas.getByText(/Made with/);
		const { left, right } = credit.getBoundingClientRect();
		const middle = (left + right) / 2;
		await expect(Math.abs(middle - window.innerWidth / 2)).toBeLessThan(2);
	},
};

/** `null` empties a side: the copyright alone. */
export const CopyrightAlone: Story = {
	args: { right: null },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link", { name: "Atelic" })).toBeNull();
	},
};

/** Each side takes anything: an attribution on the left and a site's own note on the right. */
export const CustomSides: Story = {
	args: {
		left: <Copyright name="Kestrel Hollow Bakehouse" attribution="A family bakery" />,
		right: "Baked in Fairhaven since 2014",
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Baked in Fairhaven since 2014")).toBeVisible();
	},
};

/** Both sides empty renders nothing at all. */
export const Empty: Story = {
	args: { name: undefined, right: null },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.textContent).toBe("");
	},
};
