import type { Meta, StoryObj } from "@storybook/react-vite";
import { type CSSProperties, useState } from "react";
import { expect, fn, type MockInstance, spyOn, waitFor, within } from "storybook/test";
import { SiteMenu } from "../../src/chrome";
import { contact, cta, flatLinks, groupedLinks, phones, sectionedLinks } from "../fixtures/bakery";
import { textLeft } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * The phone's full screen menu on a native modal `<dialog>`. The owner holds
 * the open state, so each story mounts it behind a button the way the
 * header's burger does.
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
			await expect(menu.getByRole("link", { name: /CALL \/ TEXT/ })).toHaveAttribute(
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

/** The current page's link is marked for a screen reader. */
export const CurrentPage: Story = {
	args: { currentPath: "/cakes" },
	play: async ({ canvas, userEvent }) => {
		const menu = within(await openMenu(canvas, userEvent));
		await expect(menu.getByRole("link", { name: /Cakes/ })).toHaveAttribute("aria-current", "page");
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
 * deep green fill): a link's badge carries its own light fill and the primary's words,
 * so it reads there, where a primary filled pill vanished. The
 * accessibility check holds its contrast.
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
 * The menu's call to action on the same primary sheet: its own light fill
 * and the primary's words, as the badge, so it shows as a button there,
 * where a primary filled one vanished. The accessibility check holds its
 * contrast.
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
