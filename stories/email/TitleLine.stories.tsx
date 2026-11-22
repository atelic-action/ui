import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Row, TitleLine } from "../../src/email";
import { lines } from "../support/geometry";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * A name on the left and the one value that matters on the right, in the
 * accent. The accent at 12px fails contrast on the paper, so every story is
 * marked.
 */
const meta = {
	title: "Email/TitleLine",
	component: TitleLine,
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { name: "Larkspur Coffee Bar", right: "4 trays" },
	globals: pin("desktop"),
} satisfies Meta<typeof TitleLine>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name and the value share the line, the value at the right edge. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const name = canvas.getByText("Larkspur Coffee Bar").getBoundingClientRect();
		const value = canvas.getByText("4 trays").getBoundingClientRect();
		await expect(value.left).toBeGreaterThanOrEqual(name.right);
		await fitsTheColumn(canvasElement);
	},
};

/** On a phone a long name wraps and the value stays whole on the right. */
export const LongNamePhone: Story = {
	args: {
		name: "The Alder Street Reading Room and Tea House at the Old Mill",
		right: "paused 41d",
	},
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await expect(lines(canvas.getByText("paused 41d"))).toBe(1);
		await expect(lines(canvas.getByText(/The Alder Street/))).toBeGreaterThan(1);
		await fitsTheColumn(canvasElement);
	},
};
