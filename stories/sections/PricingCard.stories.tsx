import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { PricingCard } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * The pricing page's centerpiece: a ribbon, the price, what it buys, the
 * action, and a quiet second link.
 */
const meta = {
	title: "Sections/PricingCard",
	component: PricingCard,
	args: {
		ribbon: "Every cake · every size",
		price: "$48",
		per: "for a round cake that feeds twelve",
		ticks: ["Two days' notice", "Decorated by hand", "Boxed for the drive home"],
		cta: { label: "Order a cake", href: "/cakes/order" },
		secondary: { label: "See tiered cakes", href: "/cakes/tiered" },
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>Cakes to order</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof PricingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every part, top to bottom, the action as wide as the card. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const price = canvas.getByText("$48").getBoundingClientRect();
		const ribbon = canvas.getByText("Every cake · every size").getBoundingClientRect();
		await expect(ribbon.bottom).toBeLessThanOrEqual(price.top + 1);
		await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
		const action = canvas.getByRole("link", { name: /Order a cake/ });
		await expect(action).toHaveAttribute("href", "/cakes/order");
		await expect(action).not.toHaveAttribute("target");
		const secondary = canvas.getByRole("link", { name: /See tiered cakes/ });
		await expect(secondary.getBoundingClientRect().top).toBeGreaterThan(
			action.getBoundingClientRect().bottom,
		);
	},
};

/** An action that books elsewhere opens a new tab. */
export const NewTabAction: Story = {
	args: {
		cta: { label: "Book a tasting", href: "https://book.example.com/tasting", newTab: true },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: /Book a tasting/ })).toHaveAttribute(
			"target",
			"_blank",
		);
	},
};

/** Only the price, the line under it, and the action. */
export const Minimal: Story = {
	args: { ribbon: undefined, ticks: undefined, secondary: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("list")).toBeNull();
		await expect(canvas.getAllByRole("link")).toHaveLength(1);
	},
};

/** An empty tick list draws no list. */
export const EmptyTicks: Story = {
	args: { ticks: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("list")).toBeNull();
	},
};

/** The longest realistic content, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		ribbon: "Every cake · every size · every season",
		price: "$1,280",
		per: "for a three tier wedding cake that feeds a hundred and twenty",
		ticks: [
			"Two weeks' notice, and a tasting on a Saturday morning",
			"Decorated by hand in the back of the shop",
			"Delivered and set up at the venue within twenty miles",
		],
		cta: { label: "Book a wedding tasting", href: "/cakes/wedding" },
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
