import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";
import { ClearButton } from "../../../src/app/ui";

/**
 * Empties a field in one press, beside a search or text input. The small X
 * that clears a field. It never takes focus on a press, so the field keeps it.
 */
const meta = {
	title: "App/UI/ClearButton",
	component: ClearButton,
	parameters: { layout: "padded" },
	args: { onClick: fn() },
} satisfies Meta<typeof ClearButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named Clear by default, and a click calls its handler. */
export const Default: Story = {
	play: async ({ canvas, args, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

/** A name of the field's own. */
export const OwnName: Story = {
	args: { "aria-label": "Clear the cafe's name" },
	play: async ({ canvas, userEvent, args }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Clear the cafe's name" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

/** Beside a field, a press leaves focus in the field. */
export const KeepsFocusInTheField: Story = {
	render: (args) => (
		<div className="flex items-center gap-2">
			<input aria-label="Cafe" defaultValue="Larkspur" className="border px-2" />
			<ClearButton {...args} />
		</div>
	),
	play: async ({ canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Cafe" });
		field.focus();
		await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
		await expect(field).toHaveFocus();
	},
};

/** The clickable row the next story sets the button in, its handler fresh for each run. */
const row = { click: fn() };

/** Inside a clickable row, `stopPropagation` keeps the press from reaching the row. */
export const InsideARow: Story = {
	args: { stopPropagation: true },
	beforeEach: () => {
		row.click = fn();
	},
	render: (args) => (
		// biome-ignore lint/a11y/useKeyWithClickEvents: the row stands in for an app's clickable row
		// biome-ignore lint/a11y/noStaticElementInteractions: the row stands in for an app's clickable row
		<div onClick={() => row.click()} className="flex items-center gap-2 border p-2">
			<span>Larkspur Coffee Bar</span>
			<ClearButton {...args} />
		</div>
	),
	play: async ({ canvas, args, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
		await expect(args.onClick).toHaveBeenCalledOnce();
		await expect(row.click).not.toHaveBeenCalled();
	},
};
