import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType, ReactNode } from "react";
import { expect, within } from "storybook/test";
import { GridLayout, type GridLayoutProps, HighlightCard } from "../../src/primitives";
import { deliveryTowns, journalCards, longWord, recentOrders } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/** A town as a row: its name, a link when it has a page, and its count at the right. */
function Town({ name, orders, href }: { name: string; orders: number; href?: string }) {
	const words = (
		<>
			<span>{name}</span> <small>{orders}</small>
		</>
	);
	const style = { display: "flex", justifyContent: "space-between", gap: 12 };
	return href ? (
		<a href={href} style={style}>
			{words}
		</a>
	) : (
		<span style={style}>{words}</span>
	);
}

/**
 * The props as one flat shape, for the controls: the component's own type
 * is a union of counted columns and columns by width, which a story's args
 * cannot narrow, so each story's args are cast back to it when rendered.
 */
type GridArgs = {
	children: ReactNode;
	columns?: number;
	narrowColumns?: number;
	visibleRows?: number;
	showAllLabel?: string;
	showFewerLabel?: string;
	minItemWidth?: number;
	stretch?: boolean;
	gap?: string;
	rules?: boolean;
	as?: "ul" | "div";
	ariaLabel?: string;
};

const towns = deliveryTowns.map((town) => <Town key={town.name} {...town} />);

/**
 * Sets any set of items in one aligned grid, when the items should line up
 * in columns rather than wrap as they please. Columns are counted outright
 * (three from 700px, two below, here) or fill the row at a least width; with
 * counted columns, `visibleRows` holds a long grid to that many rows at every
 * width behind a Show All button, every item still in the page.
 */
