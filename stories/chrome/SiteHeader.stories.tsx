import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
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
import { brokenWords, expectNoSidewaysScroll, textLeft } from "../support/geometry";
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

/**
 * Over a dark hero the current entry keeps its siblings' light words and is
 * marked by an underline, never by the primary, which a theme cuts for light
 * grounds. The hero is one flat color, so the accessibility check measures
 * every entry against it.
 */
export const CurrentOverDarkHero: Story = {
	args: { variant: "transparent", currentPath: "/menu" },
	parameters: { page: { hero: true, flatHero: true } },
	play: async ({ canvas }) => {
		const nav = within(primaryNav(canvas));
		const current = nav.getByRole("link", { name: "Menu" });
		const sibling = nav.getByRole("link", { name: "Cakes" });
		await expect(current).toHaveAttribute("aria-current", "page");
		await expect(getComputedStyle(current).color).toBe(getComputedStyle(sibling).color);
		await expect(getComputedStyle(current).textDecorationLine).toBe("underline");
		await expect(getComputedStyle(sibling).textDecorationLine).toBe("none");
	},
};

/**
 * The same bar on a theme whose primary is a deep green, the kind that read
 * 1.64 to 1 as the current entry over a dark hero. The entry reads the light
 * words its siblings do, whatever the primary.
 */
export const CurrentOverDarkHeroDarkPrimary: Story = {
	...CurrentOverDarkHero,
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--primary": "#1e4d2b",
						"--primary-fill": "#1e4d2b",
						"--primary-ink": "#1e4d2b",
						"--primary-deep": "#163a20",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
};

