import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, useState } from "react";
import { expect, fn, type MockInstance, spyOn, waitFor, within } from "storybook/test";
import { SiteMenu } from "../../src/chrome";
import type { NavLink } from "../../src/types";
import {
	brand,
	contact,
	cta,
	flatLinks,
	groupedLinks,
	phone,
	phones,
	sectionedLinks,
} from "../fixtures/bakery";
import { expectNoSidewaysScroll, textLeft } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Is the phone's full screen menu, opened from the header's burger, for the
 * navigation that does not fit in the bar. The phone's full screen menu on a
 * native modal `<dialog>`. The owner holds the open state, so each story
 * mounts it behind a button the way the header's burger does.
 *
 * A test's key presses are synthetic and the platform acts only on real
 * ones, so a synthetic Escape never closes a native dialog. The Escape story
 * calls `requestClose()`, which runs the platform's own Escape path (a
 * cancel event, then close) and is what the browser does on the key.
 */
const meta = {
	title: "Chrome/SiteMenu",
	component: SiteMenu,
	globals: pin("phone"),
	args: { open: false, onClose: fn(), links: flatLinks, primaryCTA: cta, contact },
	render: function Render(args) {
		const [open, setOpen] = useState(args.open);
		return (
			<>
				<button type="button" onClick={() => setOpen(true)}>
					Open the menu
				</button>
				<SiteMenu
					{...args}
					open={open}
					onClose={() => {
						args.onClose();
						setOpen(false);
					}}
				/>
			</>
		);
	},
} satisfies Meta<typeof SiteMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens the menu from its button and hands back the dialog. */
async function openMenu(
	canvas: ReturnType<typeof within>,
	userEvent: { click: (element: Element) => Promise<void> },
) {
	await userEvent.click(canvas.getByRole("button", { name: "Open the menu" }));
	const dialog = canvas.getByRole("dialog", { name: "Menu" });
	await expect(dialog).toBeVisible();
	return dialog;
}

export const Flat: Story = {
	play: async ({ canvas, userEvent, args, step }) => {
		const dialog = await openMenu(canvas, userEvent);
		const menu = within(dialog);
		await step("the entries, the CTA, and the contact block", async () => {
			await expect(menu.getByRole("link", { name: /Menu/ })).toBeVisible();
			await expect(menu.getByRole("link", { name: "Order ahead" })).toBeVisible();
			await expect(menu.getByRole("link", { name: /^CALL\s/ })).toHaveAttribute(
				"href",
				"tel:+15555550142",
			);
			await expect(menu.getByRole("link", { name: contact.email })).toHaveAttribute(
				"href",
				`mailto:${contact.email}`,
			);
		});
		await step("focus moves into the dialog", async () => {
			await expect(dialog).toContainElement(document.activeElement as HTMLElement);
		});
		await step("the close button closes it, reports once, and returns focus", async () => {
			await userEvent.click(menu.getByRole("button", { name: "Close menu" }));
			await expect(canvas.queryByRole("dialog")).toBeNull();
			await expect(args.onClose).toHaveBeenCalledOnce();
			await expect(canvas.getByRole("button", { name: "Open the menu" })).toHaveFocus();
		});
	},
};

/** Whether a link's words wear the 2px underline that marks the current page. */
function underlined(link: HTMLElement): boolean {
	// The words sit in the link's first child, so the number or a badge beside them stays clear.
	const words = link.firstElementChild ?? link;
	const style = getComputedStyle(words);
	return style.textDecorationLine.includes("underline") && style.textDecorationThickness === "2px";
}

/**
 * The current page's link is marked for a screen reader and for the eye, by
 * the 2px underline the bar uses; the other entries carry neither.
 */
export const CurrentPage: Story = {
	args: { currentPath: "/cakes" },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const current = menu.getByRole("link", { name: /Cakes/ });
		await expect(current).toHaveAttribute("aria-current", "page");
		await expect(underlined(current)).toBe(true);
		await expect(underlined(menu.getByRole("link", { name: /Visit/ }))).toBe(false);
	},
};

/** Inside an open group, the current page's link is underlined too. */
export const CurrentPageInAGroup: Story = {
	args: { links: groupedLinks, currentPath: "/menu/buns" },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("button", { name: "Menu" }));
		const current = menu.getByRole("link", { name: "Morning buns" });
		await expect(current).toHaveAttribute("aria-current", "page");
		await expect(underlined(current)).toBe(true);
		await expect(underlined(menu.getByRole("link", { name: "Croissants" }))).toBe(false);
	},
};

