import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Note } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A short note inside a card under a small eyebrow. Plain, the eyebrow is
 * faint and the words dim; accented, the eyebrow wears the accent and the
 * words the ink. Both eyebrows fail contrast on the paper, so every story is
 * marked.
 */
const meta = {
	title: "Email/Note",
	component: Note,
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	decorators: [
		(Story) => (
			<Card>
				<Story />
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: {
		eyebrowText: "Next week",
		text: "The market moves its Saturday hours to 07:00 through the winter.",
		accented: false,
		last: true,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The eyebrow over the words. */
export const Plain: Story = {
	play: async ({ canvas, canvasElement }) => {
		const eyebrow = canvas.getByText("Next week");
		await expect(eyebrow.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			canvas.getByText(/The market moves/).getBoundingClientRect().bottom,
		);
		await fitsTheColumn(canvasElement);
	},
};

/** Accented: the one note that matters. */
export const Accented: Story = { args: { accented: true, eyebrowText: "Act on it" } };

/** Two notes: the first leaves room, the last closes the card. */
export const TwoNotes: Story = {
	render: (args) => (
		<>
			<Note
				{...args}
				last={false}
				eyebrowText="Act on it"
				accented
				text="Send Fairhaven the spring price sheet."
			/>
			<Note {...args} />
		</>
	),
};

/** A long note on a phone wraps inside the card. */
export const LongPhone: Story = {
	args: {
		text: "The market moves its Saturday hours to 07:00 through the winter, so the first van leaves at 06:20 and the harbor drops slide forty minutes.",
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