/** A group holding the current page is marked the same way over the hero. */
export const CurrentGroupOverDarkHero: Story = {
	args: { variant: "transparent", links: groupedLinks, currentPath: "/menu/buns" },
	parameters: { page: { hero: true, flatHero: true } },
	play: async ({ canvas }) => {
		const group = canvas.getByRole("button", { name: "Menu" });
		const other = canvas.getByRole("button", { name: "Wholesale" });
		await expect(getComputedStyle(group).color).toBe(getComputedStyle(other).color);
		await expect(getComputedStyle(group).textDecorationLine).toBe("underline");
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
 * The panel a trades site builds: two link columns of service names, icon
 * rows, and small cards, with no feature card, on the template's 1200 wrap.
 * Their least widths fit one row at 1280, so it is the row that gives way.
 */
const crowdedServices: NavLink[] = [
	{
		label: "Services",
		href: "/services",
		columns: [
			{
				heading: "Wholesale",
				links: [
					{ label: "Wholesale accounts", href: "/wholesale/accounts" },
					{ label: "Restaurant deliveries", href: "/wholesale/restaurants" },
					{ label: "Grocery shelving", href: "/wholesale/grocers" },
				],
			},
			{
				heading: "Occasions",
				links: [
					{ label: "Celebration cakes", href: "/cakes/celebration" },
					{ label: "Wedding consultations", href: "/cakes/weddings" },
					{ label: "Corporate catering", href: "/catering" },
				],
			},
			{
				kind: "rows",
				heading: "Plan an order",
				rows: [
					{
						label: "Standing orders",
						description: "Delivered before you open",
						icon: "truck",
						href: "/wholesale/standing",
						highlight: true,
					},
					{
						label: "Seasonal pricing",
						description: "This season's list",
						icon: "document",
						href: "/wholesale/prices",
					},
					{
						label: "Consultations",
						description: "Thirty minutes with a baker",
						icon: "calendar",
						href: "/consultations",
					},
					{
						label: "Questions",
						description: "Plain answers",
						icon: "help",
						href: "/faq",
					},
				],
			},
			{
				kind: "cards",
				heading: "Latest",
				cards: [
					{
						kicker: "Journal",
						title: "Why our rye rests two days",
						meta: "Five minute read",
						image: { src: "/images/bakery-loop-first-frame.jpg" },
						href: "/journal/rye",
					},
					{ kicker: "Hiring", title: "Morning baker", meta: "Full time", href: "/jobs/baker" },
				],
			},
		],
	},
	{ label: "Visit", href: "/visit" },
];

/**
 * Two link columns, icon rows, and cards in one panel at 1280, on a 1200
 * wrap (the template's own `--max-width`). The sections wrap to a second row
 * before any is squeezed below its words, and no label in the panel breaks
 * inside a word.
 */
export const CrowdedServicesPanel: Story = {
	args: { links: crowdedServices, currentPath: "/" },
	decorators: [
		(Story) => (
			<div style={{ "--max-width": "1200px" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent, step }) => {
		await expect(window.innerWidth).toBe(1280);
		const control = await openGroup(canvas, userEvent, "Services");
		const region = document.getElementById(control.getAttribute("aria-controls") ?? "");
		const card = region?.firstElementChild;
		if (!card) throw new Error("The open group's panel holds no card.");
		await step("no word in the panel breaks inside itself", async () => {
			await expect(brokenWords(card)).toEqual([]);
		});
		await step("every section stays inside the card", async () => {
			const edge = card.getBoundingClientRect().right;
			for (const name of [/Corporate catering/, /Consultations/, /Morning baker/]) {
				const box = canvas.getByRole("link", { name }).getBoundingClientRect();
				await expect(box.right).toBeLessThanOrEqual(edge + 1);
			}
		});
		await step("the cards wrap below the rows rather than squeeze them", async () => {
			const row = canvas.getByRole("link", { name: /Standing orders/ }).getBoundingClientRect();
			const latest = canvas.getByRole("link", { name: /Morning baker/ }).getBoundingClientRect();
			await expect(latest.top).toBeGreaterThanOrEqual(row.bottom);
		});
		await expectNoSidewaysScroll();
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
		await expectNoSidewaysScroll();
	},
};

/** Five groups of one link column each, for the crowded bar. */
const fiveGroups: NavLink[] = ["Bread", "Pastry", "Cakes", "Wholesale", "Catering"].map(
	(label) => ({
		label,
		href: `/${label.toLowerCase()}`,
		columns: [
			{
				heading: label,
				links: [{ label: `All ${label.toLowerCase()}`, href: `/${label.toLowerCase()}/all` }],
			},
		],
	}),
);

/**
 * A wide mark (141 by 55) in a bar crowded with five groups, a number, and
 * the call to action at 1280: the lockup never shrinks, so the mark stands
 * at the theme's mark height and its own width.
 */
export const WideMarkCrowdedBar: Story = {
	args: {
		brand: {
			name: "Kestrel Hollow Bakehouse",
			logo: { src: "/images/kestrel-badge-wide.svg", wordmark: false, alt: "Kestrel Hollow" },
		},
		links: fiveGroups,
		phones: [phones[0] as (typeof phones)[0]],
		primaryCTA: { label: "Order for Saturday pickup", href: "/order" },
		variant: "solid",
	},
	play: async ({ canvas }) => {
		const home = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		const mark = home.querySelector("img") as HTMLImageElement;
		// The picture loads before it is measured; a loaded whole suite takes a while.
		await waitFor(() => expect(mark.complete && mark.naturalWidth > 0).toBe(true), {
			timeout: 5000,
		});
		const box = mark.getBoundingClientRect();
		const height = Number.parseFloat(
			getComputedStyle(home).getPropertyValue("--brand-mark-height"),
		);
		await expect(Math.round(box.height)).toBe(height);
		// Its own ratio: 141 by 55 at the mark height.
		await expect(Math.round(box.width)).toBe(Math.round((height * 141) / 55));
		await expect(canvas.getByRole("link", { name: "Order for Saturday pickup" })).toBeVisible();
	},
};

/** A one page site: every entry points at an anchor on one page, several at the same one. */
const sharedHrefs: NavLink[] = [
	{ label: "Bread", href: "/#menu" },
	{ label: "Pastry", href: "/#menu" },
	{
		label: "Visit",
		href: "/#visit",
		columns: [
			{
				heading: "The shop",
				links: [
					{ label: "Hours", href: "/#visit" },
					{ label: "Parking", href: "/#visit" },
				],
			},
			{
				kind: "rows",
				rows: [
					{ label: "Directions", icon: "map", href: "/#visit" },
					{ label: "Call the shop", icon: "phone", href: "/#visit" },
				],
			},
		],
	},
	{
		label: "Wholesale",
		href: "/#visit",
		columns: [{ heading: "Cafes", links: [{ label: "Accounts", href: "/#visit" }] }],
	},
];

/**
 * Every entry, link, and row pointing at one page's anchors, several at the
 * same: each renders, and the bar keeps them apart by their place.
 */
export const SharedHrefs: Story = {
	args: { links: sharedHrefs, currentPath: "/" },
	play: async ({ canvas, userEvent }) => {
		const nav = within(primaryNav(canvas));
		await expect(nav.getByRole("link", { name: "Bread" })).toHaveAttribute("href", "/#menu");
		await expect(nav.getByRole("link", { name: "Pastry" })).toHaveAttribute("href", "/#menu");
		await openGroup(canvas, userEvent, "Visit");
		for (const name of ["Hours", "Parking", /Directions/, /Call the shop/]) {
			await expect(canvas.getByRole("link", { name })).toHaveAttribute("href", "/#visit");
		}
	},
};

/**
 * Quiet links: the towns under a region heading, in the softer words and
 * the regular weight, beside a link column at its full weight.
 */
export const QuietLinks: Story = {
	args: {
		links: [
			{
				label: "Delivery",
				href: "/delivery",
				columns: [
					{
						heading: "Fairhaven",
						links: [
							{ label: "Alder Street", href: "/delivery/alder" },
							{ label: "Old Mill", href: "/delivery/old-mill", quiet: true },
							{ label: "Birch Row", href: "/delivery/birch-row", quiet: true },
						],
					},
				],
			},
		],
	},
	play: async ({ canvas, userEvent }) => {
		await openGroup(canvas, userEvent, "Delivery");
		const loud = canvas.getByRole("link", { name: "Alder Street" });
		const quiet = canvas.getByRole("link", { name: "Old Mill" });
		const weight = (link: HTMLElement) =>
			Number(getComputedStyle(link.querySelector(".nav-mega-label") as Element).fontWeight);
		await expect(weight(quiet)).toBeLessThan(weight(loud));
		await expect(getComputedStyle(quiet).color).not.toBe(getComputedStyle(loud).color);
	},
};

/** The call to action with the arrow a hero's primary button shows. */
export const CTAWithArrow: Story = {
	args: { primaryCTA: { ...cta, arrow: true } },
	play: async ({ canvas }) => {
		const action = canvas.getByRole("link", { name: "Order ahead" });
		await expect(action.querySelector(".arrow")).toHaveAttribute("aria-hidden", "true");
		await expect(action).toHaveTextContent("Order ahead→");
	},
};

/** No arrow unless asked, as before. */
export const CTAWithoutArrow: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("link", { name: "Order ahead" }).querySelector(".arrow"),
		).toBeNull();
	},
};

/**
 * A design that runs the bar wider than the content: `--header-max` and
 * `--header-gutter` set the bar's and the panel's width and sides, and
 * `--nav-open-bg` and `--nav-open-ink` the open group's pill; the phone
 * pill's padding and size take `--nav-phone-pad` and `--nav-phone-size`.
 */
export const HeaderTokens: Story = {
	args: { links: groupedLinks, phones, currentPath: "/" },
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--header-max": "1240px",
						"--header-gutter": "20px",
						"--nav-open-bg": "var(--primary-fill)",
						"--nav-open-ink": "var(--on-primary)",
						"--nav-phone-pad": "4px 12px 4px 10px",
						"--nav-phone-size": "1.05rem",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		const home = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		// The bar's content starts 40px in (a 1240 bar, 20px sides), where the
		// 1040 wrap with its 56px gutter starts it 176px in.
		await expect(Math.round(home.getBoundingClientRect().left)).toBe(40);
		const menu = await openGroup(canvas, userEvent, "Menu");
		// The pill eases in, so its fill is read once it has arrived.
		await waitFor(() => expect(getComputedStyle(menu).backgroundColor).toBe("rgb(214, 58, 16)"));
		await waitFor(() => expect(getComputedStyle(menu).color).toBe("rgb(255, 255, 255)"));
		const card = document.getElementById(menu.getAttribute("aria-controls") ?? "")
			?.firstElementChild as HTMLElement;
		await expect(Math.round(card.getBoundingClientRect().width)).toBe(1200);
		const number = canvas.getByText("(555) 555-0142");
		await expect(getComputedStyle(number).fontSize).toBe("16.8px");
		await expect(getComputedStyle(number.closest("a") as Element).paddingLeft).toBe("10px");
	},
};