export const ClosedByEscape: Story = {
	play: async ({ canvas, userEvent, args }) => {
		const dialog = (await openMenu(canvas, userEvent)) as HTMLDialogElement & {
			requestClose: () => void;
		};
		dialog.requestClose();
		await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
		await expect(args.onClose).toHaveBeenCalledOnce();
		await expect(canvas.getByRole("button", { name: "Open the menu" })).toHaveFocus();
	},
};

export const ClosedByFollowingALink: Story = {
	play: async ({ canvas, userEvent, args }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("link", { name: /Visit/ }));
		await expect(canvas.queryByRole("dialog")).toBeNull();
		await expect(args.onClose).toHaveBeenCalledOnce();
	},
};

/** Groups are accordions: every one starts closed, and one opens at a time. */
export const Grouped: Story = {
	args: { links: groupedLinks, currentPath: "/menu/buns", phones },
	play: async ({ canvas, userEvent, step }) => {
		let menu = within(await openMenu(canvas, userEvent));
		const group = (name: string) => menu.getByRole("button", { name });
		await step("every group starts closed, the current page's included", async () => {
			await expect(group("Menu")).toHaveAttribute("aria-expanded", "false");
			await expect(group("Wholesale")).toHaveAttribute("aria-expanded", "false");
			await expect(menu.queryByRole("link", { name: "Morning buns" })).toBeNull();
		});
		await step("opening a group shows its links", async () => {
			await userEvent.click(group("Menu"));
			await expect(group("Menu")).toHaveAttribute("aria-expanded", "true");
			await expect(menu.getByRole("link", { name: "Morning buns" })).toBeVisible();
			await expect(menu.getByRole("link", { name: "Morning buns" })).toHaveAttribute(
				"aria-current",
				"page",
			);
			await expect(menu.getByRole("link", { name: "The whole menu" })).toBeVisible();
		});
		await step("opening another closes the first", async () => {
			await userEvent.click(group("Wholesale"));
			await expect(group("Wholesale")).toHaveAttribute("aria-expanded", "true");
			await expect(group("Menu")).toHaveAttribute("aria-expanded", "false");
			await expect(menu.queryByRole("link", { name: "Morning buns" })).toBeNull();
		});
		await step("a second click closes a group", async () => {
			await userEvent.click(group("Wholesale"));
			await expect(group("Wholesale")).toHaveAttribute("aria-expanded", "false");
		});
		await step("reopening the menu closes every group again", async () => {
			await userEvent.click(group("Menu"));
			await userEvent.click(menu.getByRole("button", { name: "Close menu" }));
			menu = within(await openMenu(canvas, userEvent));
			await expect(group("Menu")).toHaveAttribute("aria-expanded", "false");
		});
		await step("both header numbers are listed, each a tel link", async () => {
			await expect(menu.getByRole("link", { name: /THE SHOP/ })).toHaveAttribute(
				"href",
				"tel:+15555550142",
			);
			await expect(menu.getByRole("link", { name: /WHOLESALE/ })).toHaveAttribute(
				"href",
				"tel:+15555550143",
			);
		});
	},
};

/** A service area business: no street, so the address reads as the town alone. */
export const NoStorefront: Story = {
	args: {
		contact: { ...contact, address: { locality: "Fairhaven", region: "CO" } },
	},
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByText(/FAIRHAVEN, CO/)).toBeVisible();
		await expect(menu.queryByText(/·/)).toBeNull();
	},
};

/** A page's own stops as `#id` links, with no CTA and no contact block. */
export const PageStops: Story = {
	args: {
		links: [
			{ label: "Bread", href: "#bread" },
			{ label: "Pastry", href: "#pastry" },
		],
		primaryCTA: undefined,
		contact: undefined,
		label: "Page sections",
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open the menu" }));
		const menu = within(canvas.getByRole("dialog", { name: "Page sections" }));
		await expect(menu.getByRole("link", { name: /Pastry/ })).toHaveAttribute("href", "#pastry");
		await expect(menu.queryByRole("link", { name: "Order ahead" })).toBeNull();
	},
};

/**
 * A group's sections as the phone draws them: children indented under their
 * parent, badges kept, and pictures, icon rows, and cards as plain links of
 * their captions, labels, and titles.
 */
