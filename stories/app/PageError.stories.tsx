import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PageError } from "../../src/app";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A page's error state: a card with an alert icon, a title, and the message.
 * The title is the kit's destructive red on the card, which fails contrast
 * (stories/findings/email-app.md), so every story carries the marker.
 */
const meta = {
	title: "App/PageError",
	component: PageError,
	tags: ["known-issue"],
	parameters: { layout: "padded", ...knownIssues("app-destructive-contrast") },
	args: { message: "The wholesale orders did not load. Check the connection and reload." },
	globals: pin("desktop"),
} satisfies Meta<typeof PageError>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default title, Error. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Error")).toBeVisible();
		await expect(canvas.getByText(/did not load/)).toBeVisible();
	},
};

/** A title of the page's own. */
export const OwnTitle: Story = {
	args: { title: "Orders unavailable" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Orders unavailable")).toBeVisible();
	},
};

/**
 * Nothing announces it: the card is not an alert or a status, so a reader
 * who triggered the load hears nothing when it fails.
 */
export const NotAnnounced: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("alert")).toBeNull();
		await expect(canvas.queryByRole("status")).toBeNull();
	},
};

/** The longest realistic message wraps on a phone. */
export const LongMessagePhone: Story = {
	args: {
		title: "The standing orders for the Alder Street Reading Room did not load",
		message:
			"The api answered 503 three times in a row while fetching the cafe's standing orders. Nothing was changed; reload in a minute, and if it keeps happening the ops runner's log has the detail.",
	},
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
