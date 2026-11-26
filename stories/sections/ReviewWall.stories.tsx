import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ReviewWall } from "../../src/sections";
import { longestReview, reviews, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Shows every review on a page of its own, filterable and sortable; use
 * `ReviewCarousel` for a highlight on another page. The reviews page: a
 * heading, a tag filter and a date sort when the data can drive them, and a
 * grid of cards, a long quote clamped behind Read more.
 */
const meta = {
	title: "Sections/ReviewWall",
	component: ReviewWall,
	args: {
		eyebrow: "Reviews",
		title: "What the line says",
		lead: "Quoted as written, with the name each reviewer gave.",
		items: reviews,
		allTagsLabel: "Everything we bake",
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
} satisfies Meta<typeof ReviewWall>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

/** The reviewers' names, in the order the wall shows them. */
const names = (canvas: Canvas) =>
	canvas
		.getAllByRole("figure")
		.map(
			(card: HTMLElement) =>
				reviews.concat(longestReview).find((review) => within(card).queryByText(review.by))?.by,
		);

/** Newest first, each card's date linking out to the review at its source. The data arrives oldest first, so the sort has work to do. */
export const Default: Story = {
	args: { items: [...reviews].reverse() },
	play: async ({ canvas, step }) => {
		await step("the newest first", async () => {
			await expect(names(canvas)).toEqual([
				"Priya N.",
				"Marcus T.",
				"Dana R.",
				"Owen at Lantern Coffee",
			]);
		});
		await step("a dated review with a source links out in a new tab", async () => {
			const link = canvas.getByRole("link", {
				name: "Read the 2026-09-14 review from Priya N. at its source",
			});
			await expect(link).toHaveAttribute("href", "https://reviews.example.com/1");
			await expect(link).toHaveAttribute("target", "_blank");
		});
		await step("a dated review with no source shows its date as text", async () => {
			await expect(canvas.getByText("2026-06-21")).toBeVisible();
			await expect(canvas.queryByRole("link", { name: /2026-06-21/ })).toBeNull();
		});
		await step("the two controls, named for what they do", async () => {
			await expect(canvas.getByRole("combobox", { name: "Filter reviews by tag" })).toHaveValue("");
			await expect(canvas.getByRole("combobox", { name: "Sort reviews by date" })).toHaveValue(
				"newest",
			);
		});
	},
};

/** The filter keeps a tag's reviews; back to everything brings them all back. */
export const Filter: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const filter = canvas.getByRole("combobox", { name: "Filter reviews by tag" });
		await step("the options are the data's tags, sorted, after the label for all", async () => {
			const options = within(filter)
				.getAllByRole("option")
				.map((option) => option.textContent);
			await expect(options).toEqual([
				"Everything we bake",
				"Bread",
				"Cakes",
				"Pastry",
				"Wholesale",
			]);
		});
		await step("Cakes keeps the one cake review", async () => {
			await userEvent.selectOptions(filter, "Cakes");
			await expect(names(canvas)).toEqual(["Marcus T."]);
		});
		await step("back to everything, all four return", async () => {
			await userEvent.selectOptions(filter, "");
			await expect(canvas.getAllByRole("figure")).toHaveLength(4);
		});
	},
};

/** The sort turns the wall oldest first, and back. */
export const Sort: Story = {
	play: async ({ canvas, userEvent }) => {
		const sort = canvas.getByRole("combobox", { name: "Sort reviews by date" });
		await userEvent.selectOptions(sort, "oldest");
		await expect(names(canvas)).toEqual([
			"Owen at Lantern Coffee",
			"Dana R.",
			"Marcus T.",
			"Priya N.",
		]);
		await userEvent.selectOptions(sort, "newest");
		await expect(names(canvas)[0]).toBe("Priya N.");
	},
};

/**
 * A quote past the budget is clamped behind Read more; the button opens it
 * and closes it again, saying which it is. The full words ship either way.
 */
export const ReadMore: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const more = canvas.getByRole("button", { name: "Read more" });
		const quote = canvas.getByText(/Country sourdough with a crust/);
		const clamped = quote.getBoundingClientRect().height;
		await step("closed, the quote is clamped, and only the long one has the button", async () => {
			await expect(canvas.getAllByRole("button")).toHaveLength(1);
			await expect(more).toHaveAttribute("aria-expanded", "false");
			await expect(quote).toHaveTextContent(/three in the morning to do them properly/);
		});
		await step("Read more opens it in full", async () => {
			await userEvent.click(more);
			await expect(more).toHaveAttribute("aria-expanded", "true");
			await expect(more).toHaveAccessibleName("Show less");
			await expect(quote.getBoundingClientRect().height).toBeGreaterThan(clamped);
		});
		await step("Show less clamps it again, by the keyboard too", async () => {
			more.focus();
			await userEvent.keyboard("{Enter}");
			await expect(more).toHaveAttribute("aria-expanded", "false");
			await expect(Math.round(quote.getBoundingClientRect().height)).toBe(Math.round(clamped));
		});
	},
};

/** A larger budget: nothing clamps, and no button. */
export const NoClamp: Story = {
	args: { clampAt: 1000 },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** The controls turned off, though the data could drive them. */
export const NoControls: Story = {
	args: { filterable: false, sortable: false, items: [...reviews].reverse() },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("combobox")).toBeNull();
		// Unsorted, the wall keeps the data's order: here the oldest first.
		await expect(names(canvas)[0]).toBe("Owen at Lantern Coffee");
	},
};

/** Data with no tags and no dates: no controls at all, and no top row on a card. */
export const BareWall: Story = {
	args: {
		eyebrow: undefined,
		title: undefined,
		lead: undefined,
		items: reviews.map(({ quote, by, detail }) => ({ quote, by, detail })),
	},
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("combobox")).toBeNull();
		await expect(canvas.queryByRole("heading")).toBeNull();
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** Two across on a tablet. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const [a, b, c] = canvas
			.getAllByRole("figure")
			.map((card) => Math.round(card.getBoundingClientRect().top));
		await expect(a).toBe(b);
		await expect(c).toBeGreaterThan(a);
	},
};

/** One to a row on a phone, with the longest review inside the page. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: { items: [...reviews, longestReview] },
	play: async ({ canvas }) => {
		const [a, b] = canvas.getAllByRole("figure").map((card) => card.getBoundingClientRect());
		await expect(b.top).toBeGreaterThanOrEqual(a.bottom);
		await expectNoSidewaysScroll();
	},
};

/**
 * One unbroken word as a reviewer's name, on a phone: the name breaks where
 * it must, and neither the card nor the page scrolls sideways.
 */
export const UnbrokenName: Story = {
	globals: pin("phone"),
	args: { items: [{ quote: "Best bread in the county.", by: unbroken }] },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