export const Sectioned: Story = {
	args: { links: sectionedLinks },
	play: async ({ canvas, userEvent, step }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await step("children sit indented under their parent, badges and all", async () => {
			await userEvent.click(menu.getByRole("button", { name: "Menu" }));
			const parent = menu.getByRole("link", { name: /Country sourdough\s*Popular/ });
			const child = menu.getByRole("link", { name: "Whole loaf" });
			await expect(child.getBoundingClientRect().top).toBeGreaterThanOrEqual(
				parent.getBoundingClientRect().bottom - 1,
			);
			await expect(textLeft(child)).toBeGreaterThan(textLeft(parent));
			await expect(menu.getByRole("link", { name: /Half loaf\s*New/ })).toBeVisible();
			await expect(menu.getByRole("link", { name: "Bread" })).toHaveAttribute(
				"href",
				"/menu/bread",
			);
		});
		await step("a picture is a plain link of its caption", async () => {
			await expect(menu.getByRole("link", { name: "See the morning bake" })).toHaveAttribute(
				"href",
				"/menu/morning",
			);
			await expect(menu.queryByRole("img")).toBeNull();
		});
		await step("icon rows and cards are plain links of their labels and titles", async () => {
			await userEvent.click(menu.getByRole("button", { name: "Wholesale" }));
			await expect(menu.getByRole("link", { name: "Start a standing order" })).toHaveAttribute(
				"href",
				"/wholesale/start",
			);
			await expect(menu.getByRole("link", { name: "Why our rye rests two days" })).toHaveAttribute(
				"href",
				"/journal/rye",
			);
		});
		await step("the plain entries keep their count, skipping the groups", async () => {
			await expect(menu.getByRole("link", { name: /Visit/ })).toHaveTextContent("01");
		});
	},
};

/** A group made only of a picture opens onto a link to where the picture leads. */
export const PictureOnlyGroup: Story = {
	args: { links: sectionedLinks },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const group = menu.getByRole("button", { name: "The bake" });
		await userEvent.click(group);
		await expect(group).toHaveAttribute("aria-expanded", "true");
		const link = menu.getByRole("link", { name: "Watch the morning bake" });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", "/bake");
	},
};

let consoleError: MockInstance<typeof console.error>;

/**
 * Links that share an address draw without a key clash: a child that is the
 * parent page itself ("Whole loaf"), two children on one page, and two links
 * in one column on one page.
 */
export const ChildSharesParentHref: Story = {
	args: {
		links: [
			{
				label: "Menu",
				href: "/menu",
				columns: [
					{
						heading: "Bread",
						links: [
							{
								label: "Country sourdough",
								href: "/menu/sourdough",
								children: [
									{ label: "Whole loaf", href: "/menu/sourdough" },
									{ label: "Half loaf", href: "/menu/sourdough/half" },
									{ label: "Half loaf, sliced", href: "/menu/sourdough/half" },
								],
							},
							{ label: "Sourdough, by the loaf", href: "/menu/sourdough" },
						],
					},
				],
			},
		],
	},
	beforeEach: () => {
		consoleError = spyOn(console, "error");
		return () => consoleError.mockRestore();
	},
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("button", { name: "Menu" }));
		await expect(menu.getByRole("link", { name: "Whole loaf" })).toBeVisible();
		const keyWarnings = consoleError.mock.calls.filter((call) =>
			String(call[0]).includes("same key"),
		);
		await expect(keyWarnings).toHaveLength(0);
	},
};

/**
 * A theme whose sheet is its primary (`--surface-dark` set to the brand's
 * deep green fill) sets `--menu-badge-bg` and `--menu-badge-ink`: a link's
 * badge takes a light fill and the primary's words, so it reads there,
 * where the default primary filled pill vanished. The accessibility check
 * holds its contrast.
 */
