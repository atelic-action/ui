import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Bar, Card, Row } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/** The segments of a bar: the cells drawn wider than the gaps between them. */
function segments(canvasElement: HTMLElement) {
	const bar = canvasElement.querySelector("[data-story-column] td td table") as HTMLElement;
	return Array.from(bar.querySelectorAll("td")).filter(
		(cell) => cell.getAttribute("width") !== "3",
	);
}

/**
 * A segmented bar: one segment per unit of the target, the logged ones in
 * the ink and the rest in the line color. Small targets get wider segments
 * so three reads as three. It has no words, so a reader learns nothing from
 * it; the count beside it in a `TargetRow` carries the meaning.
 */
const meta = {
	title: "Email/Bar",
	component: Bar,
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
	args: { logged: 3, target: 5 },
} satisfies Meta<typeof Bar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three of five: five segments, three filled. */
export const Partway: Story = {
	play: async ({ canvasElement }) => {
		const cells = segments(canvasElement);
		await expect(cells).toHaveLength(5);
		const filled = cells.filter(
			(cell) => getComputedStyle(cell).backgroundColor === "rgb(21, 21, 21)",
		);
		await expect(filled).toHaveLength(3);
		await fitsTheColumn(canvasElement);
	},
};

/** Over the target: every segment filled, none added. */
export const Over: Story = {
	args: { logged: 7, target: 5 },
	play: async ({ canvasElement }) => {
		await expect(segments(canvasElement)).toHaveLength(5);
	},
};

/** A small target draws wide segments. */
export const SmallTarget: Story = {
	args: { logged: 1, target: 3 },
	play: async ({ canvasElement }) => {
		const cells = segments(canvasElement);
		await expect(cells[0].getAttribute("width")).toBe("18");
	},
};

/** The widest realistic target still fits a phone's card. */
export const LargeTarget: Story = {
	args: { logged: 12, target: 20 },
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
