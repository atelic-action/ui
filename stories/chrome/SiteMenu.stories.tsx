import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { SiteMenu } from "../../src/chrome";
import { contact, cta, flatLinks, groupedLinks, phones } from "../fixtures/bakery";
import { knownIssues } from "../support/known-issues";
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
	tags: ["known-issue"],
	parameters: { ...knownIssues("white-on-primary") },
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
