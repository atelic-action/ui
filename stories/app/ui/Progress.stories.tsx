import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Progress } from "../../../src/app/ui";

/**
 * Shows how far a task has come, as a bar, in an app. A bar filled to a value
 * out of its `max` (100 by default). The value reaches the `progressbar`, so a
 * reader hears it; with no value the bar is indeterminate and draws empty.
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

/** The value reaches the progress bar's accessibility tree, against its range. */
export const AnnouncesItsValue: Story = {
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar", { name: "Trays baked" });
		await expect(bar).toHaveAttribute("aria-valuenow", "40");
		await expect(bar).toHaveAttribute("aria-valuemax", "100");
	},
};

/** Against its own max: three of four batches is three quarters of the track. */
export const OwnMax: Story = {
	args: { value: 3, max: 4, "aria-label": "Batches out" },
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar", { name: "Batches out" });
		await expect(bar).toHaveAttribute("aria-valuenow", "3");
		await expect(bar).toHaveAttribute("aria-valuemax", "4");
		const fill = bar.firstElementChild as HTMLElement;
		const track = bar.getBoundingClientRect();
		await expect(Math.round(fill.getBoundingClientRect().right - track.left)).toBe(
			Math.round(track.width * 0.75),
		);
	},
};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

/** With no value at all: an indeterminate bar that reports no value, the fill at nothing. */
export const NoValue: Story = {
	args: { value: undefined },
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("progressbar", { name: "Trays baked" });
		await expect(bar).not.toHaveAttribute("aria-valuenow");
		const fill = bar.firstElementChild as HTMLElement;
		await expect(fill.getBoundingClientRect().right).toBeLessThanOrEqual(
			bar.getBoundingClientRect().left + 0.5,
		);
	},
};

/** The fill takes a class of its own, as a warning tone. */
export const OwnFill: Story = { args: { value: 85, indicatorClassName: "bg-brand" } };
