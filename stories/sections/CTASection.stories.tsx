import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CTASection } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Closes a page with the site's primary action, the last section on every
 * page. The closing call to action every page ends on: the site's primary
 * action, and a page's own secondary beside it.
 */
const meta = {
	title: "Sections/CTASection",
	component: CTASection,
	args: {
		site,
		eyebrow: "Saturday mornings",
		title: "Skip the line, order ahead",
		lead: "Order by Friday noon and the loaf waits for you at the counter.",
		secondary: { label: "See the menu", href: "/menu" },
	},
	globals: pin("desktop"),
} satisfies Meta<typeof CTASection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The site's action first, the page's ghost second, on one line in the middle. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const primary = canvas.getByRole("link", { name: /Order ahead/ });
		const secondary = canvas.getByRole("link", { name: "See the menu" });
		await expect(primary).toHaveAttribute("href", "/order");
		await expect(primary).not.toHaveAttribute("target");
		await expect(Math.round(primary.getBoundingClientRect().top)).toBe(
			Math.round(secondary.getBoundingClientRect().top),
		);
		await expect(secondary.getBoundingClientRect().left).toBeGreaterThan(
			primary.getBoundingClientRect().right,
		);
		await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Skip the line, order ahead",
		);
	},
};

/** On the page's own surface, after a band on the alternate one. */
export const DefaultSurface: Story = { args: { surface: "default" } };

/** A page overrides the action, and an external one opens in a new tab. */
export const OverriddenPrimary: Story = {
	args: {
		primary: { label: "Book a tasting", href: "https://book.example.com/tasting", newTab: true },
	},
	play: async ({ canvas }) => {
		const primary = canvas.getByRole("link", { name: /Book a tasting/ });
		await expect(primary).toHaveAttribute("target", "_blank");
		await expect(canvas.queryByRole("link", { name: /Order ahead/ })).toBeNull();
	},
};

/** The site's own action marked external opens in a new tab too. */
export const ExternalSiteAction: Story = {
	args: {
		site: { cta: { label: "Order ahead", href: "https://order.example.com", external: true } },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: /Order ahead/ })).toHaveAttribute(
			"target",
			"_blank",
		);
	},
};

/** A tel action never opens a new tab, whatever it asks for. */
export const PhoneAction: Story = {
	args: { secondary: { label: "Call (555) 555-0142", href: "tel:+15555550142", newTab: true } },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).not.toHaveAttribute(
			"target",
		);
	},
};

/** Only the headline and the site's action. */
export const Minimal: Story = {
	args: { eyebrow: undefined, lead: undefined, secondary: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("link")).toHaveLength(1);
	},
};

/** On a phone the two actions stack or wrap, inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		title: "Skip the Saturday line and order your loaf, buns, and cake ahead",
		lead: "Order by Friday noon and the loaf waits for you at the counter, paid at pickup.",
		secondary: { label: "See this week's whole menu", href: "/menu" },
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
