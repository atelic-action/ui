import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { FeatureDetail } from "../../src/sections";
import { image, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Describes one feature or service at length, copy beside a photo; use
 * `FeatureGrid` for several short ones side by side. One feature row: the copy
 * (index, eyebrow, title, tags, lead, ticks) beside its photo, flipping sides
 * row to row.
 */
const meta = {
	title: "Sections/FeatureDetail",
	component: FeatureDetail,
	args: {
		id: "sourdough",
		num: "01",
		eyebrow: "The daily loaf",
		title: "Country sourdough",
		tags: ["Two day ferment", "Organic flour"],
		lead: "Mixed at night, rested until three, and baked at dawn in the deck ovens.",
		ticks: ["A crust that crackles", "Keeps for four days", "Sliced on request"],
		image: { src: image("loaves"), alt: "Loaves cooling on a rack" },
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
} satisfies Meta<typeof FeatureDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const photoBox = (canvas: ReturnType<typeof within>, name = "Loaves cooling on a rack") =>
	canvas.getByRole("img", { name }).getBoundingClientRect();
const titleBox = (canvas: ReturnType<typeof within>) =>
	canvas.getByRole("heading", { level: 2 }).getBoundingClientRect();

/** Copy on the left, the photo on the right, and every part of the copy shown. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(photoBox(canvas).left).toBeGreaterThan(titleBox(canvas).right);
		await expect(canvas.getByText("01")).toBeVisible();
		await expect(canvas.getByText("Two day ferment")).toBeVisible();
		await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
		await expect(canvas.getByRole("article")).toHaveAttribute("id", "sourdough");
	},
};

/** Flipped: the photo on the left, for the alternating row. */
export const Flipped: Story = {
	args: { flip: true },
	play: async ({ canvas }) => {
		await expect(photoBox(canvas).right).toBeLessThan(titleBox(canvas).left);
	},
};

/** Before the photography exists: the shot brief in the frame. */
export const Placeholder: Story = {
	args: { image: undefined, placeholder: "Photo: the loaves on the rack, from above" },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Photo: the loaves on the rack, from above")).toBeVisible();
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** Only a title: every other part is optional, and the frame still holds its place. */
export const TitleOnly: Story = {
	args: {
		num: undefined,
		eyebrow: undefined,
		tags: undefined,
		lead: undefined,
		ticks: undefined,
		image: undefined,
	},
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("list")).toBeNull();
		await expect(canvas.getByText("Image")).toBeVisible();
	},
};

/** On a phone the copy and the photo stack. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(photoBox(canvas).top).toBeGreaterThanOrEqual(titleBox(canvas).bottom);
		await expectNoSidewaysScroll();
	},
};

/** The longest realistic copy and many tags, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		eyebrow: "The daily loaf, every day but Monday",
		title: "Country sourdough with a two day ferment and organic flour from the mill",
		tags: ["Two day ferment", "Organic flour", "Hollow Creek mill", "Sliced on request"],
		lead: "Mixed at night, rested until three in the morning, and baked at dawn in the deck ovens you can see from the counter, then sold until it is gone.",
		ticks: [
			"A crust that crackles when it cools on the rack",
			"Keeps for four days in a paper bag, longer in the freezer",
			"Sliced on request, thick or thin",
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * One unbroken word in a tag, on a phone: the chip wraps it inside the
 * column, and the page stays still.
 */
export const UnbrokenTag: Story = {
	globals: pin("phone"),
	args: { tags: ["Two day ferment", unbroken] },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