/** The defaults: the bar holds to the page's wrap, and the open pill is the hover tint. */
export const HeaderTokenDefaults: Story = {
	args: { links: groupedLinks, phones, currentPath: "/" },
	play: async ({ canvas, userEvent }) => {
		const home = canvas.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
		await expect(Math.round(home.getBoundingClientRect().left)).toBe(176);
		const menu = await openGroup(canvas, userEvent, "Menu");
		const bar = canvas.getByRole("banner");
		await waitFor(() => expect(getComputedStyle(menu).color).toBe(getComputedStyle(bar).color));
		await expect(getComputedStyle(canvas.getByText("(555) 555-0142")).fontSize).toBe("15.2px");
	},
};

/**
 * On a phone, `menuLabel` sets words beside the burger, which name it; the
 * lines still close to an X while the menu is open.
 */
export const MenuLabelPhone: Story = {
	args: { menuLabel: "Menu" },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		const burger = canvas.getByRole("button", { name: "Menu" });
		await expect(canvas.getByText("Menu", { selector: ".nav-burger-label" })).toBeVisible();
		await expect(burger).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(burger);
		await expect(burger).toHaveAttribute("aria-expanded", "true");
		await expect(canvas.getByRole("dialog", { name: "Menu" })).toBeVisible();
	},
};

