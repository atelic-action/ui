import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLocation } from "@tanstack/react-router";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { AppLayout, AppPage, useAuthStore } from "../../src/app";
import { longNameUser, signIn, signOut } from "../fixtures/email-app";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/** Where the memory router is, printed on the page so a story can read it. */
function Where() {
	const pathname = useLocation({ select: (location) => location.pathname });
	return <p>Router at {pathname}</p>;
}

function WholesalePage() {
	return (
		<AppPage title="Wholesale" subtitle="The cafes on a standing order, by delivery time.">
			<p>Eleven cafes and two grocers, delivered before they open.</p>
			<Where />
		</AppPage>
	);
}

/** Everything inside the dialog the menu sheet opens, tabbing never leaves it. */
async function tabStaysInside(dialog: HTMLElement, presses: number) {
	for (let i = 0; i < presses; i += 1) {
		await userEvent.tab();
		await expect(dialog.contains(document.activeElement)).toBe(true);
	}
}

/**
 * Every story with the rail open: the user menu's trigger shows the user's
 * name but is named "User menu" (stories/findings/email-app.md).
 */
const onTheRail = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("user-menu-name-mismatch") },
};

/**
 * The app shell around every signed in page. At `lg` and up it is the
 * navigation rail on the left with the user menu at its foot; below that a
 * slim top bar with the hamburger menu sheet over the page, and the section
 * tab bar pinned to the bottom. Signed out, a public page gets the brand bar
 * with a sign in link and any other page renders bare.
 */