export const BadgeOnPrimarySheet: Story = {
	args: { links: sectionedLinks },
	decorators: [
		(Story) => (
			<div
				style={
					{
						// A deep green brand whose sheet is its primary, with the light
						// neutrals such a theme sets for words on it.
						"--surface-dark": "#1e4d2b",
						"--primary": "#1e4d2b",
						"--primary-fill": "#1e4d2b",
						"--primary-ink": "#1e4d2b",
						"--primary-bright": "#b8e0c0",
						"--neutral-300": "#dcd6ca",
						// The sheet's ground is the primary, so the badge and the call
						// to action take the light fill and the primary's words.
						"--menu-badge-bg": "var(--on-primary)",
						"--menu-badge-ink": "var(--primary-ink)",
						"--menu-cta-bg": "var(--on-primary)",
						"--menu-cta-ink": "var(--primary-ink)",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("button", { name: "Menu" }));
		const badge = menu.getByText("Popular");
		await expect(badge).toBeVisible();
		const sheet = canvas.getByRole("dialog");
		await expect(getComputedStyle(badge).backgroundColor).not.toBe(
			getComputedStyle(sheet).backgroundColor,
		);
	},
};

/**
 * The menu's call to action on the same primary sheet, with `--menu-cta-bg`
 * and `--menu-cta-ink` set: a light fill and the primary's words, so it
 * shows as a button there, where the default primary filled one vanished.
 * The accessibility check holds its contrast.
 */
export const CTAOnPrimarySheet: Story = {
	...BadgeOnPrimarySheet,
	args: { links: flatLinks, primaryCTA: cta },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const action = menu.getByRole("link", { name: cta.label });
		const sheet = canvas.getByRole("dialog");
		await expect(getComputedStyle(action).backgroundColor).not.toBe(
			getComputedStyle(sheet).backgroundColor,
		);
		await expect(getComputedStyle(action).color).toBe("rgb(30, 77, 43)");
	},
};

/**
 * The default, with no menu tokens set: the badge and the call to action
 * are the primary filled pill and button they were in 8.0.0.
 */
export const BadgeAndCTADefaults: Story = {
	args: { links: sectionedLinks, primaryCTA: cta },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const action = menu.getByRole("link", { name: cta.label });
		await expect(getComputedStyle(action).backgroundColor).toBe("rgb(214, 58, 16)");
		await expect(getComputedStyle(action).color).toBe("rgb(255, 255, 255)");
		await userEvent.click(menu.getByRole("button", { name: "Menu" }));
		const badge = menu.getByText("Popular");
		await expect(getComputedStyle(badge).backgroundColor).toBe("rgb(214, 58, 16)");
		await expect(getComputedStyle(badge).color).toBe("rgb(255, 255, 255)");
	},
};

/**
 * A light sheet's nav: a group with a linked heading, a badge, and nested
 * children; a group of towns set quiet; and a plain page.
 */
const lightLinks: NavLink[] = [
	sectionedLinks[0] as NavLink,
	{
		label: "Where we deliver",
		href: "/delivery",
		allLabel: "Every town we deliver to",
		columns: [
			{
				heading: "North of the river",
				links: [
					{ label: "Fairhaven", href: "/delivery/fairhaven", quiet: true },
					{ label: "Old Mill", href: "/delivery/old-mill", quiet: true },
				],
			},
			{
				heading: "South of the river",
				links: [{ label: "Riverside", href: "/delivery/riverside", quiet: true }],
			},
		],
	},
	{ label: "Visit", href: "/visit" },
];

/** The light sheet's arguments: the bakery's lockup, its two numbers, and the arrow. */
const light = {
	surface: "light" as const,
	brand,
	links: lightLinks,
	phones,
	primaryCTA: { ...cta, arrow: true, menuLabel: "Order ahead for Saturday" },
};

/**
 * The light sheet with every group closed: the lockup linking home and a
 * round close button across the top, the entries as rows under hairlines,
 * and the foot at the bottom of the screen on the alternate ground, the call
 * to action across it in its menu words and a card per number.
 */
