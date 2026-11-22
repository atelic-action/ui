import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Label, Textarea } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

/** The kit's multi line field, with its label. */
const meta = {
	title: "App/UI/Textarea",
	component: Textarea,
	parameters: { layout: "padded" },
	args: { id: "note", placeholder: "Gate code, where to leave the trays", onChange: fn() },
	render: (args) => (
		<div className="max-w-md space-y-2">
			<Label htmlFor="note">Note for the driver</Label>
			<Textarea {...args} />
		</div>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named by its label; typing and new lines reach it. */
export const Default: Story = {
	play: async ({ canvas, args }) => {
		const field = canvas.getByRole("textbox", { name: "Note for the driver" });
		await userEvent.type(field, "Side door.{Enter}Code 4417.");
		await expect(field).toHaveValue("Side door.\nCode 4417.");
		await expect(args.onChange).toHaveBeenCalled();
	},
};

/** Disabled: nothing reaches it. */
export const Disabled: Story = {
	args: { disabled: true, defaultValue: "Side door." },
	play: async ({ canvas }) => {
		const field = canvas.getByRole("textbox", { name: "Note for the driver" });
		await expect(field).toBeDisabled();
		await userEvent.type(field, "x");
		await expect(field).toHaveValue("Side door.");
	},
};

/** A long note on a phone wraps inside the field. */
export const LongNotePhone: Story = {
	args: {
		defaultValue:
			"Use the side door on Wicket Lane, not the front; the code is 4417. Trays go on the rack left of the walk in, and the empties come back on the bottom shelf.",
	},
	globals: pin("phone"),
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