const meta = {
	title: "App/AppLayout",
	component: AppLayout,
	parameters: { app: { path: "/orders/wholesale" } },
	args: { children: <WholesalePage /> },
	beforeEach: signIn(),
	globals: pin("desktop"),
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a desktop the rail holds the sections, the current section's pages nested under it. */
export const DesktopRail: Story = {
	...onTheRail,
	play: async ({ canvas }) => {
		const rail = within(canvas.getByRole("complementary", { name: "Main navigation" }));
		const primary = within(rail.getByRole("navigation", { name: "Primary navigation" }));
		await expect(primary.getByRole("link", { name: "Orders" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(primary.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
		const pages = within(primary.getByRole("list", { name: "Orders pages" }));
		await expect(pages.getByRole("link", { name: "Wholesale" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		// Only the current section unfolds its pages.
		await expect(primary.queryByRole("list", { name: "Bakes pages" })).toBeNull();
		// No phone chrome at this width.
		await expect(canvas.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
		await expect(canvas.queryByRole("button", { name: "Open menu" })).not.toBeInTheDocument();
		// The page sits beside the rail, never under it.
		const title = canvas.getByRole("heading", { level: 1, name: "Wholesale" });
		const railBox = canvas.getByRole("complementary", { name: "Main navigation" });
		await expect(title.getBoundingClientRect().left).toBeGreaterThanOrEqual(
			railBox.getBoundingClientRect().right,
		);
	},
};

/** The rail collapses to icons and back; the page moves with it and the choice is kept. */
export const CollapseTheRail: Story = {
	...onTheRail,
	play: async ({ canvas, userEvent, step }) => {
		const rail = canvas.getByRole("complementary", { name: "Main navigation" });
		const wide = rail.getBoundingClientRect().width;
		await step("collapse narrows the rail and folds the sub pages away", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Collapse sidebar" }));
			await waitFor(() => expect(rail.getBoundingClientRect().width).toBeLessThan(wide));
			await expect(canvas.queryByRole("list", { name: "Orders pages" })).toBeNull();
			await expect(canvas.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
		});
		await step("a collapsed link keeps its name, and shows it in a tooltip on focus", async () => {
			await knownBug("collapsed-rail-links-unnamed", async () => {
				await expect(canvas.getByRole("link", { name: "Orders" })).toBeVisible();
			});
			// Nameless while collapsed, so it is reached by where it goes.
			const orders = canvas.getAllByRole("link").find((a) => a.getAttribute("href") === "/orders");
			orders?.focus();
			await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Orders"));
		});
		await step("expand brings the rail and its pages back", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Expand sidebar" }));
			await waitFor(() => expect(rail.getBoundingClientRect().width).toBe(wide));
			await expect(canvas.getByRole("list", { name: "Orders pages" })).toBeVisible();
		});
	},
};

/**
 * A rail the user left collapsed comes back collapsed: icons alone, the
 * avatar for the user menu. Its links have no accessible name, since the
 * label is dropped and the tooltip only describes.
 */
export const CollapsedRail: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("collapsed-rail-links-unnamed", "user-menu-name-mismatch") },
	beforeEach: () => {
		localStorage.setItem("storybook-crumb-sidebarCollapsed", "true");
	},
	play: async ({ canvas }) => {
		const rail = canvas.getByRole("complementary", { name: "Main navigation" });
		await waitFor(() => expect(rail.getBoundingClientRect().width).toBe(80));
		await expect(canvas.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
		await expect(canvas.getByRole("button", { name: "User menu" })).not.toHaveTextContent(
			"Wren Okafor",
		);
		await knownBug("collapsed-rail-links-unnamed", async () => {
			await expect(within(rail).getByRole("link", { name: "Bakes" })).toBeVisible();
		});
	},
};

/** The user menu at the rail's foot opens by click, closes on Escape, and hands focus back. */
export const UserMenuByClick: Story = {
	...onTheRail,
	play: async ({ canvas, userEvent, step }) => {
		const trigger = canvas.getByRole("button", { name: "User menu" });
		await step("the trigger shows the user's name and starts closed", async () => {
			await expect(trigger).toHaveTextContent("Wren Okafor");
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
		});
		await step("a click opens the menu with Profile and Log out", async () => {
			await userEvent.click(trigger);
			const menu = within(await screen.findByRole("menu"));
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			await expect(menu.getByRole("menuitem", { name: "Profile" })).toHaveAttribute(
				"href",
				"/profile",
			);
			await waitFor(() => expect(menu.getByRole("menuitem", { name: "Log out" })).toBeVisible());
		});
		await step("Escape closes it and focus returns to the trigger", async () => {
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
			await expect(trigger).toHaveFocus();
		});
	},
};

/** The user menu left open, so the check reads the open menu (the trigger is hidden behind it). */
export const UserMenuOpen: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast", "checker-radix-hides-page") },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "User menu" }));
		const logOut = await screen.findByRole("menuitem", { name: "Log out" });
		await waitFor(() => expect(logOut).toBeVisible());
	},
};

/** The keyboard path: Enter opens with the first item focused, the arrows move, and Log out signs out. */
export const UserMenuByKeyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const trigger = canvas.getByRole("button", { name: "User menu" });
		await step("Enter opens the menu on its first item", async () => {
			trigger.focus();
			await userEvent.keyboard("{Enter}");
			const menu = within(await screen.findByRole("menu"));
			await waitFor(() => expect(menu.getByRole("menuitem", { name: "Profile" })).toHaveFocus());
		});
		await step("ArrowDown reaches Log out", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(screen.getByRole("menuitem", { name: "Log out" })).toHaveFocus();
		});
		await step("Enter on Log out signs out and goes home", async () => {
			await userEvent.keyboard("{Enter}");
			await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
			await waitFor(() => expect(canvas.getByText("Router at /")).toBeVisible());
			await expect(canvas.queryByRole("complementary", { name: "Main navigation" })).toBeNull();
		});
	},
};

/** The longest realistic name truncates inside the rail rather than widening it. */
export const LongUserName: Story = {
	...onTheRail,
	beforeEach: signIn(longNameUser),
	play: async ({ canvas }) => {
		const rail = canvas.getByRole("complementary", { name: "Main navigation" });
		const trigger = canvas.getByRole("button", { name: "User menu" });
		await expect(trigger).toHaveTextContent("Maximiliana Featherstonehaugh-Abernathy");
		await expect(trigger.getBoundingClientRect().right).toBeLessThanOrEqual(
			rail.getBoundingClientRect().right,
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** On a phone: the top bar with the menu button, the tab bar at the foot, and no rail. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Crumb & Co. home" })).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Open menu" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		const tabs = within(canvas.getByRole("navigation", { name: "Mobile navigation" }));
		await expect(tabs.getAllByRole("link")).toHaveLength(3);
		await expect(tabs.getByRole("link", { name: "Orders" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		await expect(canvas.queryByRole("complementary", { name: "Main navigation" })).toBeNull();
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		// The tab bar is pinned to the bottom of the screen.
		const bar = canvas.getByRole("navigation", { name: "Mobile navigation" });
		await expect(Math.round(bar.getBoundingClientRect().bottom)).toBe(window.innerHeight);
	},
};

/** The menu sheet: open, focus trapped inside, Escape, focus back on the button. */
export const MobileMenuEscape: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent, step }) => {
		const button = canvas.getByRole("button", { name: "Open menu" });
		let sheet!: HTMLElement;
		await step("the button opens the sheet, named and described", async () => {
			await userEvent.click(button);
			sheet = await screen.findByRole("dialog", { name: "Menu" });
			await expect(sheet).toHaveAccessibleDescription("Every page in the app, and your account.");
			await expect(button).toHaveAttribute("aria-expanded", "true");
			await expect(sheet.contains(document.activeElement)).toBe(true);
		});
		await step("the sheet holds every section and page, the current one marked", async () => {
			const nav = within(within(sheet).getByRole("navigation", { name: "Menu" }));
			await expect(nav.getByRole("link", { name: "Bakes" })).toBeVisible();
			await expect(nav.getByRole("link", { name: "Recipes" })).toBeVisible();
			await expect(nav.getByRole("link", { name: "Wholesale" })).toHaveAttribute(
				"aria-current",
				"page",
			);
			await expect(within(sheet).getByRole("link", { name: /Wren Okafor/ })).toHaveAttribute(
				"href",
				"/profile",
			);
		});
		await step("Tab never leaves the sheet", async () => {
			await tabStaysInside(sheet, 14);
		});
		await step("Escape closes it and focus returns to the menu button", async () => {
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 4000 });
			await expect(button).toHaveAttribute("aria-expanded", "false");
			await expect(button).toHaveFocus();
		});
	},
};

/** The sheet left open, so the check reads the open sheet. */
export const MobileMenuOpen: Story = {
	globals: pin("phone"),
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast") },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const sheet = await screen.findByRole("dialog", { name: "Menu" });
		const logOut = within(sheet).getByRole("button", { name: "Log out" });
		await waitFor(() => expect(logOut).toBeVisible());
	},
};

