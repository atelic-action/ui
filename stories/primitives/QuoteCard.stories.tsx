import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { QuoteCard } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll } from "./support";

/** A pull quote or a testimonial in serif italic, over its attribution. */
const meta = {
	title: "Primitives/QuoteCard",
	component: QuoteCard,
	parameters: { layout: "padded" },
	args: {
		quote: "The rye keeps a full week on our counter, and the morning buns never make it to ten.",
		by: "Rosa Quill, Quill and Fern Cafe",
	},
} satisfies Meta<typeof QuoteCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A figure holding the quote, captioned by who said it. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const figure = canvas.getByRole("figure");
		await expect(figure.querySelector("blockquote")).toHaveTextContent(/The rye keeps a full week/);
		await expect(figure.querySelector("figcaption")).toHaveTextContent(
			"Rosa Quill, Quill and Fern Cafe",
		);
	},
};

export const Center: Story = { args: { center: true } };

/** The quote takes nodes, an emphasized word among them. */
export const RichQuote: Story = {
	args: {
		quote: (
			<>
				We order the seeded rye <strong>every</strong> Thursday.
			</>
		),
	},
};

/**
 * The longest quote and attribution, with an unbroken word, on a phone. It should wrap inside the screen; the unbroken word runs
 * past it and the page scrolls sideways (stories/findings/primitives.md,
 * `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: {
		quote: `Our regulars ask for the ${longWord} by name, and on a Saturday the line runs out the door and past the hardware store on the corner.`,
		by: "Theodora Brightwater-Okonkwo, Head of Purchasing, The Riverside Grocers Cooperative",
	},
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
