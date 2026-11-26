import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { GridLayout, SectionHeading } from "../../src/primitives";
import { LinkRow } from "../../src/sections";
import { deliveryTowns, longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Lists one place or page as a row with its figure at the end, such as an
 * area a business serves and its count of orders, in a column or a grid of
 * such rows. Its label and a figure right aligned on its line; a link when it
 * has a page, bold in the primary's words when `strong`, and plain words when
 * it has none.
 */
const meta = {
	title: "Sections/LinkRow",
	component: LinkRow,
	args: { label: "Fairhaven", href: "/delivery/fairhaven", count: "412" },
	// One row at a column's width; the grid stories render their own.
	render: (args) => (
		<div className="wrap" style={{ paddingBlock: 24, maxWidth: 360 }}>
			<LinkRow {...args} />
		</div>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof LinkRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A link, its figure at the right end of its line. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Fairhaven 412" });
		await expect(link).toHaveAttribute("href", "/delivery/fairhaven");
		const label = canvas.getByText("Fairhaven").getBoundingClientRect();
		const count = canvas.getByText("412").getBoundingClientRect();
		await expect(Math.round(count.right)).toBe(Math.round(link.getBoundingClientRect().right));
		await expect(count.left).toBeGreaterThan(label.right);
	},
};

/** A strong row: bold, in the primary's words. */
export const Strong: Story = {
	args: { strong: true },
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link");
		await expect(Number(getComputedStyle(link).fontWeight)).toBeGreaterThanOrEqual(700);
		await expect(Number(getComputedStyle(canvas.getByText("412")).fontWeight)).toBeLessThan(700);
	},
};

/** No page yet: the label and its figure as plain words. */
export const Plain: Story = {
	args: { href: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.getByText("Fairhaven")).toBeVisible();
	},
};

/** No figure: the label alone. */
export const NoCount: Story = {
	args: { count: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link")).toHaveAccessibleName("Fairhaven");
	},
};

/** A long unbroken label keeps its figure on the line, on a phone. */
export const LongestContent: Story = {
	args: { label: longWord },
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

const rows = deliveryTowns.map((town) => (
	<LinkRow
		key={town.name}
		label={town.name}
		href={town.href}
		count={town.orders}
		strong={Boolean(town.href)}
	/>
));

/**
 * The rows in a ruled grid, three across and five rows shown: the towns with
 * a page bold, the rest plain words, every town still in the page behind
 * Show all. No styling of the page's own.
 */
export const InGrid: Story = {
	decorators: [
		(Story) => (
			<section className="section surface-alt">
				<div className="wrap">
					<SectionHeading eyebrow="Where we deliver" title="Every morning, before the doors open" />
					<div style={{ marginTop: "var(--block-gap)" }}>
						<Story />
					</div>
				</div>
			</section>
		),
	],
	render: () => (
		<GridLayout
			columns={3}
			narrowColumns={2}
			rules
			gap="clamp(20px, 3vw, 40px)"
			visibleRows={5}
			ariaLabel="Towns we deliver to"
		>
			{rows}
		</GridLayout>
	),
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getAllByRole("link")).toHaveLength(3);
		const first = canvas.getByText("Fairhaven").getBoundingClientRect();
		const third = canvas.getByText("Birchmoor").getBoundingClientRect();
		await expect(Math.round(third.top)).toBe(Math.round(first.top));
		await expect(canvas.getByText("Stillwater")).not.toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: "Show all" }));
		await expect(canvas.getByText("Stillwater")).toBeVisible();
	},
};

/** The grid of rows on a phone: two across, never sideways. */
export const InGridPhone: Story = {
	...InGrid,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const first = canvas.getByText("Fairhaven").getBoundingClientRect();
		const second = canvas.getByText("Alder Point").getBoundingClientRect();
		await expect(Math.round(second.top)).toBe(Math.round(first.top));
		await expectNoSidewaysScroll();
	},
};