const meta = {
	title: "Primitives/GridLayout",
	component: GridLayout as ComponentType<GridArgs>,
	render: (args) => <GridLayout {...(args as GridLayoutProps)} />,
	args: {
		columns: 3,
		narrowColumns: 2,
		rules: true,
		gap: "clamp(20px, 3vw, 40px)",
		visibleRows: 5,
		ariaLabel: "Where we deliver",
		children: towns,
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<GridArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

const grid = (canvas: ReturnType<typeof within>, name = "Where we deliver") =>
	canvas.getByRole("list", { name });
const shown = (canvas: ReturnType<typeof within>, name?: string) =>
	within(grid(canvas, name)).getAllByRole("listitem");

/**
 * Five rows of three show, ruled; the rest wait in the page behind Show all,
 * out of the tab order until it opens.
 */
export const Default: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const toggle = canvas.getByRole("button", { name: "Show all" });
		await step("five rows of three show, three to a line", async () => {
			const items = shown(canvas);
			await expect(items).toHaveLength(15);
			const tops = new Set(items.slice(0, 3).map((item) => item.getBoundingClientRect().top));
			await expect(tops.size).toBe(1);
			await expect(items[3].getBoundingClientRect().top).toBeGreaterThan(
				items[0].getBoundingClientRect().top,
			);
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
		});
		await step("the rest are in the page, and out of reach while closed", async () => {
			await expect(canvas.getByText("Stillwater")).toBeInTheDocument();
			await expect(canvas.getByText("Stillwater")).not.toBeVisible();
		});
		await step("Show all opens every row", async () => {
			await userEvent.click(toggle);
			await expect(shown(canvas)).toHaveLength(20);
			await expect(toggle).toHaveAttribute("aria-expanded", "true");
			await expect(toggle).toHaveAccessibleName("Show fewer");
		});
		await step("Show fewer closes them again", async () => {
			await userEvent.click(toggle);
			await expect(shown(canvas)).toHaveLength(15);
			await expect(toggle).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/**
 * A link held back is out of the tab order while closed, and back in it once
 * the grid opens.
 */
export const HiddenLinksLeaveTheTabOrder: Story = {
	args: {
		children: deliveryTowns.map((town) => (
			<Town key={town.name} {...town} href={`/delivery/${town.name.toLowerCase()}`} />
		)),
	},
	play: async ({ canvas, userEvent }) => {
		const held = canvas.getByText("Stillwater").closest("a") as HTMLAnchorElement;
		held.focus();
		await expect(held).not.toHaveFocus();
		await userEvent.click(canvas.getByRole("button", { name: "Show all" }));
		held.focus();
		await expect(held).toHaveFocus();
	},
};

/** A phone sets two across and still five rows: ten show. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const items = shown(canvas);
		await expect(items).toHaveLength(10);
		await expect(items[0].getBoundingClientRect().top).toBe(items[1].getBoundingClientRect().top);
		await expect(canvas.getByRole("button", { name: "Show all" })).toBeVisible();
		await expectNoSidewaysScroll();
	},
};

/**
 * Twelve items: all five rows of three hold them at a desktop, so no button
 * shows there, while a phone's five rows of two hold ten and offer the rest.
 */
export const FitsWideOnly: Story = {
	args: { children: towns.slice(0, 12) },
	play: async ({ canvas }) => {
		await expect(shown(canvas)).toHaveLength(12);
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** The same twelve on a phone: ten show, and the button offers the other two. */
export const FitsWideOnlyPhone: Story = {
	args: { children: towns.slice(0, 12) },
	globals: pin("phone"),
	play: async ({ canvas, userEvent }) => {
		await expect(shown(canvas)).toHaveLength(10);
		await userEvent.click(canvas.getByRole("button", { name: "Show all" }));
		await expect(shown(canvas)).toHaveLength(12);
	},
};

/** Fewer items than the rows hold: every one shows, and there is no button. */
export const Short: Story = {
	args: { children: towns.slice(0, 4) },
	play: async ({ canvas }) => {
		await expect(shown(canvas)).toHaveLength(4);
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** One item, with no rows held back and no rules. */
export const OneItem: Story = {
	args: { children: towns[0], rules: false, visibleRows: undefined },
	play: async ({ canvas }) => {
		await expect(shown(canvas)).toHaveLength(1);
	},
};

/** The button's words, set by the page. */
export const Labels: Story = {
	args: { showAllLabel: "Every town we reach", showFewerLabel: "Fewer towns" },
	play: async ({ canvas, userEvent }) => {
		const toggle = canvas.getByRole("button", { name: "Every town we reach" });
		await userEvent.click(toggle);
		await expect(toggle).toHaveAccessibleName("Fewer towns");
	},
};

/** A long unbroken name stays inside its cell on a phone. */
export const LongestContent: Story = {
	args: { children: [<Town key="long" name={longWord} orders={7} />, ...towns.slice(1)] },
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * Columns that fill the row: cards at least 320px wide, as many across as
 * the column holds, the empty tracks kept so a card alone on its line stays
 * a card's width.
 */
export const ByWidth: Story = {
	args: {
		columns: undefined,
		narrowColumns: undefined,
		visibleRows: undefined,
		rules: false,
		gap: undefined,
		minItemWidth: 320,
		ariaLabel: "Recent orders",
		children: recentOrders.map((order) => <HighlightCard key={order.title} {...order} />),
	},
	play: async ({ canvas }) => {
		const items = shown(canvas, "Recent orders");
		// The page's column holds two cards of 320px with the gap, so two share
		// the first line and the third starts the next, a card's width.
		await expect(items[1].getBoundingClientRect().top).toBe(items[0].getBoundingClientRect().top);
		await expect(items[2].getBoundingClientRect().top).toBeGreaterThan(
			items[0].getBoundingClientRect().bottom,
		);
		await expect(items[2].getBoundingClientRect().width).toBe(
			items[0].getBoundingClientRect().width,
		);
	},
};

/** By width on a phone: one card to a line. */
export const ByWidthPhone: Story = {
	...ByWidth,
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const items = shown(canvas, "Recent orders");
		await expect(items[1].getBoundingClientRect().top).toBeGreaterThan(
			items[0].getBoundingClientRect().bottom,
		);
		await expectNoSidewaysScroll();
	},
};

/** With `stretch`, two cards share the whole row rather than leaving its end empty. */
export const ByWidthStretch: Story = {
	args: {
		columns: undefined,
		narrowColumns: undefined,
		visibleRows: undefined,
		rules: false,
		gap: "20px",
		minItemWidth: 280,
		stretch: true,
		ariaLabel: "From the journal",
		children: journalCards.slice(0, 2).map((post) => <HighlightCard key={post.title} {...post} />),
	},
	play: async ({ canvas }) => {
		const list = grid(canvas, "From the journal").getBoundingClientRect();
		const last = shown(canvas, "From the journal")[1].getBoundingClientRect();
		await expect(Math.round(last.right)).toBe(Math.round(list.right));
	},
};
