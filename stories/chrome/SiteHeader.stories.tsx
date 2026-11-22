import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { SiteHeader } from "../../src/chrome";
import { brand, contact, cta, flatLinks, groupedLinks, phones } from "../fixtures/bakery";
import { knownBug, knownIssues } from "../support/known-issues";
import { PageBehind, type PageBehindProps } from "../support/page";
import { pin } from "../support/viewports";

/**
 * The fixed bar every page wears. Written against the mega menu as it is on
 * main at 8.0.0 (columns, a feature card, an all link); the panel kinds,
 * nested links, and badges join these stories when that change lands.
 */
const meta = {
	title: "Chrome/SiteHeader",
	component: SiteHeader,
	tags: ["known-issue"],
	parameters: { ...knownIssues("white-on-primary", "primary-text-contrast") },
	args: { brand, links: flatLinks, primaryCTA: cta, contact, currentPath: "/menu" },
	// The page under the bar; a story sets `parameters.page` for a hero or a long page.
	decorators: [
		(Story, { parameters }) => (
			<>
				<Story />
				<PageBehind {...(parameters.page as PageBehindProps | undefined)} />
			</>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The bar's own nav, by its accessible name. */
const primaryNav = (canvas: ReturnType<typeof within>) =>
	canvas.getByRole("navigation", { name: "Primary" });

export const FlatNav: Story = {
	tags: ["known-issue"],
	play: async ({ canvas }) => {
		const nav = within(primaryNav(canvas));
		await expect(nav.getAllByRole("link")).toHaveLength(4);
		await expect(nav.getByRole("link", { name: "Menu" })).toHaveAttribute("aria-current", "page");
		await expect(nav.getByRole("link", { name: "Cakes" })).not.toHaveAttribute("aria-current");
		// A group holding the current page turns primary; a flat link on it shows nothing.
		await knownBug("flat-current-link-unmarked", async () => {
			const color = (name: string) => getComputedStyle(nav.getByRole("link", { name })).color;
			await expect(color("Menu")).not.toBe(color("Cakes"));
		});
		await expect(canvas.getByRole("link", { name: "Order ahead" })).toBeVisible();
		// The burger steps aside on a desktop.
		await expect(canvas.queryByRole("button", { name: "Open menu" })).toBeNull();
	},
};

/** On a phone the links and the CTA give way to the burger, which opens the menu. */
export const FlatNavPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.queryByRole("navigation", { name: "Primary" })).toBeNull();
		const burger = canvas.getByRole("button", { name: "Open menu" });
		await expect(burger).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(burger);
		const menu = canvas.getByRole("dialog", { name: "Menu" });
		await expect(menu).toBeVisible();
		await expect(burger).toHaveAttribute("aria-expanded", "true");
		await userEvent.click(within(menu).getByRole("button", { name: "Close menu" }));
		await expect(canvas.queryByRole("dialog")).toBeNull();
		await expect(burger).toHaveAttribute("aria-expanded", "false");
		await expect(burger).toHaveFocus();
	},
};

/** A grouped nav: each group is a control, its panel closed and out of reach until opened. */
export const GroupedNav: Story = {
	args: { links: groupedLinks, currentPath: "/menu/buns" },
	play: async ({ canvas }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await expect(menu).toHaveAttribute("aria-expanded", "false");
		await expect(canvas.queryByRole("link", { name: /Country sourdough/ })).toBeNull();
	},
};

