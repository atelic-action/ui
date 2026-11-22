import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import {
	Label,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";
import { pin } from "../../support/viewports";

/**
 * The raw select parts, for what `OptionSelect` does not express: grouped
 * options under labels, a separator, a disabled option. The trigger is named
 * by its label.
 */
const meta = {
	title: "App/UI/Select",
	component: Select,
	parameters: { layout: "padded" },
	args: { onValueChange: fn() },
	render: (args) => (
		<div className="max-w-xs space-y-2">
			<Label htmlFor="flour">Flour</Label>
			<Select {...args}>
				<SelectTrigger id="flour">
					<SelectValue placeholder="Choose a flour" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Wheat</SelectLabel>
						<SelectItem value="bread">Bread flour</SelectItem>
						<SelectItem value="whole">Whole wheat</SelectItem>
					</SelectGroup>
					<SelectSeparator />
					<SelectGroup>
						<SelectLabel>Other grains</SelectLabel>
						<SelectItem value="rye">Dark rye</SelectItem>
						<SelectItem value="spelt" disabled>
							Spelt (out of stock)
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed: the placeholder, named by its label. */
export const Placeholder: Story = {
	play: async ({ canvas }) => {
		const select = canvas.getByRole("combobox", { name: "Flour" });
		await expect(select).toHaveTextContent("Choose a flour");
		await expect(select).toHaveAttribute("aria-expanded", "false");
	},
};

/** Open by click, the groups named by their labels; a pick shows and is reported. */
export const PickByClick: Story = {
	play: async ({ canvas, args }) => {
		const select = canvas.getByRole("combobox", { name: "Flour" });
		await userEvent.click(select);
		const list = within(await screen.findByRole("listbox"));
		await expect(list.getByRole("group", { name: "Other grains" })).toBeInTheDocument();
		await expect(list.getByRole("option", { name: "Spelt (out of stock)" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		await userEvent.click(list.getByRole("option", { name: "Dark rye" }));
		await waitFor(() => expect(select).toHaveTextContent("Dark rye"));
		await expect(args.onValueChange).toHaveBeenCalledWith("rye");
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull(), { timeout: 5000 });
	},
};

/** The keyboard: Space opens, the arrows skip the disabled option, Enter picks, focus returns. */
export const Keyboard: Story = {
	args: { defaultValue: "whole" },
	play: async ({ canvas, args }) => {
		const select = canvas.getByRole("combobox", { name: "Flour" });
		select.focus();
		await userEvent.keyboard(" ");
		await waitFor(() => expect(screen.getByRole("option", { name: "Whole wheat" })).toHaveFocus());
		await userEvent.keyboard("{ArrowDown}");
		await expect(screen.getByRole("option", { name: "Dark rye" })).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(screen.getByRole("option", { name: "Dark rye" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await waitFor(() => expect(select).toHaveTextContent("Dark rye"));
		await expect(args.onValueChange).toHaveBeenCalledWith("rye");
		await waitFor(() => expect(select).toHaveFocus());
	},
};

/** Escape closes it with no pick. */
export const Escape: Story = {
	play: async ({ canvas, args }) => {
		const select = canvas.getByRole("combobox", { name: "Flour" });
		await userEvent.click(select);
		await screen.findByRole("listbox");
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull(), { timeout: 5000 });
		await expect(args.onValueChange).not.toHaveBeenCalled();
		await expect(select).toHaveFocus();
	},
};

/** Disabled: it does not open. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("combobox", { name: "Flour" })).toBeDisabled();
	},
};

/** Left open, so the check reads the open list with its groups. */
export const Open: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-radix-hides-page") },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("combobox", { name: "Flour" }));
		const list = await screen.findByRole("listbox");
		await waitFor(() => expect(list).toBeVisible());
	},
};
