import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { ReviewCarousel } from "../../src/sections";
import { longestReview, reviews } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { withReducedMotion } from "../support/motion";
import { pin } from "../support/viewports";

/**
 * Shows a business's rating with one review at a time, for a page with room
 * for a single quote; use `ReviewWall` for the full set. The aggregate rating
 * beside one large review at a time, stepped by dots and round arrows.
 */
const meta = {
	title: "Sections/ReviewCarousel",
	component: ReviewCarousel,
	args: {
		eyebrow: "What the line says",
		score: "4.9",
		rating: 5,
		caption: "from 200+ Google reviews",
		profileURL: "https://reviews.example.com/kestrel-hollow",
		lead: "Every review here is quoted as written, with the name the reviewer gave.",
		stats: [
			{ value: "212", label: "Reviews" },
			{ value: "96%", label: "Five stars" },
			{ value: "12 yrs", label: "On Alder Street" },
		],
		items: reviews,
		sourceLabel: "View on Google",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ReviewCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

const carousel = (canvas: Canvas) => canvas.getByRole("region", { name: "Customer reviews" });
/** The slide a reader can see: the one figure the accessibility tree still holds. */
const shown = (canvas: Canvas) => within(carousel(canvas)).getByRole("figure");
const next = (canvas: Canvas) => canvas.getByRole("button", { name: "Next review" });
const previous = (canvas: Canvas) => canvas.getByRole("button", { name: "Previous review" });
const dot = (canvas: Canvas, n: number) =>
	canvas.getByRole("button", { name: `Go to review ${n}` });

/** The aggregate, its link out to the profile, the stats, and the first review. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("the score over its denominator, the caption linking out", async () => {
			await expect(canvas.getByText("4.9")).toBeVisible();
			await expect(canvas.getByText("/ 5")).toBeVisible();
			const profile = canvas.getByRole("link", {
				name: "from 200+ Google reviews, opens the review profile in a new tab",
			});
			await expect(profile).toHaveAttribute("target", "_blank");
			await expect(canvas.getByText("212")).toBeVisible();
			await expect(canvas.getByText("Five stars")).toBeVisible();
		});
		await step(
			"one review shown, named for its place, the rest hidden but in the page",
			async () => {
				await expect(shown(canvas)).toHaveAccessibleName("Review 1 of 4");
				await expect(within(shown(canvas)).getByText("Priya N.")).toBeVisible();
				await expect(canvas.getByText(/Owen at Lantern Coffee/)).not.toBeVisible();
				await expect(carousel(canvas)).toHaveAttribute("aria-roledescription", "carousel");
			},
		);
		await step("its source link opens a new tab", async () => {
			await expect(
				within(shown(canvas)).getByRole("link", { name: /View on Google/ }),
			).toHaveAttribute("target", "_blank");
		});
	},
};

/**
 * The arrows step through, wrapping at both ends; a dot jumps; the dots say
 * which review is current at every stop.
 */
export const Steps: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step("Next steps to the second review, its dot current", async () => {
			await userEvent.click(next(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 2 of 4");
			await expect(dot(canvas, 2)).toHaveAttribute("aria-current", "true");
			await expect(dot(canvas, 1)).toHaveAttribute("aria-current", "false");
		});
		await step("Previous steps back, and from the first wraps to the last", async () => {
			await userEvent.click(previous(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 1 of 4");
			await userEvent.click(previous(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 4 of 4");
		});
		await step("from the last, Next wraps to the first", async () => {
			await userEvent.click(next(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 1 of 4");
		});
		await step("a dot jumps straight to its review", async () => {
			await userEvent.click(dot(canvas, 3));
			await expect(shown(canvas)).toHaveAccessibleName("Review 3 of 4");
			await expect(dot(canvas, 3)).toHaveAttribute("aria-current", "true");
			await expect(dot(canvas, 3)).toHaveFocus();
		});
		await step("a review with no source has no link", async () => {
			await expect(within(shown(canvas)).queryByRole("link")).toBeNull();
		});
	},
};

/**
 * The keyboard: with focus on any control, Left and Right step the reviews,
 * focus staying put; on a review's own link the arrows are left alone.
 */
export const Keyboard: Story = {
	play: async ({ canvas, userEvent, step }) => {
		await step(
			"Tab walks the caption link, the shown review's link, the dots, the arrows",
			async () => {
				await userEvent.tab();
				await expect(canvas.getByRole("link", { name: /opens the review profile/ })).toHaveFocus();
				await userEvent.tab();
				await expect(
					within(shown(canvas)).getByRole("link", { name: /View on Google/ }),
				).toHaveFocus();
				await userEvent.tab();
				await expect(dot(canvas, 1)).toHaveFocus();
			},
		);
		await step("Right steps forward from a dot, focus staying on it", async () => {
			await userEvent.keyboard("{ArrowRight}");
			await expect(shown(canvas)).toHaveAccessibleName("Review 2 of 4");
			await expect(dot(canvas, 1)).toHaveFocus();
		});
		await step("Left steps back, and again wraps to the last", async () => {
			await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
			await expect(shown(canvas)).toHaveAccessibleName("Review 4 of 4");
		});
		await step("on a review's own link, the arrows do not step", async () => {
			await userEvent.click(dot(canvas, 1));
			within(shown(canvas))
				.getByRole("link", { name: /View on Google/ })
				.focus();
			await userEvent.keyboard("{ArrowRight}");
			await expect(shown(canvas)).toHaveAccessibleName("Review 1 of 4");
		});
		await step("Enter on the Next arrow steps too", async () => {
			next(canvas).focus();
			await userEvent.keyboard("{Enter}");
			await expect(shown(canvas)).toHaveAccessibleName("Review 2 of 4");
		});
	},
};

/**
 * Every transition a step starts inside the carousel, by the element's
 * accessible name or its role and the property, heard as each one starts, so
 * a slow machine that finishes a short transition before the check still
 * counts it.
 */
async function stepAndListen(canvas: Canvas, press: () => Promise<void>) {
	const started: string[] = [];
	const region = carousel(canvas);
	const hear = (event: TransitionEvent) => {
		const target = event.target as Element;
		started.push(
			`${target.getAttribute("aria-label") ?? target.tagName.toLowerCase()} ${event.propertyName}`,
		);
	};
	region.addEventListener("transitionrun", hear);
	await press();
	await waitFor(() => expect(shown(canvas)).toHaveAccessibleName("Review 2 of 4"));
	await new Promise((resolve) => setTimeout(resolve, 150));
	region.removeEventListener("transitionrun", hear);
	return started;
}

/** A step fades the new review in. */
export const FadesIn: Story = {
	play: async ({ canvas, userEvent }) => {
		const started = await stepAndListen(canvas, () => userEvent.click(next(canvas)));
		await expect(started).toContain("Review 2 of 4 opacity");
	},
};

/** Under reduced motion a step swaps the review at once, with no fade, and nothing else moves. */
export const ReducedMotion: Story = {
	beforeEach: withReducedMotion,
	play: async ({ canvas, userEvent }) => {
		const started = await stepAndListen(canvas, () => userEvent.click(next(canvas)));
		await expect(started.filter((name) => name.startsWith("Review "))).toEqual([]);
		await expect(getComputedStyle(shown(canvas)).opacity).toBe("1");
		// The dots change at once too: no transition starts anywhere.
		await expect(started).toEqual([]);
	},
};

/** One review: nowhere to step, so no dots and no arrows are drawn. */
export const OneReview: Story = {
	args: { items: reviews.slice(0, 1) },
	play: async ({ canvas }) => {
		await expect(within(carousel(canvas)).queryByRole("button")).toBeNull();
		await expect(shown(canvas)).toHaveAccessibleName("Review 1 of 1");
	},
};

/** No reviews: the aggregate alone, and nothing to step. */
export const NoReviews: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(within(carousel(canvas)).queryByRole("figure")).toBeNull();
		await expect(within(carousel(canvas)).queryByRole("button")).toBeNull();
	},
};

/** A score with no stars, no denominator, no caption link, and no stats. */
export const Plain: Story = {
	args: {
		eyebrow: undefined,
		outOf: "",
		rating: undefined,
		profileURL: undefined,
		lead: undefined,
		stats: undefined,
		items: reviews.map(({ sourceURL: _source, ...review }) => review),
	},
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("/ 5")).toBeNull();
		await expect(canvas.getByText("from 200+ Google reviews")).toBeVisible();
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** The tablet sits below the side by side step: the review stacks under the aggregate. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const score = canvas.getByText("4.9").getBoundingClientRect();
		await expect(carousel(canvas).getBoundingClientRect().top).toBeGreaterThan(score.bottom);
	},
};

/**
 * The longest review a source gives, on a phone: the card is as tall as it,
 * and stepping to a short one never moves the page under the card.
 */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: { items: [reviews[0], longestReview] },
	play: async ({ canvas, userEvent }) => {
		const card = () => carousel(canvas).getBoundingClientRect();
		const before = card();
		await userEvent.click(next(canvas));
		await waitFor(() => expect(shown(canvas)).toHaveAccessibleName("Review 2 of 2"));
		await expect(Math.round(card().height)).toBe(Math.round(before.height));
		await expectNoSidewaysScroll();
	},
};

/** A review far past any card's room: the longest review twice over, for the quote's cap. */
const veryLongReview = {
	...longestReview,
	quote: `${longestReview.quote} We have since ordered a standing box for the office every Friday, and the buns arrive warm enough that the whole floor knows by nine. When the ovens went down for a week in the summer they called every standing order themselves, and the loaf that came back was better than the one before.`,
	sourceURL: undefined,
};
const mixed = [reviews[0], veryLongReview, reviews[1]];

const cardHeight = (canvas: Canvas) => Math.round(carousel(canvas).getBoundingClientRect().height);

/**
 * One very long review among short ones: every quote is cut to six lines
 * behind Show more, so the card holds one height from review to review.
 * Opening the long quote grows the card, and stepping on closes it again.
 */
export const LongReviewCapped: Story = {
	args: { items: mixed },
	play: async ({ canvas, userEvent, step }) => {
		const resting = cardHeight(canvas);
		await step("the card holds one height from review to review", async () => {
			await userEvent.click(next(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 2 of 3");
			await expect(cardHeight(canvas)).toBe(resting);
			await userEvent.click(next(canvas));
			await expect(cardHeight(canvas)).toBe(resting);
			await userEvent.click(dot(canvas, 2));
		});
		const more = () => within(shown(canvas)).getByRole("button", { name: "Show more" });
		await step("the long quote is cut to its six lines behind Show more", async () => {
			const quote = within(shown(canvas)).getByText(/^“We moved to Fairhaven/);
			const lineHeight = Number.parseFloat(getComputedStyle(quote).lineHeight);
			await expect(quote.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 6 + 1);
			await expect(quote.scrollHeight).toBeGreaterThan(quote.clientHeight);
			await expect(more()).toHaveAttribute("aria-expanded", "false");
		});
		await step("Show more opens the whole quote, and the card may grow", async () => {
			await userEvent.click(more());
			const less = within(shown(canvas)).getByRole("button", { name: "Show less" });
			await expect(less).toHaveAttribute("aria-expanded", "true");
			await expect(cardHeight(canvas)).toBeGreaterThan(resting);
		});
		await step("stepping on and back closes it again, at the resting height", async () => {
			await userEvent.click(next(canvas));
			await userEvent.click(previous(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 2 of 3");
			await expect(more()).toHaveAttribute("aria-expanded", "false");
			await expect(cardHeight(canvas)).toBe(resting);
		});
	},
};

/** The same reviews on a phone: the cap holds the card steady at the narrow width too. */
export const LongReviewCappedPhone: Story = {
	...LongReviewCapped,
	globals: pin("phone"),
	play: async (context) => {
		await LongReviewCapped.play?.(context);
		await expectNoSidewaysScroll();
	},
};

/** A short review fits its lines, so no Show more is drawn for it. */
export const ShortReviewUncut: Story = {
	play: async ({ canvas }) => {
		await expect(within(shown(canvas)).queryByRole("button", { name: "Show more" })).toBeNull();
	},
};

/** The cap and the control's words, set by the page. */
export const QuoteLines: Story = {
	args: { items: mixed, quoteLines: 3, moreLabel: "Read the rest", lessLabel: "Read less" },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(dot(canvas, 2));
		const quote = within(shown(canvas)).getByText(/^“We moved to Fairhaven/);
		const lineHeight = Number.parseFloat(getComputedStyle(quote).lineHeight);
		await expect(quote.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 3 + 1);
		await userEvent.click(within(shown(canvas)).getByRole("button", { name: "Read the rest" }));
		await expect(within(shown(canvas)).getByRole("button", { name: "Read less" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	},
};
