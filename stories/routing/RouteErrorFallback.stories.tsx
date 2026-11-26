import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { RouteErrorFallback } from "../../src/routing";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Is the page a router shows when a route crashes, in place of a blank screen.
 * The router's error page (`routerErrorOptions`' `defaultErrorComponent`): the
 * package's dependency free `ErrorFallback`, drawn where a route's boundary
 * caught a crash. Try Again reloads the page, since a loader's error stays on
 * the router's match and resetting the boundary would throw it again. A router
 * never passes `reload`; the stories do, to see it called.
 */
const meta = {
	title: "Routing/RouteErrorFallback",
	component: RouteErrorFallback,
	args: {
		error: new Error("The oven timer came back undefined"),
		reset: fn(),
		reload: fn(),
	},
} satisfies Meta<typeof RouteErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page, and Try Again reloading rather than resetting the boundary. */
export const TryAgainReloads: Story = {
	play: async ({ canvas, userEvent, args, step }) => {
		await step("the page says what happened", async () => {
			await expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
		});
		await step("Try Again reloads the page, once, and never resets the boundary", async () => {
			const again = canvas.getByRole("button", { name: "Try Again" });
			await userEvent.click(again);
			await expect(args.reload).toHaveBeenCalledOnce();
			await expect(args.reset).not.toHaveBeenCalled();
		});
	},
};

/** A thrown value that is not an Error still draws the page, keyboard reachable. */
export const NotAnError: Story = {
	args: { error: "a string thrown by a loader" },
	play: async ({ canvas, userEvent, args }) => {
		await userEvent.tab();
		const again = canvas.getByRole("button", { name: "Try Again" });
		while (document.activeElement !== again) await userEvent.tab();
		await expect(again).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(args.reload).toHaveBeenCalledOnce();
	},
};

/** A long message on a phone wraps inside the page, never sideways. */
export const LongMessagePhone: Story = {
	args: {
		error: new Error(
			"A loader failed: https://kestrelhollow.example.com/api/menu/seasonal-tarts-and-the-long-list-of-everything-baked-this-week",
		),
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
		await expectNoSidewaysScroll();
	},
};
