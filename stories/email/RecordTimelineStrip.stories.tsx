import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, RecordTimelineStrip, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** The strip's day cells: the first row of its own table. */
function cells(canvasElement: HTMLElement) {
	const strip = canvasElement.querySelector("[data-story-column] td td table") as HTMLElement;
	return Array.from(strip.querySelector("tr")?.children ?? []) as HTMLElement[];
}

/**
 * A record's recent days on one line, today at the right edge: an ink
 * square for each send, an accent dot for each known open, stacked when they
 * share a day, on a hairline with a tick for today. Runs of empty days merge
 * into one cell. The marks are drawn, so a reader gets only the axis words.
 */
const meta = {
	title: "Email/RecordTimelineStrip",
	component: RecordTimelineStrip,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					Larkspur Coffee Bar
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { timeline: { days: 30, touches: [27, 13, 2], opens: [12, 2] } },
	globals: pin("desktop"),
} satisfies Meta<typeof RecordTimelineStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three sends and two opens over thirty days: a cell per marked day, one per empty run. */
export const ThirtyDays: Story = {
	play: async ({ canvas, canvasElement }) => {
		// Marked days 27, 13, 12, and 2, and the four runs of empty days around them.
		await expect(cells(canvasElement)).toHaveLength(8);
		await expect(canvas.getByText("30d")).toBeVisible();
		await expect(canvas.getByText("today")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** Nothing sent and nothing opened: one empty run and the axis. */
export const Quiet: Story = {
	args: { timeline: { days: 14, touches: [], opens: [] } },
	play: async ({ canvas, canvasElement }) => {
		await expect(cells(canvasElement)).toHaveLength(1);
		await expect(canvas.getByText("14d")).toBeVisible();
	},
};

/** A send and an open today: both marks in the last cell. */
export const Today: Story = {
	args: { timeline: { days: 7, touches: [0], opens: [0] } },
	play: async ({ canvasElement }) => {
		const all = cells(canvasElement);
		await expect(all[all.length - 1].children).toHaveLength(2);
	},
};

/** Fewer than one day still draws a day. */
export const UnderADay: Story = {
	args: { timeline: { days: 0.2, touches: [0], opens: [] } },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("1d")).toBeVisible();
	},
};

/** A busy month on a phone fits the card. */
export const BusyPhone: Story = {
	args: {
		timeline: { days: 30, touches: [29, 25, 21, 17, 13, 9, 5, 1], opens: [28, 24, 20, 12, 4, 0] },
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
