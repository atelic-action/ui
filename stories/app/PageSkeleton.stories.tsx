import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PageSkeleton } from "../../src/app";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * How many rows the skeleton's cards run to. A skeleton has no roles or
 * words to find a card by, so the cards are the last block's children.
 */
function rowsOf(canvasElement: HTMLElement) {
	const cards = Array.from(canvasElement.firstElementChild?.lastElementChild?.children ?? []);
	return new Set(cards.map((card) => Math.round(card.getBoundingClientRect().top))).size;
}

/**
 * The loading state a page shows while its data arrives: a header skeleton
 * (title, subtitle, an optional action) over a number of card skeletons in
 * one column, two columns, or a grid.
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
	play: async ({ canvasElement }) => {
		await expect(rowsOf(canvasElement)).toBe(3);
	},
};

/** With the header's action placeholder. */
export const WithHeaderAction: Story = { args: { showHeaderAction: true } };

/** Two columns on a desktop. */
export const TwoColumn: Story = {
	args: { cardLayout: "two-column", cardCount: 4 },
	play: async ({ canvasElement }) => {
		await expect(rowsOf(canvasElement)).toBe(2);
	},
};

/** Three across on a desktop. */
export const Grid: Story = {
	args: { cardLayout: "grid", cardCount: 6 },
	play: async ({ canvasElement }) => {
		await expect(rowsOf(canvasElement)).toBe(2);
	},
};

/** On a phone every layout is one column. */
export const GridPhone: Story = {
	args: { cardLayout: "grid", cardCount: 3 },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await expect(rowsOf(canvasElement)).toBe(3);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** Cards alone, for a section of a page still loading. */
export const NoHeader: Story = { args: { showHeader: false, cardCount: 1 } };

/**
 * A screen reader hears nothing while the page loads: the skeleton is bare
 * blocks with no busy state and no words. It should say it is loading.
 */
export const AnnouncesLoading: Story = {
	tags: ["known-issue"],
	play: async ({ canvas, canvasElement }) => {
		await knownBug("skeleton-says-nothing", async () => {
			const busy = canvasElement.querySelector("[aria-busy=true]");
			const words = canvas.queryByText(/loading/i);
			await expect(busy ?? words).not.toBeNull();
		});
	},
};