/**
 * The solid bar on a deep green theme, where the current entry's hue sits
 * within 2 to 1 of its siblings': it is marked by an underline too, so a
 * reader who cannot tell the hues apart still sees which page this is.
 */
export const CurrentOnSolidBarDarkPrimary: Story = {
	args: { variant: "solid", currentPath: "/menu" },
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--primary": "#1e4d2b",
						"--primary-fill": "#1e4d2b",
						"--primary-ink": "#1e4d2b",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const nav = within(primaryNav(canvas));
		const current = nav.getByRole("link", { name: "Menu" });
		const sibling = nav.getByRole("link", { name: "Cakes" });
		await expect(current).toHaveAttribute("aria-current", "page");
		await expect(getComputedStyle(current).color).toBe("rgb(30, 77, 43)");
		await expect(getComputedStyle(current).textDecorationLine).toBe("underline");
		await expect(getComputedStyle(sibling).textDecorationLine).toBe("none");
	},
};

/** The feature card's ground, as a reader finds it from its headline. */
const featureCard = (canvas: ReturnType<typeof within>) =>
	canvas.getByText("Skip the Saturday line.").closest(".nav-feature") as HTMLElement;

/**
 * The feature card's ground and words take `--menu-card-bg` and
 * `--menu-card-ink`, so a theme can set the card apart from the deep
 * primary; the eyebrow, the headline, the line, and the ticked points all
 * read the card's words.
 */
export const FeatureCardTokens: Story = {
	args: { links: sectionedLinks },
	decorators: [
		(Story) => (
			<div
				style={
					{
						"--menu-card-bg": "#1f2a36",
						"--menu-card-ink": "#f4efe6",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		await openGroup(canvas, userEvent, "Menu");
		const card = featureCard(canvas);
		await expect(getComputedStyle(card).backgroundColor).toBe("rgb(31, 42, 54)");
		for (const words of ["Order ahead", "Skip the Saturday line.", "Ready by eight"]) {
			await expect(getComputedStyle(within(card).getByText(words)).color).toBe(
				"rgb(244, 239, 230)",
			);
		}
	},
};

/** With neither token set the card is the deep primary with the fill's words, as before. */
export const FeatureCardDefaults: Story = {
	args: { links: sectionedLinks },
	play: async ({ canvas, userEvent }) => {
		await openGroup(canvas, userEvent, "Menu");
		const card = featureCard(canvas);
		await expect(getComputedStyle(card).backgroundColor).toBe("rgb(214, 58, 16)");
		await expect(getComputedStyle(within(card).getByText("Skip the Saturday line.")).color).toBe(
			"rgb(255, 255, 255)",
		);
	},
};