export const GroupedOpenByClick: Story = {
	args: { links: groupedLinks },
	play: async ({ canvas, userEvent, step }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await step("a click pins the panel open", async () => {
			await userEvent.click(menu);
			await expect(menu).toHaveAttribute("aria-expanded", "true");
			await expect(canvas.getByRole("link", { name: /Country sourdough/ })).toBeVisible();
			await expect(canvas.getByRole("link", { name: /The whole menu/ })).toBeVisible();
			await expect(canvas.getByText("Skip the Saturday line.")).toBeVisible();
		});
		await step("the pointer leaving the bar keeps a pinned panel", async () => {
			await userEvent.unhover(menu);
			await expect(menu).toHaveAttribute("aria-expanded", "true");
		});
		await step("a second click closes it", async () => {
			await userEvent.click(menu);
			await expect(menu).toHaveAttribute("aria-expanded", "false");
			await expect(canvas.queryByRole("link", { name: /Country sourdough/ })).toBeNull();
		});
		await step("another group's control moves the open panel to it", async () => {
			await userEvent.click(menu);
			await userEvent.click(canvas.getByRole("button", { name: "Wholesale" }));
			await expect(menu).toHaveAttribute("aria-expanded", "false");
			await expect(canvas.getByRole("button", { name: "Wholesale" })).toHaveAttribute(
				"aria-expanded",
				"true",
			);
		});
	},
};

/** A hover opens a panel unpinned; the pointer leaving the bar closes it. */
export const GroupedOpenByHover: Story = {
	args: { links: groupedLinks },
	play: async ({ canvas, userEvent }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await userEvent.hover(menu);
		await expect(menu).toHaveAttribute("aria-expanded", "true");
		await userEvent.unhover(canvas.getByRole("banner"));
		await expect(menu).toHaveAttribute("aria-expanded", "false");
	},
};

export const GroupedKeyboard: Story = {
	args: { links: groupedLinks },
	play: async ({ canvas, userEvent, step }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await step("tabbing onto a group opens it", async () => {
			await userEvent.tab(); // the lockup
			await userEvent.tab();
			await expect(menu).toHaveFocus();
			await expect(menu).toHaveAttribute("aria-expanded", "true");
		});
		await step("the down arrow steps into the panel, and up and down walk it", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await waitFor(() =>
				expect(canvas.getByRole("link", { name: /The whole menu/ })).toHaveFocus(),
			);
			await userEvent.keyboard("{ArrowDown}");
			await expect(canvas.getByRole("link", { name: "Bread" })).toHaveFocus();
			await userEvent.keyboard("{ArrowUp}");
			await expect(canvas.getByRole("link", { name: /The whole menu/ })).toHaveFocus();
		});
		await step("Escape closes the panel and puts focus back on its control", async () => {
			await userEvent.keyboard("{Escape}");
			await expect(menu).toHaveAttribute("aria-expanded", "false");
			await expect(menu).toHaveFocus();
		});
		await step("left and right walk the bar", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(canvas.getByRole("button", { name: "Wholesale" })).toHaveFocus();
			await userEvent.keyboard("{ArrowRight}");
			await expect(canvas.getByRole("link", { name: "Visit" })).toHaveFocus();
			await userEvent.keyboard("{ArrowRight}");
			await expect(menu).toHaveFocus();
		});
		await step("tabbing out of an open group closes it", async () => {
			await userEvent.click(menu);
			await expect(menu).toHaveAttribute("aria-expanded", "true");
			await userEvent.tab({ shift: true });
			await expect(menu).toHaveAttribute("aria-expanded", "false");
		});
	},
};

export const GroupedClosedByOutsideClick: Story = {
	args: { links: groupedLinks },
	play: async ({ canvas, userEvent }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await userEvent.click(menu);
		await expect(menu).toHaveAttribute("aria-expanded", "true");
		await userEvent.click(canvas.getByRole("heading", { level: 1 }));
		await expect(menu).toHaveAttribute("aria-expanded", "false");
	},
};

export const GroupedClosedByFollowingALink: Story = {
	args: { links: groupedLinks },
	play: async ({ canvas, userEvent }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		await userEvent.click(menu);
		await userEvent.click(canvas.getByRole("link", { name: /Country sourdough/ }));
		await expect(menu).toHaveAttribute("aria-expanded", "false");
	},
};

