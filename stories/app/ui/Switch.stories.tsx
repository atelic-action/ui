import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Label, Switch } from "../../../src/app/ui";

/** An on and off switch with its label beside it. */
const meta = {
	title: "App/UI/Switch",
	component: Switch,
	parameters: { layout: "padded" },
	args: { id: "labels", onCheckedChange: fn() },
	render: (args) => (
		<div className="flex items-center gap-2">
			<Switch {...args} />
			<Label htmlFor="labels">Print delivery labels</Label>
		</div>
	),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click, the label, and Space and Enter all flip it, and it says which way it is. */
export const Toggle: Story = {
	play: async ({ canvas, args, step }) => {
		const toggle = canvas.getByRole("switch", { name: "Print delivery labels" });
		await step("starts off", async () => {
			await expect(toggle).not.toBeChecked();
		});
		await step("a click turns it on", async () => {
			await userEvent.click(toggle);
			await expect(toggle).toBeChecked();
			await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
		});
		await step("the label turns it off", async () => {
			await userEvent.click(canvas.getByText("Print delivery labels"));
			await expect(toggle).not.toBeChecked();
		});
		await step("Space and Enter flip it from the keyboard", async () => {
			toggle.focus();
			await userEvent.keyboard(" ");
			await expect(toggle).toBeChecked();
			await userEvent.keyboard("{Enter}");
			await expect(toggle).not.toBeChecked();
		});
	},
};

/** On from the start. */
export const On: Story = {
	args: { defaultChecked: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("switch", { name: "Print delivery labels" })).toBeChecked();
	},
};

/** Disabled: nothing flips it. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args }) => {
		const toggle = canvas.getByRole("switch", { name: "Print delivery labels" });
		await expect(toggle).toBeDisabled();
		toggle.click();
		await expect(args.onCheckedChange).not.toHaveBeenCalled();
	},
};
