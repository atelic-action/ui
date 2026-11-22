import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ThresholdScale } from "../../src/components";
import { thresholdReadings, thresholdTicks, thresholdZones } from "../fixtures/primitives";
import { expectNoSidewaysScroll, inWrap } from "../primitives/support";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A scale with zones and one line a reading: where a number sits against
 * the lines that decide good, slow, and poor. Each track is a picture named
 * by its reading.
 */
const meta = {
	title: "Components/ThresholdScale",
	component: ThresholdScale,
	decorators: [inWrap],
	args: { max: 6, zones: thresholdZones, ticks: thresholdTicks, readings: thresholdReadings },
	globals: pin("desktop"),
} satisfies Meta<typeof ThresholdScale>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The quiet labels fail contrast on the surface (stories/findings/primitives.md). */
const quietLabels = {
	parameters: { ...knownIssues("muted-text-contrast", "tone-good-text-contrast") },
} satisfies Story;

/** Each reading's track is named by its label and figure; the pin sits at its share of the scale. */
export const Default: Story = {
	tags: ["known-issue"],
	...quietLabels,
	play: async ({ canvas }) => {
		const home = canvas.getByRole("img", { name: "Home page: 4.1 s" });
		await expect(canvas.getByRole("img", { name: "Menu: 3.2 s" })).toBeInTheDocument();
		const track = home.getBoundingClientRect();
		const pin = home.lastElementChild as HTMLElement;
		const at = pin.getBoundingClientRect();
		const share = (at.left + at.width / 2 - track.left) / track.width;
		await expect(Math.abs(share - 4.1 / 6)).toBeLessThan(0.03);
	},
};

/**
 * Which zone a reading falls in is the point of the scale. The track's name
 * should say it ("Poor"); it carries the figure alone, and the zone labels
 * and their lines are hidden, so the verdict reaches a screen reader only
 * as color (stories/findings/primitives.md, `threshold-zone-not-spoken`).
 */
export const ZoneIsSpoken: Story = {
	tags: ["known-issue"],
	...quietLabels,
	play: async ({ canvas }) => {
		await knownBug("threshold-zone-not-spoken", async () => {
			await expect(canvas.getByRole("img", { name: /Home page: 4\.1 s/ })).toHaveAccessibleName(
				/Poor/,
			);
		});
	},
};

/** A reading past the far end pins at the end of the track, never beyond it. */
export const PastTheEnd: Story = {
	tags: ["known-issue"],
	...quietLabels,
	args: { readings: [{ label: "Gallery", value: 11.2, display: "11.2 s", tone: "bad" }] },
	play: async ({ canvas }) => {
		const track = canvas.getByRole("img", { name: "Gallery: 11.2 s" });
		const pin = track.lastElementChild as HTMLElement;
		await expect(pin.getBoundingClientRect().left).toBeLessThanOrEqual(
			track.getBoundingClientRect().right,
		);
	},
};

/** No tick labels: the zones' names alone. */
export const NoTicks: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("tone-good-text-contrast") },
	args: { ticks: undefined },
};

/** One reading. */
export const Single: Story = {
	tags: ["known-issue"],
	...quietLabels,
	args: { readings: thresholdReadings.slice(0, 1) },
};

/** No readings: the axis alone. */
export const NoReadings: Story = {
	tags: ["known-issue"],
	...quietLabels,
	args: { readings: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("img")).toHaveLength(0);
	},
};

/** On a phone with long reading labels, nothing scrolls sideways. */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	...quietLabels,
	globals: pin("phone"),
	args: {
		readings: [
			...thresholdReadings,
			{ label: "Wholesale price sheet for cafes", value: 5.4, display: "5.4 s", tone: "bad" },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