/** The menu opens every group closed, even the one holding the current page. */
export const GroupedPhone: Story = {
	args: { links: groupedLinks, currentPath: "/menu/buns" },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const menu = within(canvas.getByRole("dialog", { name: "Menu" }));
		await expect(menu.getByRole("button", { name: "Menu" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	},
};

/** The tablet keeps the burger for a bar holding groups, up to 1180 pixels. */
export const GroupedTablet: Story = {
	args: { links: groupedLinks },
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Open menu" })).toBeVisible();
		await expect(canvas.queryByRole("navigation", { name: "Primary" })).toBeNull();
	},
};

/**
 * Two numbers, each a tel link. A desktop at 1280 shows the first (the
 * second waits for 1360), and the menu lists both.
 */
export const TwoPhones: Story = {
	args: { links: groupedLinks, phones },
	play: async ({ canvas }) => {
		const shop = canvas.getByRole("link", { name: "The shop (555) 555-0142" });
		await expect(shop).toBeVisible();
		await expect(shop).toHaveAttribute("href", "tel:+15555550142");
		await expect(canvas.queryByRole("link", { name: "Wholesale (555) 555-0143" })).toBeNull();
	},
};

/** On a phone the first number is a round call button beside the burger. */
export const TwoPhonesPhone: Story = {
	args: { links: groupedLinks, phones },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		const call = canvas.getByRole("link", { name: "The shop (555) 555-0142" });
		await expect(call).toBeVisible();
		await expect(call).toHaveAttribute("href", "tel:+15555550142");
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const menu = within(canvas.getByRole("dialog", { name: "Menu" }));
		await expect(menu.getByRole("link", { name: /THE SHOP.*0142/ })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		await expect(menu.getByRole("link", { name: /WHOLESALE.*0143/ })).toHaveAttribute(
			"href",
			"tel:+15555550143",
		);
	},
};

/** The light bar, the default. */
export const Solid: Story = {
	args: { variant: "solid" },
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("banner");
		await expect(getComputedStyle(bar).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
	},
};

/** Over a full bleed hero: clear at the top, solid once the hero has mostly scrolled by. */
export const Transparent: Story = {
	args: { variant: "transparent" },
	parameters: { page: { hero: true, tall: true } },
	play: async ({ canvas, step }) => {
		const bar = canvas.getByRole("banner");
		await step("clear over the hero, with the CTA held back", async () => {
			await expect(getComputedStyle(bar).backgroundColor).toBe("rgba(0, 0, 0, 0)");
			await expect(canvas.queryByRole("link", { name: "Order ahead" })).toBeNull();
		});
		await step("solid, with the CTA, once scrolled", async () => {
			window.scrollTo({ top: window.innerHeight, behavior: "instant" });
			await waitFor(() =>
				expect(getComputedStyle(bar).backgroundColor).not.toBe("rgba(0, 0, 0, 0)"),
			);
			await expect(canvas.getByRole("link", { name: "Order ahead" })).toBeVisible();
		});
	},
};

/** The dark bar, matching a dark page surface. */
export const Dark: Story = {
	args: { variant: "dark" },
	decorators: [
		(Story) => (
			<div style={{ background: "var(--surface-dark)", color: "#f4efe6", minHeight: "100vh" }}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("banner");
		// The bar's words are light on the dark band.
		await expect(getComputedStyle(bar).color).not.toBe("rgb(21, 21, 21)");
	},
};

/** Presentation mode: the page's own stops replace the nav, and the CTA steps aside. */
export const PageStops: Story = {
	args: {
		stops: [
			{ id: "bread", label: "Bread" },
			{ id: "pastry", label: "Pastry" },
			{ id: "visit", label: "Visit" },
		],
	},
	play: async ({ canvas }) => {
		const stops = within(canvas.getByRole("navigation", { name: "Page sections" }));
		await expect(stops.getByRole("link", { name: "Pastry" })).toHaveAttribute("href", "#pastry");
		await expect(canvas.queryByRole("navigation", { name: "Primary" })).toBeNull();
		await expect(canvas.queryByRole("link", { name: "Order ahead" })).toBeNull();
	},
};

/** The longest realistic bar: every entry, both numbers, a long CTA. */
export const LongestContent: Story = {
	args: {
		links: [
			...groupedLinks,
			{ label: "Catering and events", href: "/catering" },
			{ label: "Our story", href: "/about" },
		],
		phones,
		primaryCTA: { label: "Order for Saturday pickup", href: "/order" },
	},
};
