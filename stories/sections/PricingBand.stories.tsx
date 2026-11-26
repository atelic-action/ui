import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PricingBand } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Presents a price beside its pitch on a brand colored band, for information
 * only; use `PricingCard` for a price a visitor books from. A band on the
 * primary color: the pitch on the left, the price in a card on the right.
 */
const meta = {
	title: "Sections/PricingBand",
	component: PricingBand,
	args: {
		eyebrow: "Wholesale",
		title: "One price a loaf, delivered",
		lead: "Any mix of the daily breads, at the counter before you open.",
		price: "$6",
		unit: "/ loaf, twelve or more",
		detail: { label: "See the price sheet", href: "/wholesale/prices" },
	},
	globals: pin("desktop"),
} satisfies Meta<typeof PricingBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The pitch and the price side by side, the detail link under the price. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 2 }).getBoundingClientRect();
		const price = canvas.getByText("$6").getBoundingClientRect();
		await expect(price.left).toBeGreaterThan(title.right);
		const detail = canvas.getByRole("link", { name: /See the price sheet/ });
		await expect(detail).toHaveAttribute("href", "/wholesale/prices");
		await expect(detail.getBoundingClientRect().top).toBeGreaterThan(price.bottom);
	},
};

/** Only the title and the price. */
export const Minimal: Story = {
	args: { eyebrow: undefined, lead: undefined, detail: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** The tablet sits below the band's step, so the price card stacks under the pitch. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 2 }).getBoundingClientRect();
		await expect(canvas.getByText("$6").getBoundingClientRect().top).toBeGreaterThan(title.bottom);
	},
};

/** The longest realistic copy and price, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		eyebrow: "Wholesale for cafes and grocers",
		title: "One price a loaf, delivered before the doors open, any mix of the daily breads",
		lead: "Twelve loaves or more a delivery, any mix of sourdough, rye, and baguettes, at the counter by six.",
		price: "$1,240",
		unit: "/ month, the standing order",
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
