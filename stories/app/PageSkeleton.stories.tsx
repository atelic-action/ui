import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PageSkeleton } from "../../src/app";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * The busy region, reached from the words a reader hears in it. Its blocks
 * have no role or words of their own (they are hidden from a reader), so the
 * cards are found from there: the hidden blocks' last child holds them.
 */
function busyRegion(canvas: { getByText: (text: string) => HTMLElement }) {
	return canvas.getByText("Loading").parentElement as HTMLElement;
}

/** How many rows the skeleton's cards run to. */
function rowsOf(canvas: { getByText: (text: string) => HTMLElement }) {
	const blocks = busyRegion(canvas).querySelector("[aria-hidden=true]");
	const cards = Array.from(blocks?.lastElementChild?.children ?? []);
	return new Set(cards.map((card) => Math.round(card.getBoundingClientRect().top))).size;
}

/**
 * The loading state a page shows while its data arrives: a header skeleton
 * (title, subtitle, an optional action) over a number of card skeletons in
 * one column, two columns, or a grid. It is busy, and a reader hears its
 * words ("Loading", or its own `label`) in place of the blocks.
 */
const meta = {
	title: "App/PageSkeleton",
	component: PageSkeleton,
	parameters: { layout: "padded" },
	globals: pin("desktop"),
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three cards in one column under the header. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(rowsOf(canvas)).toBe(3);
	},
};

/** With the header's action placeholder. */
export const WithHeaderAction: Story = { args: { showHeaderAction: true } };

/** Two columns on a desktop. */
export const TwoColumn: Story = {
	args: { cardLayout: "two-column", cardCount: 4 },
	play: async ({ canvas }) => {
		await expect(rowsOf(canvas)).toBe(2);
	},
};

/** Three across on a desktop. */
export const Grid: Story = {
	args: { cardLayout: "grid", cardCount: 6 },
	play: async ({ canvas }) => {
		await expect(rowsOf(canvas)).toBe(2);
	},
};

/** On a phone every layout is one column. */
export const GridPhone: Story = {
	args: { cardLayout: "grid", cardCount: 3 },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(rowsOf(canvas)).toBe(3);
		await expectNoSidewaysScroll();
	},
};

/** Cards alone, for a section of a page still loading. */
export const NoHeader: Story = { args: { showHeader: false, cardCount: 1 } };

/**
 * A screen reader hears that the page is loading: the region is busy, its
 * words are there for a reader though not drawn, and its blocks are hidden.
 */
export const AnnouncesLoading: Story = {
	play: async ({ canvas }) => {
		const words = canvas.getByText("Loading");
		await expect(busyRegion(canvas)).toHaveAttribute("aria-busy", "true");
		await expect(words.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		await expect(busyRegion(canvas).querySelector("[aria-hidden=true]")).not.toBeNull();
	},
};

/** A page names what it is loading. */
export const OwnWords: Story = {
	args: { label: "Loading the orders" },
	play: async ({ canvas }) => {
		const words = canvas.getByText("Loading the orders");
		await expect(words.parentElement).toHaveAttribute("aria-busy", "true");
	},
};
