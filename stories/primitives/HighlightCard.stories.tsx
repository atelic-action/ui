import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { GridLayout, HighlightCard } from "../../src/primitives";
import { journalCards, longWord, recentOrders } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Lifts out one thing (a finished piece of work, an article, an event) as a
 * card, when a page shows a few of them side by side. An eyebrow, a title, a
 * line or two of body, and a meta line, with a small square picture beside
 * them or none at all; given a link, the whole card is the link.
 */
const meta = {
	title: "Primitives/HighlightCard",
	component: HighlightCard,
	args: recentOrders[0],
	// One card at the width a card takes in a grid; the grid stories render their own.
	render: (args) => (
		<div style={{ maxWidth: 420 }}>
			<HighlightCard {...args} />
		</div>
	),
	decorators: [
		(Story) => (
			<div className="wrap" style={{ paddingBlock: 24 }}>
				<Story />
			</div>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof HighlightCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small square picture beside the text, the whole card one link. */
export const Picture: Story = {
	play: async ({ canvas }) => {
		const card = canvas.getByRole("link");
		await expect(card).toHaveAttribute("href", "/orders/lemon-cake");
		await expect(card).not.toHaveAttribute("target");
		await expect(canvas.getByRole("heading", { level: 3 })).toHaveTextContent("Fairhaven");
		const picture = canvas.getByRole("img", { name: "The lemon cake on its stand" });
		const box = picture.getBoundingClientRect();
		await expect(Math.round(box.width)).toBe(112);
		await expect(Math.round(box.height)).toBe(112);
		await expect(box.right).toBeLessThan(
			canvas.getByText("Fairhaven").getBoundingClientRect().left,
		);
		await expect(picture).toHaveAttribute("loading", "lazy");
	},
};

/** No picture: the article's look, an eyebrow over its title and meta line. */
export const NoPicture: Story = {
	args: { ...journalCards[0], body: undefined, detail: undefined, image: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("img")).toBeNull();
		const eyebrow = canvas.getByText("From the oven").getBoundingClientRect();
		const title = canvas.getByRole("heading", { level: 3 }).getBoundingClientRect();
		await expect(eyebrow.bottom).toBeLessThanOrEqual(title.top);
		await expect(canvas.getByRole("link")).toHaveAttribute("href", "/blog/rye");
	},
};

/** With no link it is a plain card. */
export const Plain: Story = {
	args: { href: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
		await expect(canvas.getByRole("heading", { level: 3 })).toBeVisible();
	},
};

/** Before the photography exists: the shot brief in the square, silent to a screen reader. */
export const Placeholder: Story = {
	args: { image: undefined, placeholder: "Photo: the cake" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Photo: the cake")).toBeVisible();
		await expect(canvas.getByRole("link")).toHaveAccessibleName(
			"Fairhaven A three tier lemon cake Wedding, 120 guests June 2026",
		);
	},
};

/** A card that opens another site: a new tab, and a screen reader is told so. */
export const External: Story = {
	args: { href: "https://example.com/orders", external: true },
	play: async ({ canvas }) => {
		const card = canvas.getByRole("link");
		await expect(card).toHaveAttribute("target", "_blank");
		await expect(card).toHaveAccessibleName(/opens in a new tab$/);
	},
};

/** The title's level set by the page, under a heading of its own. */
export const HeadingLevel: Story = {
	args: { headingLevel: 2 },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Fairhaven");
	},
};

/** The longest content: a long unbroken word, and every line filled, on a phone. */
export const LongestContent: Story = {
	args: {
		eyebrow: "From the oven",
		title: longWord,
		body: "A three tier lemon cake with elderflower curd between every layer",
		detail: "Wedding at the Birchmoor mill, 120 guests and a cake for the staff",
		meta: "June 2026, delivered at dawn",
	},
	globals: pin("phone"),
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/** Three cards with pictures in a grid at least 320px a card: as many across as the column holds. */
export const InGrid: Story = {
	render: () => (
		<GridLayout minItemWidth={320} ariaLabel="Recent orders">
			{recentOrders.map((order) => (
				<HighlightCard key={order.title} {...order} />
			))}
		</GridLayout>
	),
	play: async ({ canvas }) => {
		const cards = canvas.getAllByRole("link");
		await expect(cards).toHaveLength(3);
		await expect(cards[1].getBoundingClientRect().top).toBe(cards[0].getBoundingClientRect().top);
		await expect(cards[1].getBoundingClientRect().left).toBeGreaterThan(
			cards[0].getBoundingClientRect().right,
		);
	},
};

/** The articles' grid on a phone: one card to a line, never sideways. */
export const InGridPhone: Story = {
	globals: pin("phone"),
	render: () => (
		<GridLayout minItemWidth={280} gap="20px" stretch ariaLabel="From the journal">
			{journalCards.map((post) => (
				<HighlightCard key={post.title} {...post} />
			))}
		</GridLayout>
	),
	play: async ({ canvas }) => {
		const cards = canvas.getAllByRole("link");
		await expect(cards[1].getBoundingClientRect().top).toBeGreaterThan(
			cards[0].getBoundingClientRect().bottom,
		);
		await expectNoSidewaysScroll();
	},
};
