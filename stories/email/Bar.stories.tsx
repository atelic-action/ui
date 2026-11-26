import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Bar, Card, Row } from "../../src/email";
import { fitsTheColumn, inColumn } from "./column";

/**
 * The segments of a bar, found as a reader finds the bar (an image named by
 * its count): the cells drawn wider than the gaps between them.
 */
function segments(canvas: { getByRole: (role: "img") => HTMLElement }) {
	return Array.from(canvas.getByRole("img").querySelectorAll("td")).filter(
		(cell) => cell.getAttribute("width") !== "3",
	);
}

/**
 * Shows progress toward a target in an email as a row of segments, one per
 * unit. A segmented bar: one segment per unit of the target, the logged ones
 * in the ink and the rest in the line color. Small targets get wider segments
 * so three reads as three. It is an image named by its count ("3 of 5", or its
 * own `label`), or decoration with `label={false}` beside a count that already
 * says it, as in a `TargetRow`.
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
	play: async ({ canvas, canvasElement }) => {
		const cells = segments(canvas);
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
	play: async ({ canvas }) => {
		await expect(segments(canvas)).toHaveLength(5);
	},
};

/** A small target draws wide segments. */
export const SmallTarget: Story = {
	args: { logged: 1, target: 3 },
	play: async ({ canvas }) => {
		const cells = segments(canvas);
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

/** A reader hears the bar as its count. */
export const NamedByItsCount: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "3 of 5" })).toBeInTheDocument();
	},
};

/** A runner may say it in its own words. */
export const OwnLabel: Story = {
	args: { label: "Three of five bakes" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Three of five bakes" })).toBeInTheDocument();
	},
};

/** Beside a count that says it, the bar is decoration and a reader passes it by. */
export const Decoration: Story = {
	args: { label: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};
