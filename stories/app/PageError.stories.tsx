import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { PageError } from "../../src/app";
import { Button } from "../../src/app/ui";
import { expectNoSidewaysScroll } from "../support/geometry";
import { layerOpened } from "../support/settle";
import { pin } from "../support/viewports";

/**
 * Takes the place of a page's content, as an alert, when its data could not
 * load. A page's error state: a card with an alert icon, a title in the kit's
 * destructive red, and the message. It is an alert, so a screen reader
 * announces it once as it appears; a page renders it when the error happens.
 */
const meta = {
	title: "App/PageError",
	component: PageError,
	parameters: { layout: "padded" },
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

/** The card is an alert holding its title and message. */
export const IsAnAlert: Story = {
	play: async ({ canvas }) => {
		const alert = canvas.getByRole("alert");
		await expect(alert).toHaveTextContent("Error");
		await expect(alert).toHaveTextContent(/did not load/);
	},
};

/** A page that loads, and fails: nothing is announced while it loads, then the error once. */
function LoadingPage() {
	const [failed, setFailed] = useState(false);
	return (
		<div>
			<Button onClick={() => setFailed(true)}>Load the orders</Button>
			{failed ? <PageError title="Orders unavailable" message="The api answered 503." /> : null}
		</div>
	);
}

/** The alert appears with the error, the way a reader who started the load hears that it failed. */
export const AnnouncedWhenItAppears: Story = {
	render: () => <LoadingPage />,
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.queryByRole("alert")).toBeNull();
		await userEvent.click(canvas.getByRole("button", { name: "Load the orders" }));
		const alert = await layerOpened(() => canvas.getByRole("alert"));
		await expect(alert).toHaveTextContent("Orders unavailable");
		await expect(canvas.getAllByRole("alert")).toHaveLength(1);
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
		await expectNoSidewaysScroll();
	},
};

/**
 * The app's dark theme (`.dark` on the document): the title's destructive
 * words read the dark theme's own destructive ink on the dark card, where
 * the fill's deep red read 1.79 to 1, and a destructive button keeps the
 * deep fill under light words.
 */
export const DarkTheme: Story = {
	args: { title: "Orders unavailable" },
	beforeEach: () => {
		document.documentElement.classList.add("dark");
		return () => document.documentElement.classList.remove("dark");
	},
	render: (args) => (
		<div className="space-y-4 bg-background p-6 text-foreground">
			<PageError {...args} />
			<Button variant="destructive">Cancel the standing order</Button>
		</div>
	),
	play: async ({ canvas }) => {
		const title = canvas.getByText("Orders unavailable");
		const button = canvas.getByRole("button", { name: "Cancel the standing order" });
		// The words and the fill are two reds: light ink on the card, a deep fill under the button.
		await expect(getComputedStyle(title).color).not.toBe(getComputedStyle(button).backgroundColor);
	},
};
