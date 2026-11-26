import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, RecordTimelineStrip, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/** The strip's day cells, found as a reader finds the strip (an image named by its summary): its first row. */
function cells(canvas: { getByRole: (role: "img") => HTMLElement }) {
	const strip = canvas.getByRole("img");
	return Array.from(strip.querySelector("tr")?.children ?? []) as HTMLElement[];
}

/**
 * Shows a record's recent days on one line in an email, marking each send and
 * each open. A record's recent days on one line, today at the right edge: an
 * ink square for each send, an accent dot for each known open, stacked when
 * they share a day, on a hairline with a tick for today. Runs of empty days
 * merge into one cell. The marks are drawn, so the strip is an image named in
 * words: `recordTimelineSummary` of the timeline, or its own `label`.
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
		await expect(cells(canvas)).toHaveLength(8);
		await expect(canvas.getByText("30d")).toBeVisible();
		await expect(canvas.getByText("today")).toBeVisible();
		await fitsTheColumn(canvasElement);
	},
};

/** Nothing sent and nothing opened: one empty run and the axis. */
export const Quiet: Story = {
	args: { timeline: { days: 14, touches: [], opens: [] } },
	play: async ({ canvas }) => {
		await expect(cells(canvas)).toHaveLength(1);
		await expect(canvas.getByText("14d")).toBeVisible();
	},
};

/** A send and an open today: both marks in the last cell. */
export const Today: Story = {
	args: { timeline: { days: 7, touches: [0], opens: [0] } },
	play: async ({ canvas }) => {
		const all = cells(canvas);
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

/** A reader hears the sends and the opens in words, the latest of each first. */
export const ReadInWords: Story = {
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", {
				name: "Last 30 days: 3 sends, the latest 2 days ago; 2 opens, the latest 2 days ago",
			}),
		).toBeInTheDocument();
	},
};

/** A runner may name the strip in its own words. */
export const OwnLabel: Story = {
	args: { label: "Quiet since the trial began" },
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", { name: "Quiet since the trial began" }),
		).toBeInTheDocument();
	},
};