export const Light: Story = {
	args: light,
	play: async ({ canvas, userEvent, step }) => {
		const dialog = await openMenu(canvas, userEvent);
		const menu = within(dialog);
		const close = menu.getByRole("button", { name: "Close menu" });
		const action = menu.getByRole("link", { name: /Order ahead for Saturday/ });
		const shop = menu.getByRole("link", { name: "The shop (555) 555-0142" });
		await step("the lockup links home, beside the close button, where focus starts", async () => {
			const home = menu.getByRole("link", { name: "Kestrel Hollow Bakehouse home" });
			await expect(home).toHaveAttribute("href", "/");
			const middle = (element: Element) => {
				const box = element.getBoundingClientRect();
				return box.top + box.height / 2;
			};
			await expect(Math.abs(middle(home) - middle(close))).toBeLessThan(4);
			await expect(close).toHaveFocus();
		});
		await step("every group starts closed, each a row with its chevron", async () => {
			for (const name of ["Menu", "Where we deliver"]) {
				await expect(menu.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
			}
			await expect(menu.getByRole("link", { name: "Visit" })).toHaveTextContent(/^Visit$/);
		});
		await step("the foot sits at the bottom of the screen, the action across it", async () => {
			const foot = action.parentElement as HTMLElement;
			// The sheet slides down as it opens, so the foot is measured once it lands.
			await waitFor(() =>
				expect(Math.round(foot.getBoundingClientRect().bottom)).toBe(window.innerHeight),
			);
			await expect(getComputedStyle(foot).backgroundColor).not.toBe(
				getComputedStyle(dialog).backgroundColor,
			);
			const width = action.getBoundingClientRect().width;
			await expect(Math.abs(width - shop.getBoundingClientRect().width)).toBeLessThan(1);
			await expect(action.getBoundingClientRect().bottom).toBeLessThanOrEqual(
				shop.getBoundingClientRect().top,
			);
		});
		await step("each number is a card that dials, named by its words and the number", async () => {
			await expect(shop).toHaveAttribute("href", "tel:+15555550142");
			await expect(menu.getByRole("link", { name: "Wholesale (555) 555-0143" })).toHaveAttribute(
				"href",
				"tel:+15555550143",
			);
		});
		await expectNoSidewaysScroll();
	},
};

/**
 * One group open on the light sheet: its label and chevron take the
 * primary's words, its link to the group's own page first, section headings
 * as small caps labels, a link's children indented under it with their
 * badges, and the quiet towns in the softer words and the regular weight.
 * The current page is underlined.
 */
export const LightGroupOpen: Story = {
	args: { ...light, currentPath: "/menu/sourdough/loaf" },
	play: async ({ canvas, userEvent, step }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const group = menu.getByRole("button", { name: "Menu" });
		const closedColor = getComputedStyle(group).color;
		await step("the group opens, its label taking the primary's words", async () => {
			await userEvent.click(group);
			await expect(group).toHaveAttribute("aria-expanded", "true");
			await expect(getComputedStyle(group).color).not.toBe(closedColor);
			await expect(menu.getByRole("link", { name: "The whole menu" })).toBeVisible();
		});
		await step(
			"children sit under their parent, badges kept, the current one underlined",
			async () => {
				const parent = menu.getByRole("link", { name: /Country sourdough\s*Popular/ });
				const child = menu.getByRole("link", { name: "Whole loaf" });
				await expect(textLeft(child)).toBeGreaterThan(textLeft(parent));
				await expect(menu.getByRole("link", { name: /Half loaf\s*New/ })).toBeVisible();
				await expect(child).toHaveAttribute("aria-current", "page");
				await expect(underlined(child)).toBe(true);
			},
		);
		await step("a quiet link reads lighter than a plain one", async () => {
			await userEvent.click(menu.getByRole("button", { name: "Where we deliver" }));
			const quiet = menu.getByRole("link", { name: "Fairhaven" });
			await expect(quiet).toBeVisible();
			const all = menu.getByRole("link", { name: "Every town we deliver to" });
			await expect(Number(getComputedStyle(quiet).fontWeight)).toBeLessThan(
				Number(getComputedStyle(all).fontWeight),
			);
		});
		await expectNoSidewaysScroll();
	},
};

/**
 * The light sheet behaves as the dark one does: the page behind it is out
 * of reach and holds still, Escape closes it and reports once, and focus
 * returns to the control that opened it.
 */
export const LightClosedByEscape: Story = {
	args: light,
	play: async ({ canvas, userEvent, args, step }) => {
		const opener = canvas.getByRole("button", { name: "Open the menu" });
		const dialog = (await openMenu(canvas, userEvent)) as HTMLDialogElement & {
			requestClose: () => void;
		};
		await step("the page behind is out of reach and holds still", async () => {
			opener.focus();
			await expect(opener).not.toHaveFocus();
			await expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
		});
		await step("Escape closes it, reports once, and focus returns", async () => {
			dialog.requestClose();
			await waitFor(() => expect(canvas.queryByRole("dialog")).toBeNull());
			await expect(args.onClose).toHaveBeenCalledOnce();
			await expect(opener).toHaveFocus();
			await expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
		});
	},
};

/** Following the lockup home, as any link, closes the light sheet. */
export const LightClosedByFollowingALink: Story = {
	args: light,
	play: async ({ canvas, userEvent, args }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("link", { name: "Kestrel Hollow Bakehouse home" }));
		await expect(canvas.queryByRole("dialog")).toBeNull();
		await expect(args.onClose).toHaveBeenCalledOnce();
	},
};

