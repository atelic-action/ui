import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Label, Slider } from "../../../src/app/ui";

/**
 * A range on a track, a thumb per value, stepped by the keyboard. The thumb
 * is the `slider` a reader reaches, and the slider's name (`aria-labelledby`
 * or `aria-label`) lands on it; a range names each thumb with `thumbLabels`.
 */
const meta = {
	title: "App/UI/Slider",
	component: Slider,
	parameters: { layout: "padded" },
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
		const thumb = canvas.getByRole("slider", { name: "Trays" });
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

/** Named by an `aria-label` alone, with no visible label: the name reaches the thumb. */
export const NamedByAriaLabel: Story = {
	render: (args) => (
		<div className="max-w-sm">
			<Slider {...args} aria-label="Hydration" />
		</div>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("slider", { name: "Hydration" })).toHaveAttribute(
			"aria-valuenow",
			"12",
		);
	},
};

/** A range: two thumbs, each named for what it sets. */
export const Range: Story = {
	args: { defaultValue: [6, 30] },
	render: (args) => (
		<div className="max-w-sm">
			<Slider {...args} thumbLabels={["Fewest trays", "Most trays"]} />
		</div>
	),
	play: async ({ canvas, userEvent }) => {
		const fewest = canvas.getByRole("slider", { name: "Fewest trays" });
		const most = canvas.getByRole("slider", { name: "Most trays" });
		await expect(fewest).toHaveAttribute("aria-valuenow", "6");
		await expect(most).toHaveAttribute("aria-valuenow", "30");
		most.focus();
		await userEvent.keyboard("{ArrowLeft}");
		await expect(most).toHaveAttribute("aria-valuenow", "29");
	},
};
