import type { Meta, StoryObj } from "@storybook/react-vite";
import { Croissant } from "lucide-react";
import { expect, within } from "storybook/test";
import { AppPage, AppPageToolbar, Breadcrumbs } from "../../src/app";
import { Badge } from "../../src/app/ui";
import { cleanStorage } from "../fixtures/email-app";
import { expectNoSidewaysScroll } from "../support/geometry";
import { until } from "../support/settle";
import { pin } from "../support/viewports";

function Orders() {
	return (
		<ul className="space-y-2 px-6 lg:px-9">
			<li>Larkspur Coffee Bar, 06:15, four trays</li>
			<li>Fairhaven Grocery Cooperative, 07:00, two trays</li>
			<li>Wicket Lane Deli, 07:30, one tray</li>
		</ul>
	);
}

function Rail() {
	return (
		<section aria-label="Today at a glance" className="space-y-2">
			<h2 className="text-sm font-medium">Today at a glance</h2>
			<p className="text-sm">13 orders out, 2 still proofing.</p>
		</section>
	);
}

/**
 * Gives a signed in page its header, content, and optional side rail, so every
 * page of an app is laid out alike. The scaffold every signed in page renders
 * through: the header (crumb, aside, icon, title, live dot, subtitle), an
 * optional summary, the toolbar slot, the content, a footer, and an optional
 * right rail. On a desktop the rail is a full height column beside the page
 * with a toggle to collapse it; on a phone it stacks under the header and the
 * toggle is gone.
 */
const meta = {
	title: "App/AppPage",
	component: AppPage,
	args: { title: "Orders", children: <Orders /> },
	// The rail's collapse is saved; no story starts from another's or leaves its own.
	beforeEach: cleanStorage,
	globals: pin("desktop"),
} satisfies Meta<typeof AppPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A title and the content, nothing else. */
export const TitleOnly: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
		await expect(canvas.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
		await expect(canvas.queryByRole("button", { name: /rail/ })).toBeNull();
	},
};

/** Every header slot filled: the crumb with an aside opposite it, an icon, the live dot, a subtitle. */
export const FullHeader: Story = {
	args: {
		crumb: <Breadcrumbs items={[{ label: "Orders", to: "/orders" }, { label: "Today" }]} />,
		aside: <Badge variant="secondary">Synced 06:02</Badge>,
		icon: <Croissant size={28} aria-hidden="true" />,
		live: true,
		subtitle: "Every order due out today, by drop time.",
	},
	play: async ({ canvas }) => {
		const crumb = canvas.getByRole("navigation", { name: "Breadcrumb" });
		const aside = canvas.getByText("Synced 06:02");
		const title = canvas.getByRole("heading", { level: 1, name: "Orders" });
		await expect(
			Math.abs(aside.getBoundingClientRect().top - crumb.getBoundingClientRect().top),
		).toBeLessThan(12);
		await expect(aside.getBoundingClientRect().left).toBeGreaterThan(
			crumb.getBoundingClientRect().left,
		);
		await expect(crumb.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			title.getBoundingClientRect().top,
		);
		await expect(
			canvas.getByText("Every order due out today, by drop time.").getBoundingClientRect().top,
		).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
	},
};

/** The summary, toolbar, content, and footer in their order down the page. */
export const SummaryToolbarAndFooter: Story = {
	args: {
		subtitle: "Every order due out today.",
		summary: <p className="px-6 pt-4 lg:px-9">13 orders, 41 trays, first drop 06:15.</p>,
		toolbar: (
			<AppPageToolbar search={{ value: "", onChange: () => {}, placeholder: "Search orders" }} />
		),
		footer: <p className="px-6 pt-6 lg:px-9">Orders close at 20:00 the night before.</p>,
	},
	play: async ({ canvas }) => {
		const order = [
			canvas.getByText("13 orders, 41 trays, first drop 06:15."),
			canvas.getByRole("searchbox", { name: "Search orders" }),
			canvas.getByText(/Larkspur Coffee Bar/),
			canvas.getByText("Orders close at 20:00 the night before."),
		].map((element) => element.getBoundingClientRect().top);
		await expect([...order].sort((a, b) => a - b)).toEqual(order);
	},
};

/** On a desktop the rail is a column beside the page, with a toggle in the header. */
export const WithRail: Story = {
	args: { rail: <Rail />, subtitle: "Every order due out today." },
	play: async ({ canvas, userEvent, step }) => {
		const toggle = canvas.getByRole("button", { name: "Collapse rail" });
		const rail = canvas.getByRole("complementary");
		const title = canvas.getByRole("heading", { level: 1, name: "Orders" });
		await step("the rail sits to the right of the page, open", async () => {
			await expect(toggle).toHaveAttribute("aria-expanded", "true");
			await expect(toggle).toHaveAttribute("aria-controls", rail.id);
			await expect(rail.getBoundingClientRect().left).toBeGreaterThan(
				title.getBoundingClientRect().right,
			);
			await expect(within(rail).getByText("13 orders out, 2 still proofing.")).toBeVisible();
		});
		await step("the toggle collapses it and says so", async () => {
			await userEvent.click(toggle);
			await expect(toggle).toHaveAccessibleName("Expand rail");
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
			await until(() => expect(rail).not.toBeVisible());
		});
		await step("and expands it again, by the keyboard", async () => {
			toggle.focus();
			await userEvent.keyboard("{Enter}");
			await expect(toggle).toHaveAccessibleName("Collapse rail");
			await until(() =>
				expect(within(rail).getByText("13 orders out, 2 still proofing.")).toBeVisible(),
			);
		});
	},
};

/** On a phone the rail stacks under the header and there is no toggle. */
export const WithRailPhone: Story = {
	args: { rail: <Rail />, subtitle: "Every order due out today." },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("button", { name: "Collapse rail" })).toBeNull();
		const glance = canvas.getByRole("region", { name: "Today at a glance" });
		const title = canvas.getByRole("heading", { level: 1, name: "Orders" });
		await expect(glance.getBoundingClientRect().top).toBeGreaterThan(
			title.getBoundingClientRect().bottom,
		);
		await expect(glance.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			canvas.getByText(/Larkspur Coffee Bar/).getBoundingClientRect().top,
		);
		await expectNoSidewaysScroll();
	},
};

/** The longest realistic title and subtitle wrap on a phone and never scroll sideways. */
export const LongestContentPhone: Story = {
	args: {
		crumb: (
			<Breadcrumbs
				items={[
					{ label: "Wholesale", to: "/orders/wholesale" },
					{ label: "The Alder Street Reading Room and Tea House" },
				]}
			/>
		),
		title: "The Alder Street Reading Room and Tea House at the Old Mill",
		subtitle:
			"A standing order of morning buns, two country loaves, and a tray of rye, every weekday before seven.",
		live: true,
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
		await expectNoSidewaysScroll();
	},
};
