import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Stat, StatsRow, TitleCard } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

/**
 * Opens a report email's body, after the masthead, with its headline, lede,
 * and headline figures. The title card that opens a report: a faint eyebrow, a
 * headline of one to three lines, a lede, and whatever rows the runner hands
 * in.
 */
const meta = {
	title: "Email/TitleCard",
	component: TitleCard,
	decorators: [inColumn],
	args: {
		eyebrowText: "2026-W47",
		headlineLines: ["Thirteen out the door,", "two still proofing."],
		lede: "The earliest first drop this month, and Larkspur wants Saturdays.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof TitleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The eyebrow, the headline broken where it was given, and the lede. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		const headline = canvas.getByText(/Thirteen out the door/);
		await expect(headline.querySelectorAll("br")).toHaveLength(1);
		await expect(
			canvas.getByText(/The earliest first drop/).getBoundingClientRect().top,
		).toBeGreaterThan(headline.getBoundingClientRect().bottom - 1);
		await fitsTheColumn(canvasElement);
	},
};

/** With a row of stats under the lede. */
export const WithStats: Story = {
	args: {
		stats: (
			<StatsRow>
				<Stat n={13} caption="orders out" />
				<Stat n={41} caption="trays" />
				<Stat n="06:15" caption="first drop" />
			</StatsRow>
		),
	},
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/** A headline alone: no lede, no stats. */
export const HeadlineOnly: Story = {
	args: { lede: undefined, headlineLines: ["A quiet week."] },
};

/** Three long headline lines on a phone wrap inside the card. */
export const LongestPhone: Story = {
	args: {
		headlineLines: [
			"Thirteen orders out the door before half past seven,",
			"two cafes still proofing,",
			"and the Alder Street Reading Room paused.",
		],
	},
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};
