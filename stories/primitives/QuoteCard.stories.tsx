import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { QuoteCard } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Sets a pull quote or a testimonial over its attribution. A pull quote or a
 * testimonial in serif italic, over its attribution.
 */
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
		await expect(within(figure).getByRole("blockquote")).toHaveTextContent(
			/The rye keeps a full week/,
		);
		// The caption is the figure's description; a figcaption has no role of its own.
		await expect(within(figure).getByText("Rosa Quill, Quill and Fern Cafe")).toBeVisible();
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
 * The longest quote and attribution, with an unbroken word, on a phone: it
 * wraps inside the screen, the word breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		quote: `Our regulars ask for the ${longWord} by name, and on a Saturday the line runs out the door and past the hardware store on the corner.`,
		by: "Theodora Brightwater-Okonkwo, Head of Purchasing, The Riverside Grocers Cooperative",
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
