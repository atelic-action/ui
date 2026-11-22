import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Input, Label } from "../../../src/app/ui";

/** The kit's text field, with its label beside it as a form sets it. */
const meta = {
	title: "App/UI/Input",
	component: Input,
	parameters: { layout: "padded" },
	args: { id: "cafe", placeholder: "Larkspur Coffee Bar", onChange: fn() },
	render: (args) => (
		<div className="max-w-sm space-y-2">
			<Label htmlFor="cafe">Cafe</Label>
			<Input {...args} />
		</div>
	),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named by its label; typing reaches it. */
export const Default: Story = {
	play: async ({ canvas, args }) => {
		const field = canvas.getByRole("textbox", { name: "Cafe" });
		await userEvent.type(field, "Wicket Lane Deli");
		await expect(field).toHaveValue("Wicket Lane Deli");
		await expect(args.onChange).toHaveBeenCalled();
	},
};

/** A value already in it. */
export const Filled: Story = {
	args: { defaultValue: "Fairhaven Grocery Cooperative" },
};

/** Disabled: no typing reaches it. */
export const Disabled: Story = {
	args: { disabled: true, defaultValue: "Larkspur Coffee Bar" },
	play: async ({ canvas }) => {
		const field = canvas.getByRole("textbox", { name: "Cafe" });
		await expect(field).toBeDisabled();
		await userEvent.type(field, "x");
		await expect(field).toHaveValue("Larkspur Coffee Bar");
	},
};

/** Invalid, the way a form marks it. */
export const Invalid: Story = {
	args: { "aria-invalid": true, defaultValue: "" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("textbox", { name: "Cafe" })).toBeInvalid();
	},
};

/** The other types it takes: a number, an email, a date. */
export const Types: Story = {
	render: () => (
		<div className="max-w-sm space-y-3">
			<Label htmlFor="trays">Trays</Label>
			<Input id="trays" type="number" defaultValue={4} />
			<Label htmlFor="email">Order email</Label>
			<Input id="email" type="email" defaultValue="orders@example.com" />
			<Label htmlFor="start">Starts</Label>
			<Input id="start" type="date" defaultValue="2026-12-01" />
		</div>
	),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("spinbutton", { name: "Trays" })).toHaveValue(4);
		await expect(canvas.getByRole("textbox", { name: "Order email" })).toHaveValue(
			"orders@example.com",
		);
	},
};
