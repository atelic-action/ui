import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Badge, Card, Row } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Tags a word in an email with a one letter mark that says what kind of thing
 * it is. A single letter in a hairline box after the word it tags (S for
 * social), letter and box in the accent's ink. Given a `label`, a reader hears
 * what the letter stands for in its place; without one, the letter alone.
 */
const meta = {
	title: "Email/Badge",
	component: Badge,
	decorators: [inColumn],
	args: { letter: "S" },
	render: (args) => (
		<Card>
			<Row last>
				Cardamom knots
				<Badge {...args} />
			</Row>
		</Card>
	),
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** After the word it tags, on the same line. */
export const AfterAWord: Story = {
	play: async ({ canvas, canvasElement }) => {
		const badge = canvas.getByText("S");
		await expect(badge.parentElement).toHaveTextContent("Cardamom knotsS");
		const word = canvas.getByText(/Cardamom knots/).getBoundingClientRect();
		await expect(badge.getBoundingClientRect().top).toBeGreaterThanOrEqual(word.top);
		await expect(badge.getBoundingClientRect().bottom).toBeLessThanOrEqual(word.bottom);
		await fitsTheColumn(canvasElement);
	},
};

/** Another letter. */
export const Wholesale: Story = { args: { letter: "W" } };

/** Labelled, the badge is an image a reader hears as the word it stands for. */
export const Labelled: Story = {
	args: { label: "Social" },
	play: async ({ canvas }) => {
		const badge = canvas.getByRole("img", { name: "Social" });
		await expect(badge).toHaveTextContent("S");
		await expect(badge).toHaveAttribute("title", "Social");
	},
};

/** Without a label the letter is plain text, read as itself. */
export const Unlabelled: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("img")).toBeNull();
		await expect(canvas.getByText("S")).toBeVisible();
	},
};

/** The letter is the accent's ink, 5.86 to 1 on the paper, where the accent read 3.31. */
export const InkLetter: Story = {
	play: async ({ canvas }) => {
		await expect(getComputedStyle(canvas.getByText("S")).color).toBe("rgb(184, 48, 11)");
	},
};
