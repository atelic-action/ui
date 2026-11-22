import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { OptionSelect } from "../../../src/app/ui";
import { knownBug, knownIssues } from "../../support/known-issues";
import { pin } from "../../support/viewports";

const vans = [
	{ value: "all", label: "Every van" },
	{ value: "north", label: "North loop" },
	{ value: "harbor", label: "Harbor and the market" },
	{ value: "late", label: "Late drop" },
];

function Held({ value: initial, onValueChange, ...props }: Parameters<typeof OptionSelect>[0]) {
	const [value, setValue] = useState(initial);
	return (
		<OptionSelect
			{...props}
			value={value}
			onValueChange={(next) => {
				setValue(next);
				onValueChange(next);
			}}
		/>
	);
}

/** A single select over a flat list of options, named by its `ariaLabel`: the toolbar's filter. */
const meta = {
	title: "App/UI/OptionSelect",
	component: OptionSelect,
	parameters: { layout: "padded" },
	args: { options: vans, ariaLabel: "Van", value: "all", onValueChange: fn(), className: "w-56" },
	render: (args) => <Held {...args} />,
	globals: pin("desktop"),
} satisfies Meta<typeof OptionSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click opens the options with the current one checked; a click on another picks it. */
export const ByClick: Story = {
	play: async ({ canvas, args, step }) => {
		const select = canvas.getByRole("combobox", { name: "Van" });
		await step("closed, showing the value", async () => {
			await expect(select).toHaveTextContent("Every van");
			await expect(select).toHaveAttribute("aria-expanded", "false");
		});
		await step("opens on the options, the current one selected", async () => {
			await userEvent.click(select);
			const list = within(await screen.findByRole("listbox"));
			await expect(list.getByRole("option", { name: "Every van" })).toHaveAttribute(
				"aria-selected",
				"true",
			);
			await userEvent.click(list.getByRole("option", { name: "Late drop" }));
		});
		await step("the pick shows, is reported, and focus is back on the select", async () => {
			await waitFor(() => expect(select).toHaveTextContent("Late drop"));
			await expect(args.onValueChange).toHaveBeenCalledWith("late");
			await waitFor(() => expect(select).toHaveFocus());
		});
	},
};

/** The keyboard: Enter opens, the arrows move, typing jumps, Enter picks, Escape backs out. */
export const Keyboard: Story = {
	play: async ({ canvas, args, step }) => {
		const select = canvas.getByRole("combobox", { name: "Van" });
		await step("Enter opens it on the current option", async () => {
			select.focus();
			await userEvent.keyboard("{Enter}");
			await waitFor(() => expect(screen.getByRole("option", { name: "Every van" })).toHaveFocus());
		});
		await step("ArrowDown moves, and typing jumps to a match", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(screen.getByRole("option", { name: "North loop" })).toHaveFocus();
			await userEvent.keyboard("h");
			await waitFor(() =>
				expect(screen.getByRole("option", { name: "Harbor and the market" })).toHaveFocus(),
			);
		});
		await step("Enter picks it", async () => {
			await userEvent.keyboard("{Enter}");
			await waitFor(() => expect(select).toHaveTextContent("Harbor and the market"));
			await expect(args.onValueChange).toHaveBeenCalledWith("harbor");
		});
		await step("Escape closes without a pick", async () => {
			await userEvent.keyboard("{Enter}");
			await screen.findByRole("listbox");
			await userEvent.keyboard("{ArrowDown}{Escape}");
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
			await expect(select).toHaveTextContent("Harbor and the market");
			await expect(args.onValueChange).toHaveBeenCalledTimes(1);
		});
	},
};

/** No value: the placeholder. */
export const Placeholder: Story = {
	args: { value: undefined, placeholder: "Choose a van" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("combobox", { name: "Van" })).toHaveTextContent("Choose a van");
	},
};

/**
 * On a phone at full width, the options should fit the screen. The list is
 * the trigger's width plus its own border and padding, so it runs past the
 * trigger's right edge and off the screen.
 */
export const Phone: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-radix-hides-page") },
	args: { className: "w-full" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("combobox", { name: "Van" }));
		const list = await screen.findByRole("listbox");
		await Promise.all(list.getAnimations().map((animation) => animation.finished));
		await knownBug("select-list-wider-than-trigger", async () => {
			await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
