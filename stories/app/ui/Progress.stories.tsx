import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Progress } from "../../../src/app/ui";
import { knownBug } from "../../support/known-issues";

/**
 * A bar filled to a value out of 100. The wrapper reads `value` for the fill
 * and never hands it to the Radix root, so the bar draws its value but tells
 * a screen reader nothing: no `aria-valuenow`, and an indeterminate state.
 */
const meta = {
	title: "App/UI/Progress",
	component: Progress,
	parameters: { layout: "padded" },
	args: { value: 40, "aria-label": "Trays baked" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Forty percent: the fill reaches forty percent of the track. */
export const Partway: Story = {
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar", { name: "Trays baked" });
		const fill = bar.firstElementChild as HTMLElement;
		const track = bar.getBoundingClientRect();
		await expect(Math.round(fill.getBoundingClientRect().right - track.left)).toBe(
			Math.round(track.width * 0.4),
		);
	},
};

/** The value should reach the progress bar's accessibility tree. */
export const AnnouncesItsValue: Story = {
	tags: ["known-issue"],
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar", { name: "Trays baked" });
		await knownBug("progress-value-dropped", async () => {
			await expect(bar).toHaveAttribute("aria-valuenow", "40");
		});
	},
};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

/** With no value at all: an indeterminate bar, the fill at nothing. */
export const NoValue: Story = { args: { value: undefined } };

/** The fill takes a class of its own, as a warning tone. */
export const OwnFill: Story = { args: { value: 85, indicatorClassName: "bg-brand" } };
