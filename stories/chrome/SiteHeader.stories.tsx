import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import type { NavLink, NavPanelSection } from "../../src/chrome";
import { SiteHeader } from "../../src/chrome";
import {
	brand,
	contact,
	cta,
	flatLinks,
	groupedLinks,
	phones,
	sectionedLinks,
} from "../fixtures/bakery";
import { CrashBoundary } from "../support/boundary";
import { textLeft } from "../support/geometry";
import { PageBehind, type PageBehindProps } from "../support/page";
import { pin } from "../support/viewports";

/**
 * The fixed bar every page wears. A nav group's panel holds sections left to
 * right (link columns with badges and children, a picture, icon rows, small
 * cards) and the feature card at the right.
 */
const meta = {
	title: "Chrome/SiteHeader",
	component: SiteHeader,
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
	play: async ({ canvas }) => {
		const nav = within(primaryNav(canvas));
		await expect(nav.getAllByRole("link")).toHaveLength(4);
		await expect(nav.getByRole("link", { name: "Menu" })).toHaveAttribute("aria-current", "page");
		await expect(nav.getByRole("link", { name: "Cakes" })).not.toHaveAttribute("aria-current");
		// A flat link on the current page is marked, as a group holding it is.
		const color = (name: string) => getComputedStyle(nav.getByRole("link", { name })).color;
		await expect(color("Menu")).not.toBe(color("Cakes"));
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

/** Opens a group's panel by its control and hands it back. */
async function openGroup(
	canvas: ReturnType<typeof within>,
	userEvent: { click: (element: Element) => Promise<void> },
	name: string,
) {
	const control = canvas.getByRole("button", { name });
	await userEvent.click(control);
	await expect(control).toHaveAttribute("aria-expanded", "true");
	return control;
}

/** A link column with a linked heading, a badge, and children; a picture; the ticked feature card. */
export const SectionedLinksAndPicture: Story = {
	args: { links: sectionedLinks, currentPath: "/" },
	play: async ({ canvas, userEvent, step }) => {
		await openGroup(canvas, userEvent, "Menu");
		await step("the column heading is a link", async () => {
			await expect(canvas.getByRole("link", { name: "Bread" })).toHaveAttribute(
				"href",
				"/menu/bread",
			);
		});
		await step("a badge rides in its link's name", async () => {
			await expect(canvas.getByRole("link", { name: /Country sourdough\s*Popular/ })).toBeVisible();
		});
		await step("children sit indented under their parent", async () => {
			const parent = canvas.getByRole("link", { name: /Country sourdough/ });
			const child = canvas.getByRole("link", { name: "Whole loaf" });
			await expect(child.getBoundingClientRect().top).toBeGreaterThanOrEqual(
				parent.getBoundingClientRect().bottom - 1,
			);
			await expect(textLeft(child)).toBeGreaterThan(textLeft(parent));
			await expect(canvas.getByRole("link", { name: /Half loaf\s*New/ })).toBeVisible();
		});
		await step("the picture is one link named by its caption", async () => {
			await expect(canvas.getByRole("link", { name: "See the morning bake" })).toHaveAttribute(
				"href",
				"/menu/morning",
			);
		});
		await step("the feature card ticks its points", async () => {
			for (const point of ["Ready by eight", "Paid at pickup", "Two days for a cake"]) {
				await expect(canvas.getByText(point)).toBeVisible();
			}
		});
	},
};

/** Icon rows, one highlighted as the way most people should take, beside small cards. */
export const SectionedRowsAndCards: Story = {
	args: { links: sectionedLinks, currentPath: "/" },
	play: async ({ canvas, userEvent }) => {
		await openGroup(canvas, userEvent, "Wholesale");
		const start = canvas.getByRole("link", { name: /Start a standing order/ });
		const prices = canvas.getByRole("link", { name: /Price sheet/ });
		await expect(start).toHaveAttribute("href", "/wholesale/start");
		await expect(getComputedStyle(start).backgroundColor).not.toBe(
			getComputedStyle(prices).backgroundColor,
		);
		await expect(canvas.getByRole("link", { name: /Why our rye rests two days/ })).toHaveAttribute(
			"href",
			"/journal/rye",
		);
		await expect(canvas.getByRole("link", { name: /Morning baker/ })).toBeVisible();
	},
};

/** The up and down arrows walk a panel's links in order, across every kind of section. */
export const SectionedKeyboard: Story = {
	args: { links: sectionedLinks, currentPath: "/" },
	play: async ({ canvas, userEvent, step }) => {
		const menu = canvas.getByRole("button", { name: "Menu" });
		const walk = async (names: (string | RegExp)[]) => {
			for (const name of names) {
				await userEvent.keyboard("{ArrowDown}");
				await waitFor(() => expect(canvas.getByRole("link", { name })).toHaveFocus());
			}
		};
		await step("a link column, its children, the picture, then the feature's button", async () => {
			menu.focus();
			await walk([
				/The whole menu/,
				"Bread",
				/Country sourdough/,
				"Whole loaf",
				/Half loaf/,
				/Seeded rye/,
				"See the morning bake",
				"Order for Saturday",
			]);
			await userEvent.keyboard("{ArrowDown}");
			await expect(canvas.getByRole("link", { name: /The whole menu/ })).toHaveFocus();
		});
		await step("icon rows, then cards", async () => {
			await userEvent.keyboard("{Escape}");
			await expect(menu).toHaveFocus();
			await userEvent.keyboard("{ArrowRight}");
			await expect(canvas.getByRole("button", { name: "Wholesale" })).toHaveFocus();
			await walk([
				/Start a standing order/,
				/Price sheet/,
				/Talk to the bakers/,
				/Why our rye rests two days/,
				/Morning baker/,
			]);
		});
	},
};

/**
 * A page that a picture or a card leads to: its group marks itself current,
 * and the picture or the card link sets `aria-current`, as a link column's
 * links do.
 */
export const CurrentPictureAndCard: Story = {
	args: { links: sectionedLinks, currentPath: "/menu/morning" },
	play: async ({ canvas, userEvent }) => {
		await openGroup(canvas, userEvent, "Menu");
		await expect(canvas.getByRole("link", { name: "See the morning bake" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	},
};

/** A section kind the panel does not know is left out; the header draws, and the group with nothing it can draw is a plain link. */
export const UnknownSectionKind: Story = {
	args: {
		links: [
			{
				label: "Menu",
				href: "/menu",
				columns: [{ kind: "video", href: "/menu/video" } as unknown as NavPanelSection],
			} satisfies NavLink,
			{ label: "Visit", href: "/visit" },
		],
	},
	decorators: [
		(Story) => (
			<CrashBoundary>
				<Story />
			</CrashBoundary>
		),
	],
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("alert")).toBeNull();
		await expect(canvas.getByRole("banner")).toBeVisible();
		await expect(
			within(canvas.getByRole("navigation", { name: "Primary" })).getByRole("link", {
				name: "Menu",
			}),
		).toHaveAttribute("href", "/menu");
	},
};

/**
 * The fullest panel at the narrowest desktop the bar shows its groups at:
 * a link column, a picture, cards, and the feature card together. Every
 * section stays inside the card.
 */
export const CrowdedPanel: Story = {
	args: {
		links: [
			{
				...sectionedLinks[0],
				columns: [...(sectionedLinks[0]?.columns ?? []), ...(sectionedLinks[1]?.columns ?? [])],
			} as NavLink,
			{ label: "Visit", href: "/visit" },
		],
		currentPath: "/",
	},
	play: async ({ canvas, userEvent }) => {
		const control = await openGroup(canvas, userEvent, "Menu");
		// The panel the control names; its one child is the card the sections sit in.
		const region = document.getElementById(control.getAttribute("aria-controls") ?? "");
		const card = region?.firstElementChild;
		if (!card) throw new Error("The open group's panel holds no card.");
		const panel = card.getBoundingClientRect();
		for (const name of [
			/Morning baker/,
			"See the morning bake",
			/Talk to the bakers/,
			"Order for Saturday",
		]) {
			const box = canvas.getByRole("link", { name }).getBoundingClientRect();
			await expect(box.right).toBeLessThanOrEqual(panel.right + 1);
		}
	},
};

/**
 * The same panel at the narrowest desktop the bar shows its groups at, on
 * the theme's 1040 wrap: the picture, the icon rows, and the cards cannot
 * share one row beside the feature card, so they wrap to a second rather
 * than squeeze a row past reading or run under the feature card.
 */
export const CrowdedPanelNarrowDesktop: Story = {
	...CrowdedPanel,
	globals: pin("narrowDesktop"),
	play: async ({ canvas, userEvent }) => {
		await expect(window.innerWidth).toBe(1180);
		await openGroup(canvas, userEvent, "Menu");
		const feature = canvas
			.getByRole("link", { name: "Order for Saturday" })
			.getBoundingClientRect();
		const picture = canvas
			.getByRole("link", { name: "See the morning bake" })
			.getBoundingClientRect();
		for (const name of [
			/Morning baker/,
			"See the morning bake",
			/Talk to the bakers/,
			/Start a standing order/,
		]) {
			const box = canvas.getByRole("link", { name }).getBoundingClientRect();
			// Never under the feature card, and never squeezed past reading.
			await expect(box.right).toBeLessThanOrEqual(feature.left);
			await expect(box.width).toBeGreaterThanOrEqual(150);
		}
		// The cards wrapped below the picture.
		const card = canvas.getByRole("link", { name: /Morning baker/ }).getBoundingClientRect();
		await expect(card.top).toBeGreaterThanOrEqual(picture.bottom);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
