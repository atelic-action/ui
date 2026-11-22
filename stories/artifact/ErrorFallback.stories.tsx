import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ErrorFallback } from "../../src/artifact";
import { longURL } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../primitives/support";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The screen a crash leaves: deliberately dependency free, inline styled, so
 * it renders even when the styles are what broke. The error's message shows
 * in a development build only.
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
 * The longest message, an address in it, on a phone. The message box should
 * scroll inside itself with the page still; in a development build, where
 * the message shows, the page scrolls sideways instead
 * (stories/findings/primitives.md, `error-fallback-phone-overflow`). The box
 * scrolls, but a keyboard cannot reach it (`error-fallback-message-unfocusable`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("error-fallback-message-unfocusable") },
	globals: pin("phone"),
	args: {
		error: new Error(
			`Failed to fetch dynamically imported module: ${longURL}/assets/the-read-section-chunk.js`,
		),
	},
	play: async () => {
		if (import.meta.env.DEV)
			await knownBug("error-fallback-phone-overflow", expectNoSidewaysScroll);
		else await expectNoSidewaysScroll();
	},
};
