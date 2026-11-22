import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Label, Slider } from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";

/**
 * A range on a track with one thumb, stepped by the keyboard. The wrapper
 * draws its own thumb and passes it nothing, so the thumb (the `slider` a
 * reader reaches) can never be named: neither a label nor an `aria-label` on
 * the slider reaches it. Every story carries the marker.
 */
const meta = {
	title: "App/UI/Slider",
	component: Slider,
	tags: ["known-issue"],
	parameters: { layout: "padded", ...knownIssues("slider-thumb-unnamed") },
	args: { defaultValue: [12], min: 0, max: 48, step: 1, onValueChange: fn() },
	render: (args) => (
		<div className="max-w-sm space-y-3">
			<Label id="trays-label">Trays</Label>
			<Slider {...args} aria-labelledby="trays-label" />
		</div>
	),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The keyboard: the arrows step by one, Page keys by a tenth, Home and End to the ends. */
export const Keyboard: Story = {
	play: async ({ canvas, args, step }) => {
		const thumb = canvas.getByRole("slider");
		await step("it reports its range and value", async () => {
			await expect(thumb).toHaveAttribute("aria-valuemin", "0");
			await expect(thumb).toHaveAttribute("aria-valuemax", "48");
			await expect(thumb).toHaveAttribute("aria-valuenow", "12");
		});
		await step("ArrowRight and ArrowUp step up by one, ArrowLeft down", async () => {
			thumb.focus();
			await userEvent.keyboard("{ArrowRight}{ArrowUp}");
			await expect(thumb).toHaveAttribute("aria-valuenow", "14");
			await userEvent.keyboard("{ArrowLeft}");
			await expect(thumb).toHaveAttribute("aria-valuenow", "13");
			await expect(args.onValueChange).toHaveBeenLastCalledWith([13]);
		});
		await step("PageUp steps by a tenth of the range", async () => {
			await userEvent.keyboard("{PageUp}");
			await expect(Number(thumb.getAttribute("aria-valuenow"))).toBeGreaterThan(13);
		});
		await step("Home and End go to the ends", async () => {
			await userEvent.keyboard("{End}");
			await expect(thumb).toHaveAttribute("aria-valuenow", "48");
			await userEvent.keyboard("{Home}");
			await expect(thumb).toHaveAttribute("aria-valuenow", "0");
		});
	},
};

/** The thumb sits where the value is along the track. */
export const Halfway: Story = {
	args: { defaultValue: [24] },
	play: async ({ canvas }) => {
		const slider = canvas.getByRole("slider");
		const thumb = slider.getBoundingClientRect();
		// The track has no role; it is the slider root around the thumb's wrapper.
		const root = slider.parentElement?.parentElement;
		if (!root) throw new Error("The slider's root is missing.");
		const track = root.getBoundingClientRect();
		const middle = thumb.left + thumb.width / 2;
		await expect(Math.abs(middle - (track.left + track.width / 2))).toBeLessThan(thumb.width);
	},
};

/** A step of six trays. */
export const Stepped: Story = {
	args: { step: 6 },
	play: async ({ canvas }) => {
		const thumb = canvas.getByRole("slider");
		thumb.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "18");
	},
};

/** Disabled: the keys do nothing. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args }) => {
		const thumb = canvas.getByRole("slider");
		thumb.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "12");
		await expect(args.onValueChange).not.toHaveBeenCalled();
	},
};
