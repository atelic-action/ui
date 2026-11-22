import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { AppPage, SectionCards } from "../../src/app";
import { pin } from "../support/viewports";

/**
 * A section's sub pages as cards on its landing page, read from the app's
 * nav, so the rail, the menu sheet, and the landing page agree. The fixture
 * app's Orders section has two pages and Bakes one; Home has none.
 */
const meta = {
	title: "App/SectionCards",
	component: SectionCards,
	parameters: { app: { path: "/orders" } },
	render: (args) => (
		<AppPage title="Orders" subtitle="Everything due out, and who it goes to.">
			<SectionCards {...args} />
		</AppPage>
	),
	args: { section: "/orders" },
	globals: pin("desktop"),
} satisfies Meta<typeof SectionCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each page a card: its icon, its name, its one line blurb, linked. */
export const Orders: Story = {
	play: async ({ canvas }) => {
		const nav = within(canvas.getByRole("navigation", { name: "Orders pages" }));
		const links = nav.getAllByRole("link");
		await expect(links).toHaveLength(2);
		await expect(nav.getByRole("link", { name: /Wholesale/ })).toHaveAttribute(
			"href",
			"/orders/wholesale",
		);
		await expect(nav.getByText("The cafes on a standing order.")).toBeVisible();
		// Side by side on a desktop.
		await expect(Math.round(links[0].getBoundingClientRect().top)).toBe(
			Math.round(links[1].getBoundingClientRect().top),
		);
	},
};

/** A section with one page. */
export const OnePage: Story = {
	parameters: { app: { path: "/bakes" } },
	args: { section: "/bakes" },
	play: async ({ canvas }) => {
		await expect(
			within(canvas.getByRole("navigation", { name: "Bakes pages" })).getAllByRole("link"),
		).toHaveLength(1);
	},
};

/** A section without pages, or one the nav does not hold, renders nothing. */
export const NoPages: Story = {
	args: { section: "/" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("navigation")).toBeNull();
	},
};

export const UnknownSection: Story = {
	args: { section: "/invoices" },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("navigation")).toBeNull();
	},
};

/** On a phone two cards share a row, each inside its half, as tap targets. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const links = within(canvas.getByRole("navigation", { name: "Orders pages" })).getAllByRole(
			"link",
		);
		await expect(Math.round(links[0].getBoundingClientRect().top)).toBe(
			Math.round(links[1].getBoundingClientRect().top),
		);
		await expect(links[0].getBoundingClientRect().right).toBeLessThanOrEqual(
			links[1].getBoundingClientRect().left,
		);
		await expect(links[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
