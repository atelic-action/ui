import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { ThresholdScale } from "../../src/components";
import { thresholdReadings, thresholdTicks, thresholdZones } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Shows where a reading falls against the lines that call it good, slow, or
 * poor. A scale with zones and one line a reading: where a number sits against
 * the lines that decide good, slow, and poor. Each track is a picture named by
 * its reading.
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

/**
 * Each reading's track is named by its label, its figure, and the zone it
 * falls in; the pin sits at its share of the scale.
 */
export const Default: Story = {
	play: async ({ canvas }) => {
		const home = canvas.getByRole("img", { name: "Home page: 4.1 s, Poor" });
		await expect(canvas.getByRole("img", { name: "Menu: 3.2 s, Slow" })).toBeInTheDocument();
		await expect(canvas.getByRole("img", { name: "Order ahead: 1.9 s, Good" })).toBeInTheDocument();
		const track = home.getBoundingClientRect();
		const pin = home.lastElementChild as HTMLElement;
		const at = pin.getBoundingClientRect();
		const share = (at.left + at.width / 2 - track.left) / track.width;
		await expect(Math.abs(share - 4.1 / 6)).toBeLessThan(0.03);
	},
};

/**
 * Which zone a reading falls in is the point of the scale, so the track's
 * name says it beside the figure ("Home page: 4.1 s, Poor"); the zone
 * labels and their lines stay hidden, since the name already carries them.
 */
export const ZoneIsSpoken: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: /^Home page: 4\.1 s/ })).toHaveAccessibleName(
			"Home page: 4.1 s, Poor",
		);
	},
};

/**
 * A reading past the far end pins at the end of the track, never beyond it:
 * the pin, centered on its reading, centers on the track's last point, and
 * the name puts it in the last zone.
 */
export const PastTheEnd: Story = {
	args: { readings: [{ label: "Photos", value: 11.2, display: "11.2 s", tone: "bad" }] },
	play: async ({ canvas }) => {
		const track = canvas.getByRole("img", { name: "Photos: 11.2 s, Poor" });
		const pin = (track.lastElementChild as HTMLElement).getBoundingClientRect();
		const center = pin.left + pin.width / 2;
		await expect(Math.abs(center - track.getBoundingClientRect().right)).toBeLessThan(1);
	},
};

/** No tick labels: the zones' names alone. */
export const NoTicks: Story = {
	args: { ticks: undefined },
};

/** One reading. */
export const Single: Story = {
	args: { readings: thresholdReadings.slice(0, 1) },
};

/** No readings: the axis alone. */
export const NoReadings: Story = {
	args: { readings: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("img")).toHaveLength(0);
	},
};

/** On a phone with long reading labels, nothing scrolls sideways. */
export const LongestOnPhone: Story = {
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
