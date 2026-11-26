import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { AppPage, Breadcrumbs } from "../../src/app";
import { pin } from "../support/viewports";

/**
 * Shows where an app page sits among its sections and lets the reader step
 * back up. The app shell's breadcrumb trail. An `App/` story runs inside the
 * fixture app's `AppProvider` under a memory router, with the shell's Tailwind
 * sheet mounted (`.storybook/decorators.tsx`); that the two renderings swap at
 * the `lg` step proves the sheet is there.
 */
const meta = {
	title: "App/Breadcrumbs",
	component: Breadcrumbs,
	parameters: { layout: "padded", app: { path: "/orders/wholesale" } },
	args: {
		items: [{ label: "Orders", to: "/orders" }, { label: "Wholesale" }],
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** At `lg` and up the whole trail runs, the current page last and unlinked. */
export const Trail: Story = {
	play: async ({ canvas }) => {
		const nav = within(canvas.getByRole("navigation", { name: "Breadcrumb" }));
		await expect(nav.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/orders");
		await expect(nav.getByText("Wholesale")).toHaveAttribute("aria-current", "page");
		await expect(nav.queryByRole("link", { name: "Back to Orders" })).toBeNull();
	},
};

/** Below `lg` a trail with a parent collapses to one thumb sized back link. */
export const BackLinkPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const nav = within(canvas.getByRole("navigation", { name: "Breadcrumb" }));
		const back = nav.getByRole("link", { name: "Back to Orders" });
		await expect(back).toHaveAttribute("href", "/orders");
		await expect(back.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
		await expect(nav.getByText("Wholesale")).not.toBeVisible();
	},
};

/** A root page's single self crumb shows nothing on a phone, its title being the section. */
export const RootPhone: Story = {
	args: { items: [{ label: "Orders" }] },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const nav = within(canvas.getByRole("navigation", { name: "Breadcrumb" }));
		await expect(nav.queryByRole("link")).toBeNull();
		await expect(nav.getByText("Orders")).not.toBeVisible();
	},
};

/** A three deep trail backs up to the nearest linked ancestor. */
export const DeepTrailPhone: Story = {
	args: {
		items: [
			{ label: "Bakes", to: "/bakes" },
			{ label: "Recipes", to: "/bakes/recipes" },
			{ label: "Country sourdough" },
		],
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Back to Recipes" })).toHaveAttribute(
			"href",
			"/bakes/recipes",
		);
	},
};

/** In its slot on `AppPage`, over the title. */
export const OnAPage: Story = {
	render: (args) => (
		<AppPage
			crumb={<Breadcrumbs {...args} />}
			title="Wholesale"
			subtitle="The cafes on a standing order, by delivery time."
		>
			<p>Eleven cafes and two grocers, delivered before they open.</p>
		</AppPage>
	),
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 1, name: "Wholesale" });
		const trail = canvas.getByRole("navigation", { name: "Breadcrumb" });
		await expect(trail.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			title.getBoundingClientRect().top,
		);
	},
};