/** The sheet's own close button closes it too. */
export const MobileMenuCloseButton: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "Open menu" });
		await userEvent.click(button);
		const sheet = await screen.findByRole("dialog", { name: "Menu" });
		await userEvent.click(within(sheet).getByRole("button", { name: "Close" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 4000 });
		await expect(button).toHaveFocus();
	},
};

/** Following a link in the sheet navigates and closes it. */
export const MobileMenuFollowsALink: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const sheet = await screen.findByRole("dialog", { name: "Menu" });
		await userEvent.click(within(sheet).getByRole("link", { name: "Recipes" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 4000 });
	},
};

/** Log out at the sheet's foot signs out and goes home. */
export const MobileMenuLogOut: Story = {
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
		const sheet = await screen.findByRole("dialog", { name: "Menu" });
		await userEvent.click(within(sheet).getByRole("button", { name: "Log out" }));
		await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
		await waitFor(() => expect(canvas.getByText("Router at /")).toBeVisible());
		await expect(screen.queryByRole("dialog")).toBeNull();
	},
};

/** A tablet is below `lg`, so it gets the phone's shell. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Open menu" })).toBeVisible();
		await expect(canvas.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
	},
};

/** Signed out on a public page: the brand bar with a sign in link, and no app chrome. */
export const SignedOutPublicPage: Story = {
	parameters: { app: { path: "/u/wren" } },
	beforeEach: signOut,
	args: {
		children: (
			<div className="p-6">
				<h1 className="text-2xl font-semibold">Wren's country loaf</h1>
				<Where />
			</div>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Crumb & Co. home" })).toBeVisible();
		await expect(canvas.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/");
		await expect(canvas.queryByRole("complementary", { name: "Main navigation" })).toBeNull();
		await expect(canvas.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
	},
};

/** Signed out anywhere else, the page renders bare: the auth page draws its own frame. */
export const SignedOutBare: Story = {
	parameters: { app: { path: "/" } },
	beforeEach: signOut,
	args: {
		children: (
			<main className="p-6">
				<h1 className="text-2xl font-semibold">Sign in to Crumb &amp; Co.</h1>
			</main>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "Sign in to Crumb & Co." })).toBeVisible();
		await expect(canvas.queryByRole("link", { name: "Sign in" })).toBeNull();
		await expect(canvas.queryByRole("link", { name: "Crumb & Co. home" })).toBeNull();
	},
};
