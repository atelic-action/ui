import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";
import { Checkbox, Input, Label } from "../../../src/app/ui";

/**
 * Names a form control in an app, so a press on the name reaches the control.
 * The kit's label: it names its control, and a press on it focuses or toggles
 * the control.
 */
const meta = {
	title: "App/UI/Label",
	component: Label,
	parameters: { layout: "padded" },
	args: { children: "Drop time", htmlFor: "drop" },
	render: (args) => (
		<div className="max-w-sm space-y-2">
			<Label {...args} />
			<Input id="drop" defaultValue="06:15" />
		</div>
	),
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/** It names the field, and a press on it moves focus into the field. */
export const ForAField: Story = {
	play: async ({ canvas }) => {
		const field = canvas.getByRole("textbox", { name: "Drop time" });
		await userEvent.click(canvas.getByText("Drop time"));
		await expect(field).toHaveFocus();
	},
};

/** Beside a disabled control (the `peer` before it) it dims. */
export const ForADisabledCheckbox: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="sundays" disabled />
			<Label htmlFor="sundays">Deliver on Sundays</Label>
		</div>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("checkbox", { name: "Deliver on Sundays" })).toBeDisabled();
	},
};
