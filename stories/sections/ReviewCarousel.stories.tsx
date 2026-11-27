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
		await step(
			"the reviewer's name links to the review, in a new tab, and says where",
			async () => {
				const source = within(shown(canvas)).getByRole("link", { name: "Priya N." });
				await expect(source).toHaveAttribute("target", "_blank");
				await expect(source).toHaveAccessibleDescription("View on Google, opens in a new tab");
			},
		);
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
				await expect(within(shown(canvas)).getByRole("link", { name: "Priya N." })).toHaveFocus();
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
			within(shown(canvas)).getByRole("link", { name: "Priya N." }).focus();
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

/** A review far past any card's room: the longest review twice over, for the quote's box. */
const veryLongReview = {
	...longestReview,
	quote: `${longestReview.quote} We have since ordered a standing box for the office every Friday, and the buns arrive warm enough that the whole floor knows by nine. When the ovens went down for a week in the summer they called every standing order themselves, and the loaf that came back was better than the one before.`,
	sourceURL: undefined,
};

/** A one line review with nothing beside the name: no stars, no detail, no source. */
const oneLineReview = { quote: "Best rye in town.", by: "Sam K." };

/**
 * One line, mid length, and very long, rated and not, with a detail and
 * without, linked to a source and not: every way a review differs from the
 * next, in one carousel.
 */
const mixed = [oneLineReview, reviews[0], veryLongReview, reviews[3]];

const cardHeight = (canvas: Canvas) => Math.round(carousel(canvas).getBoundingClientRect().height);

/** Where the shown review's parts sit, measured from the card's top. */
function layoutOf(canvas: Canvas, item: (typeof mixed)[number]) {
	const card = carousel(canvas).getBoundingClientRect().top;
	const slide = within(shown(canvas));
	const top = (element: Element) => Math.round(element.getBoundingClientRect().top - card);
	const name = slide.getByText(item.by);
	return {
		card: cardHeight(canvas),
		quote: top(slide.getByText(/^“/)),
		divider: top(name.closest("figcaption") as Element),
		name: top(name),
	};
}

/**
 * The card never moves from review to review: one height, the quote at the
 * top, and the divider and the name in one place, whether the quote is one
 * line or past its box, rated or not, with a detail and a source or not.
 * The very long quote scrolls inside its box, faded below, and stepping
 * away and back opens it at its top again.
 */
export const MixedLengths: Story = {
	args: { items: mixed },
	play: async ({ canvas, userEvent, step }) => {
		const first = layoutOf(canvas, mixed[0]);
		await step("each review sits in the first one's layout", async () => {
			for (const [at, item] of mixed.entries()) {
				await userEvent.click(dot(canvas, at + 1));
				await expect(shown(canvas)).toHaveAccessibleName(`Review ${at + 1} of 4`);
				await expect(layoutOf(canvas, item)).toEqual(first);
			}
		});
		await step("a review with no detail keeps the detail line's room", async () => {
			await userEvent.click(dot(canvas, 2));
			const detail = within(shown(canvas)).getByText("Regular since 2019");
			const card = carousel(canvas).getBoundingClientRect();
			await expect(detail.getBoundingClientRect().bottom).toBeLessThan(card.bottom);
		});
		await step("the very long quote scrolls in its box, faded, a named tab stop", async () => {
			await userEvent.click(dot(canvas, 3));
			const box = within(shown(canvas)).getByRole("region", { name: "Review text" });
			await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
			await expect(box).toHaveAttribute("tabindex", "0");
			box.scrollTo({ top: box.scrollHeight, behavior: "instant" });
			await waitFor(() => expect(box.scrollTop).toBeGreaterThan(0));
		});
		await step("stepping away and back opens it at its top", async () => {
			await userEvent.click(next(canvas));
			await userEvent.click(previous(canvas));
			await expect(shown(canvas)).toHaveAccessibleName("Review 3 of 4");
			const box = within(shown(canvas)).getByRole("region", { name: "Review text" });
			await expect(box.scrollTop).toBe(0);
		});
		await step("a quote that fits is no tab stop", async () => {
			await userEvent.click(dot(canvas, 1));
			await expect(within(shown(canvas)).queryByRole("region")).toBeNull();
		});
	},
};

/** The same reviews at the tablet width, the card stacked under the aggregate. */
export const MixedLengthsTablet: Story = {
	...MixedLengths,
	globals: pin("tablet"),
	play: async (context) => {
		await MixedLengths.play?.(context);
		await expectNoSidewaysScroll();
	},
};

/** The same reviews on a phone: the card holds its layout at the narrow width too. */
export const MixedLengthsPhone: Story = {
	...MixedLengthsTablet,
	globals: pin("phone"),
};

/**
 * Every quote short: the card is as tall as the longest of them, never the
 * full box, so no gap opens under a short quote.
 */
export const AllShort: Story = {
	args: { items: [oneLineReview, reviews[0], reviews[1]] },
	play: async ({ canvas, userEvent }) => {
		// The longest of the three, whose quote sets the row.
		await userEvent.click(dot(canvas, 3));
		const slide = within(shown(canvas));
		const quote = slide.getByText(/^“Ordered a birthday cake/);
		const divider = slide.getByText("Marcus T.").closest("figcaption") as Element;
		const lineHeight = Number.parseFloat(getComputedStyle(quote).lineHeight);
		const gap = divider.getBoundingClientRect().top - quote.getBoundingClientRect().bottom;
		// Only the divider's own margin lies between: no room held for lines the quote lacks.
		await expect(gap).toBeLessThan(lineHeight);
		await expect(quote.getBoundingClientRect().height).toBeLessThan(lineHeight * 6 - 1);
	},
};

/** The box's lines and the scrolling quote's name, set by the page. */
export const QuoteLines: Story = {
	args: { items: mixed, quoteLines: 3, quoteLabel: "The whole review" },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(dot(canvas, 3));
		const box = within(shown(canvas)).getByRole("region", { name: "The whole review" });
		const lineHeight = Number.parseFloat(getComputedStyle(box).lineHeight);
		await expect(box.getBoundingClientRect().height).toBeLessThanOrEqual(lineHeight * 3 + 1);
	},
};