/**
 * With no header numbers the foot holds the contact block's one phone, its
 * card saying the neutral "Call", and the call to action in its own words
 * with no arrow when the site sets none.
 */
export const LightOnePhone: Story = {
	args: { ...light, phones: undefined, contact, primaryCTA: cta },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByRole("link", { name: "Call (555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
		await expect(menu.getByRole("link", { name: cta.label })).toBeVisible();
	},
};

/**
 * A theme with a dark primary (a deep plum) on the light sheet, a group
 * open: the open label, the group's own link, and the current page in the
 * primary's words on the page's ground, and the call to action on its fill,
 * each holding its contrast in the accessibility check. The theme sits on
 * its own `.atelic-ui` root, as a site's theme does.
 */
export const LightOnDarkPrimary: Story = {
	args: { ...light, currentPath: "/menu/rye" },
	decorators: [
		(Story) => (
			<div
				className="atelic-ui"
				style={
					{
						"--primary": "#4a2360",
						"--primary-fill": "#4a2360",
						"--primary-ink": "#4a2360",
						"--primary-deep": "#331747",
						"--primary-bright": "#d9b8ee",
					} as CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await userEvent.click(menu.getByRole("button", { name: "Menu" }));
		await expect(menu.getByRole("link", { name: "Seeded rye" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		const action = menu.getByRole("link", { name: /Order ahead for Saturday/ });
		await expect(getComputedStyle(action).backgroundColor).toBe("rgb(74, 35, 96)");
	},
};

/** The dark sheet's default: a number with no label says the neutral "CALL". */
export const DarkNumberWithoutALabel: Story = {
	args: { contact: { phone: contact.phone } },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByRole("link", { name: /^CALL\s+\(555\) 555-0142$/ })).toBeVisible();
	},
};

/**
 * A site with no header numbers whose line answers texts: the contact
 * block's phone carries its own menu words (`phone.menuLabel`), which the
 * dark sheet sets in its contact block.
 */
export const DarkContactPhoneMenuLabel: Story = {
	args: {
		phones: undefined,
		contact: { ...contact, phone: { ...phone, menuLabel: "Call / Text" } },
	},
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(
			menu.getByRole("link", { name: /^CALL \/ TEXT\s+\(555\) 555-0142$/ }),
		).toHaveAttribute("href", "tel:+15555550142");
	},
};

/** The same contact phone on the light sheet: its card says "Call / Text". */
export const LightContactPhoneMenuLabel: Story = {
	args: {
		...light,
		phones: undefined,
		contact: { ...contact, phone: { ...phone, menuLabel: "Call / Text" } },
	},
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByRole("link", { name: "Call / Text (555) 555-0142" })).toHaveAttribute(
			"href",
			"tel:+15555550142",
		);
	},
};

/** The menu's call to action and a number take their menu words on the dark sheet too. */
export const DarkMenuLabels: Story = {
	args: {
		primaryCTA: { ...cta, menuLabel: "Order ahead for Saturday" },
		phones: [{ e164: "+15555550142", display: "(555) 555-0142", menuLabel: "Call or text" }],
	},
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByRole("link", { name: "Order ahead for Saturday" })).toBeVisible();
		await expect(menu.getByRole("link", { name: /^CALL OR TEXT/ })).toBeVisible();
	},
};

/**
 * A band that restates the brand's primary around the menu (a plain element,
 * not a theme root) reaches the call to action on either sheet: the
 * defaults that name another token resolve where they are read, below the
 * band, as they did in 8.1.0.
 */
export const CTAInABandRestatingPrimary: Story = {
	args: { primaryCTA: cta },
	decorators: [
		(Story) => (
			<div style={{ "--primary": "#1e4d2b", "--primary-fill": "#1e4d2b" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(
			getComputedStyle(menu.getByRole("link", { name: cta.label })).backgroundColor,
		).toBe("rgb(30, 77, 43)");
	},
};

/** The same band around the light sheet. */
export const LightCTAInABandRestatingPrimary: Story = {
	...CTAInABandRestatingPrimary,
	args: { ...light, primaryCTA: cta },
};

/** `--menu-rule` sets the light sheet's row dividers, which default to `--hairline`. */
export const LightMenuRule: Story = {
	args: light,
	decorators: [
		(Story) => (
			<div style={{ "--menu-rule": "rgb(180, 160, 120)" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		const row = menu.getByRole("link", { name: "Visit" });
		await expect(getComputedStyle(row).borderBottomColor).toBe("rgb(180, 160, 120)");
	},
};
