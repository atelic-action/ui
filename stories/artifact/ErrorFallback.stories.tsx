import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ErrorFallback } from "../../src/artifact";
import { longURL } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Tells a document's reader that something broke, using no stylesheet, so it
 * still appears when the styles are what failed. The screen a crash leaves:
 * deliberately dependency free, inline styled, so it renders even when the
 * styles are what broke. The error's message shows in a development build
 * only.
 */
const meta = {
	title: "Artifact/ErrorFallback",
	component: ErrorFallback,
	args: { error: new Error("The oven timer came back undefined"), resetError: fn() },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The headline, the line under it, and Try Again, which calls the reset. */
export const Default: Story = {
	play: async ({ canvas, userEvent, args }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Something went wrong",
		);
		const message = canvas.queryByText("The oven timer came back undefined");
		if (import.meta.env.DEV) await expect(message).toBeVisible();
		else await expect(message).toBeNull();
		await userEvent.click(canvas.getByRole("button", { name: "Try Again" }));
		await expect(args.resetError).toHaveBeenCalledOnce();
	},
};

/** A thrown value that is not an Error reads as an unknown error. */
export const NotAnError: Story = {
	args: { error: "a string, thrown" },
	play: async ({ canvas }) => {
		if (import.meta.env.DEV) await expect(canvas.getByText("Unknown error")).toBeVisible();
		await expect(canvas.queryByText("a string, thrown")).toBeNull();
	},
};

/**
 * The longest message, an address in it, on a phone. In a development build,
 * where the message shows, its words wrap to the box and the page stays
 * still; the box scrolls when the message is long, and a keyboard can reach
 * it to scroll it.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		error: new Error(
			`Failed to fetch dynamically imported module: ${longURL}/assets/the-read-section-chunk.js`,
		),
	},
	play: async ({ canvasElement, userEvent, step }) => {
		await step("the page stays still", async () => {
			await expectNoSidewaysScroll();
		});
		// Production hides the message, so the rest is a development build's.
		if (!import.meta.env.DEV) return;
		await step("the message wraps to its box and a keyboard reaches it", async () => {
			// Inline styled with no class and no role: the screen's one pre.
			const box = canvasElement.querySelector("pre") as HTMLElement;
			await expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
			await userEvent.tab();
			await expect(box).toHaveFocus();
		});
	},
};

/**
 * A message long enough to scroll its box: the box takes focus, so a
 * keyboard can scroll what it cannot see, and the accessibility check of a
 * scrolling region passes on it.
 */
export const ScrollingMessage: Story = {
	globals: pin("phone"),
	args: {
		error: new Error(
			Array.from({ length: 24 }, (_, i) => `at render (chunk-${i + 1}.js:${i + 10}:4)`).join("\n"),
		),
	},
	play: async ({ canvasElement }) => {
		if (!import.meta.env.DEV) return;
		const box = canvasElement.querySelector("pre") as HTMLElement;
		await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
		await expect(box).toHaveAttribute("tabindex", "0");
	},
};
