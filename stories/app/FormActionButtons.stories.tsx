import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { FormActionButtons } from "../../src/app";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * A form's Save and Cancel: side by side and right aligned from `sm` up,
 * stacked full width on a phone with Save on top. Without an `onSave` the
 * save button submits its form.
 */
const meta = {
	title: "App/FormActionButtons",
	component: FormActionButtons,
	parameters: { layout: "padded" },
	args: { onSave: fn(), onCancel: fn() },
	globals: pin("desktop"),
} satisfies Meta<typeof FormActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cancel then Save on one line at the right. */
export const Default: Story = {
	play: async ({ canvas, args, userEvent }) => {
		const save = canvas.getByRole("button", { name: "Save" });
		const cancel = canvas.getByRole("button", { name: "Cancel" });
		await expect(
			Math.abs(save.getBoundingClientRect().top - cancel.getBoundingClientRect().top),
		).toBeLessThan(1);
		await expect(save.getBoundingClientRect().left).toBeGreaterThan(
			cancel.getBoundingClientRect().right,
		);
		await userEvent.click(save);
		await expect(args.onSave).toHaveBeenCalledOnce();
		await userEvent.click(cancel);
		await expect(args.onCancel).toHaveBeenCalledOnce();
	},
};

/** The words are the form's own. */
export const OwnWords: Story = {
	args: { saveText: "Save the standing order", cancelText: "Keep editing" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "Save the standing order" })).toBeVisible();
		await expect(canvas.getByRole("button", { name: "Keep editing" })).toBeVisible();
	},
};

/** While saving both buttons are disabled and Save says so, so a second press never submits twice. */
export const Saving: Story = {
	args: { isLoading: true },
	play: async ({ canvas, args }) => {
		const save = canvas.getByRole("button", { name: "Saving..." });
		await expect(save).toBeDisabled();
		await expect(canvas.getByRole("button", { name: "Cancel" })).toBeDisabled();
		save.click();
		await expect(args.onSave).not.toHaveBeenCalled();
	},
};

/** Disabled (an untouched form): Save is off, Cancel still works. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args, userEvent }) => {
		await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
		await userEvent.click(canvas.getByRole("button", { name: "Cancel" }));
		await expect(args.onCancel).toHaveBeenCalledOnce();
	},
};

/** Save alone. */
export const NoCancel: Story = {
	args: { showCancel: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("button", { name: "Cancel" })).toBeNull();
	},
};

/** The submit spy, fresh for each run of the story. */
const FormSubmit: { spy?: ReturnType<typeof fn> } = {};

/** Without `onSave`, Save submits the form around it, once, by click or by Enter in a field. */
export const SubmitsItsForm: Story = {
	args: { onSave: undefined },
	render: (args) => {
		return (
			<form
				aria-label="Standing order"
				onSubmit={(event) => {
					event.preventDefault();
					FormSubmit.spy?.();
				}}
			>
				<label>
					Trays
					<input name="trays" defaultValue="4" />
				</label>
				<FormActionButtons {...args} />
			</form>
		);
	},
	beforeEach: () => {
		FormSubmit.spy = fn();
	},
	play: async ({ canvas, userEvent }) => {
		const save = canvas.getByRole("button", { name: "Save" });
		await expect(save).toHaveAttribute("type", "submit");
		await userEvent.click(save);
		await expect(FormSubmit.spy).toHaveBeenCalledOnce();
		await userEvent.type(canvas.getByRole("textbox", { name: "Trays" }), "{Enter}");
		await expect(FormSubmit.spy).toHaveBeenCalledTimes(2);
	},
};

/** On a phone they stack full width, Save on top where the thumb reaches first. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const save = canvas.getByRole("button", { name: "Save" });
		const cancel = canvas.getByRole("button", { name: "Cancel" });
		await expect(save.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			cancel.getBoundingClientRect().top,
		);
		await expect(Math.round(save.getBoundingClientRect().width)).toBe(
			Math.round(cancel.getBoundingClientRect().width),
		);
		await expectNoSidewaysScroll();
	},
};
