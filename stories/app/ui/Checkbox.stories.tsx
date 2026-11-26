import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { Checkbox, Label } from "../../../src/app/ui";

/**
 * Takes a yes or no, or any number from a list, in an app form. A checkbox
 * with its label, the way a form's option is set.
 */
const meta = {
	title: "App/UI/Checkbox",
	component: Checkbox,
	parameters: { layout: "padded" },
	args: { id: "saturdays", onCheckedChange: fn() },
	render: (args) => (
		<div className="flex items-center gap-2">
			<Checkbox {...args} />
			<Label htmlFor="saturdays">Deliver on Saturdays</Label>
		</div>
	),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click, the label, and Space all toggle it, and it reports each change. */
export const Toggle: Story = {
	play: async ({ canvas, args, userEvent, step }) => {
		const box = canvas.getByRole("checkbox", { name: "Deliver on Saturdays" });
		await step("starts unchecked", async () => {
			await expect(box).not.toBeChecked();
		});
		await step("a click checks it", async () => {
			await userEvent.click(box);
			await expect(box).toBeChecked();
			await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
		});
		await step("its label unchecks it", async () => {
			await userEvent.click(canvas.getByText("Deliver on Saturdays"));
			await expect(box).not.toBeChecked();
		});
		await step("Space from the keyboard checks it again", async () => {
			box.focus();
			await userEvent.keyboard(" ");
			await expect(box).toBeChecked();
			await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
		});
	},
};

/** Checked from the start. */
export const Checked: Story = {
	args: { defaultChecked: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("checkbox", { name: "Deliver on Saturdays" })).toBeChecked();
	},
};

/** Part checked: some of the days. */
export const Indeterminate: Story = {
	args: { checked: "indeterminate" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("checkbox", { name: "Deliver on Saturdays" })).toHaveAttribute(
			"aria-checked",
			"mixed",
		);
	},
};

/** Disabled: nothing changes it. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args }) => {
		const box = canvas.getByRole("checkbox", { name: "Deliver on Saturdays" });
		await expect(box).toBeDisabled();
		box.click();
		await expect(box).not.toBeChecked();
		await expect(args.onCheckedChange).not.toHaveBeenCalled();
	},
};
