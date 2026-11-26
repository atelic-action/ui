import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, type within } from "storybook/test";
import { ImageFrame, SectionHeading } from "../../src/primitives";
import { SplitSection } from "../../src/sections";
import { image, longEmail } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/*
 * Each column's content is a named region, so a story measures a column by
 * what the reader sees in it rather than by the section's markup.
 */
const copy = (
	<section aria-label="The copy">
		<h2>Baked in the back of the shop</h2>
		<p>
			Every loaf is mixed the night before and baked at dawn, in the deck ovens you can see from the
			counter.
		</p>
	</section>
);

const photo = (
	<section aria-label="The photo">
		<ImageFrame src={image("ovens")} alt="The ovens at dawn" aspectRatio="4/3" />
	</section>
);

/**
 * Sets two columns side by side, copy beside copy or a photo beside copy, for
 * any section that is neither a grid nor a list. The two column section: copy
 * beside copy, or a photo beside copy.
 */
const meta = {
	title: "Sections/SplitSection",
	component: SplitSection,
	args: { left: photo, right: copy },
	globals: pin("desktop"),
} satisfies Meta<typeof SplitSection>;

export default meta;
type Story = StoryObj<typeof meta>;

function columns(canvas: ReturnType<typeof within>) {
	return {
		left: canvas.getByRole("region", { name: "The photo" }).getBoundingClientRect(),
		right: canvas.getByRole("region", { name: /The copy|Wholesale/ }).getBoundingClientRect(),
	};
}

/** Even halves, side by side, tops aligned. */
export const Even: Story = {
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(Math.abs(left.width - right.width)).toBeLessThan(2);
		await expect(right.left).toBeGreaterThan(left.right);
		await expect(Math.round(left.top)).toBe(Math.round(right.top));
	},
};

/** The first column a little narrower. */
export const NarrowFirst: Story = {
	args: { ratio: "narrow-first" },
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(left.width).toBeLessThan(right.width);
		await expect(right.left).toBeGreaterThan(left.right);
	},
};

/** A fixed media column of 420 px beside the copy. */
export const Media: Story = {
	args: { ratio: "media" },
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(Math.round(left.width)).toBe(420);
		await expect(right.left).toBeGreaterThan(left.right);
	},
};

/** The media ratio splits from 761 px, so a tablet keeps it side by side. */
export const MediaTablet: Story = {
	args: { ratio: "media" },
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(right.left).toBeGreaterThan(left.right);
	},
};

/** Centered on each other: the shorter column sits in the middle of the taller. */
export const AlignCenter: Story = {
	args: { align: "center" },
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		const middle = (rect: DOMRect) => (rect.top + rect.bottom) / 2;
		await expect(Math.abs(middle(left) - middle(right))).toBeLessThan(2);
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** Tight top and bottom, for a section that continues the thought of the one before. */
export const Tight: Story = { args: { tightTop: true, tightBottom: true } };

/** Copy beside copy. */
export const CopyAndCopy: Story = {
	args: {
		left: copy,
		right: (
			<section aria-label="The detail">
				<h3>What it takes</h3>
				<p>Two bakers, one mixer, and a night's rest for the dough.</p>
			</section>
		),
	},
};

/** The tablet sits below the even split's step, so the halves stack. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(right.top).toBeGreaterThanOrEqual(left.bottom);
	},
};

/** On a phone the halves stack inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const { left, right } = columns(canvas);
		await expect(right.top).toBeGreaterThanOrEqual(left.bottom);
		await expectNoSidewaysScroll();
	},
};

/**
 * A long email address in the copy, on a phone, the way a wholesale page
 * writes one: the paragraph breaks it where it must, and the page stays
 * still.
 */
export const LongAddressPhone: Story = {
	globals: pin("phone"),
	args: {
		right: (
			<section aria-label="Wholesale">
				<h2>Wholesale</h2>
				<p>
					Write to <a href={`mailto:${longEmail}`}>{longEmail}</a> for a standing order.
				</p>
			</section>
		),
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

const heading = (
	<section aria-label="The heading">
		<SectionHeading eyebrow="Wholesale" title="Bread for the cafes before they open" />
	</section>
);

const paragraphs = (
	<section aria-label="The paragraphs">
		<p>
			Eleven cafes take the morning bake. Their loaves leave the back door at five, sliced or whole,
			with a note of what changed since the day before.
		</p>
		<p>
			A standing order runs until a cafe changes it, and a change made by noon lands the next day.
		</p>
	</section>
);

const parts = (canvas: ReturnType<typeof within>) => ({
	left: canvas.getByRole("region", { name: "The heading" }).getBoundingClientRect(),
	right: canvas.getByRole("region", { name: "The paragraphs" }).getBoundingClientRect(),
});

/** A heading beside the paragraphs it opens, two parts to three. */
export const TwoThree: Story = {
	args: { ratio: "two-three", left: heading, right: paragraphs },
	play: async ({ canvas }) => {
		const { left, right } = parts(canvas);
		await expect(right.left).toBeGreaterThan(left.right);
		await expect(left.width / right.width).toBeCloseTo(2 / 3, 1);
		await expect(Math.round(left.top)).toBe(Math.round(right.top));
	},
};

/** Below 920px the heading stacks over its paragraphs. */
export const TwoThreeTablet: Story = {
	args: { ratio: "two-three", left: heading, right: paragraphs },
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const { left, right } = parts(canvas);
		await expect(right.top).toBeGreaterThanOrEqual(left.bottom);
		await expectNoSidewaysScroll();
	},
};
