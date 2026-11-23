import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { HoursTable, type InfoRow, InfoRows } from "../../src/sections";
import { site } from "../fixtures/bakery";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const rows: InfoRow[] = [
	{
		title: "Want a Price First?",
		lines: ["Tell us how many loaves a week and see the wholesale price before we talk."],
		action: { label: "Wholesale Price", href: "/wholesale#price", icon: "calculator" },
	},
	{
		title: "The Alder Street Bakery",
		lines: ["418 Alder Street", "Fairhaven, CO 80000"],
		action: {
			label: "Get Directions",
			href: "https://maps.example.com/?q=418+Alder+Street",
			icon: "directions",
			newTab: true,
		},
	},
	{
		title: "The Market Stall",
		lines: ["Fairhaven Saturday Market, Stall 12", "Fairhaven, CO 80001"],
		action: {
			label: "Get Directions",
			href: "https://maps.example.com/?q=Fairhaven+Saturday+Market",
			icon: "directions",
			newTab: true,
		},
	},
];

/**
 * Rows of a title over a few lines with one action on the right, the way a
 * map pack lists a place: an estimate and its link, each office and its
 * directions.
 */
const meta = {
	title: "Sections/InfoRows",
	component: InfoRows,
	args: { rows },
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap" style={{ maxWidth: 460 }}>
					<h2>Other ways to reach us</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof InfoRows>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Each row is a list item under a heading by role; each action is a link
 * described by its row's title, so the two Get Directions links tell
 * themselves apart, and the map links open a new tab.
 */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("a list of rows, each titled at level 3", async () => {
			await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
			await expect(
				canvas.getByRole("heading", { level: 3, name: "The Alder Street Bakery" }),
			).toBeVisible();
		});
		await step("each action names itself and is described by its row", async () => {
			const directions = canvas.getAllByRole("link", { name: "Get Directions" });
			await expect(directions).toHaveLength(2);
			await expect(directions[0]).toHaveAccessibleDescription("The Alder Street Bakery");
			await expect(directions[1]).toHaveAccessibleDescription("The Market Stall");
			await expect(directions[0]).toHaveAttribute("target", "_blank");
			const price = canvas.getByRole("link", { name: "Wholesale Price" });
			await expect(price).toHaveAttribute("href", "/wholesale#price");
			await expect(price).not.toHaveAttribute("target");
		});
		await step("each action sits on its row's right, centered on it", async () => {
			const row = canvas.getAllByRole("listitem")[1] as HTMLElement;
			const link = canvas.getAllByRole("link", { name: "Get Directions" })[0] as HTMLElement;
			const rowBox = row.getBoundingClientRect();
			const linkBox = link.getBoundingClientRect();
			await expect(Math.round(rowBox.right - linkBox.right)).toBe(0);
			await expect(linkBox.left).toBeGreaterThan(rowBox.left + rowBox.width / 2);
		});
	},
};

/** An office's hours under its address, through `detail`; the action stays at the row's top. */
export const WithHours: Story = {
	args: {
		rows: [
			{
				...(rows[1] as InfoRow),
				detail: <HoursTable hours={site.hours} />,
			},
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText(/Mon/)).toBeVisible();
		const link = canvas.getByRole("link", { name: "Get Directions" });
		const title = canvas.getByRole("heading", { name: "The Alder Street Bakery" });
		// The action stays beside the office's name, not halfway down its hours.
		await expect(Math.round(link.getBoundingClientRect().top)).toBe(
			Math.round(title.getBoundingClientRect().top),
		);
	},
};

/** A call row: a tel link never opens a new tab, whatever the row says. */
export const CallAction: Story = {
	args: {
		rows: [
			{
				title: "Call the Bakery",
				lines: ["Seven to three, every day but Monday."],
				icon: "phone",
				action: { label: "Call", href: "tel:+15555550142", icon: "phone", newTab: true },
			},
		],
	},
	play: async ({ canvas }) => {
		const call = canvas.getByRole("link", { name: "Call" });
		await expect(call).toHaveAttribute("href", "tel:+15555550142");
		await expect(call).not.toHaveAttribute("target");
	},
};

/** A row with no action is a title over its lines. */
export const NoAction: Story = {
	args: { rows: [{ title: "Parking", lines: ["Free on Alder Street after nine."] }] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** Under a level 3 heading, the rows read at level 4. */
export const HeadingLevel: Story = {
	args: { headingLevel: 4 },
	decorators: [
		(Story) => (
			<>
				<h3>Our offices</h3>
				<Story />
			</>
		),
	],
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("heading", { level: 4 })).toHaveLength(3);
	},
};

/** On a phone the action keeps its place on the right, and the page never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { name: "The Market Stall" });
		const link = canvas.getAllByRole("link", { name: "Get Directions" })[1] as HTMLElement;
		await expect(link.getBoundingClientRect().left).toBeGreaterThan(
			title.getBoundingClientRect().left,
		);
		await expectNoSidewaysScroll();
	},
};
