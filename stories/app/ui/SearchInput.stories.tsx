import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import { SearchInput } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

function Held({ value: initial, onValueChange, ...props }: Parameters<typeof SearchInput>[0]) {
	const [value, setValue] = useState(initial);
	return (
		<SearchInput
			{...props}
			value={value}
			onValueChange={(next) => {
				setValue(next);
				onValueChange(next);
			}}
		/>
	);
}

/**
 * The kit's search field: a search icon, the box, and a clear button once
 * there is something to clear. Escape clears it too.
 */
const meta = {
	title: "App/UI/SearchInput",
	component: SearchInput,
	parameters: { layout: "padded" },
	args: { value: "", onValueChange: fn(), onClear: fn(), placeholder: "Search recipes" },
	render: (args) => <Held {...args} />,
	globals: pin("desktop"),
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty: named Search, the placeholder showing, no clear button. */
export const Empty: Story = {
	play: async ({ canvas }) => {
		const box = canvas.getByRole("textbox", { name: "Search" });
		await expect(box).toHaveAttribute("placeholder", "Search recipes");
		await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();
	},
};

/** A name of the page's own. */
export const OwnName: Story = {
	args: { "aria-label": "Search recipes" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("textbox", { name: "Search recipes" })).toBeVisible();
	},
};

/** Typing reports each change and brings the clear button; a click on it clears and keeps focus in the box. */
export const TypeAndClear: Story = {
	play: async ({ canvas, args, step }) => {
		const box = canvas.getByRole("textbox", { name: "Search" });
		await step("typing reports the value", async () => {
			await userEvent.type(box, "rye");
			await expect(args.onValueChange).toHaveBeenLastCalledWith("rye");
		});
		await step("a click on clear empties it, reports it, and focus stays in the box", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));
			await expect(box).toHaveValue("");
			await expect(args.onClear).toHaveBeenCalledOnce();
			await expect(box).toHaveFocus();
			await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();
		});
	},
};

/** Escape clears a value, and only a value: on an empty box it passes through. */
export const EscapeClears: Story = {
	args: { value: "country", onKeyDown: fn() },
	play: async ({ canvas, args }) => {
		const box = canvas.getByRole("textbox", { name: "Search" });
		box.focus();
		await userEvent.keyboard("{Escape}");
		await expect(box).toHaveValue("");
		await expect(args.onClear).toHaveBeenCalledOnce();
		await userEvent.keyboard("{Escape}");
		await expect(args.onClear).toHaveBeenCalledOnce();
		await expect(args.onKeyDown).toHaveBeenCalledTimes(2);
	},
};

/**
 * Clearing from the keyboard: Tab to the clear button and press Enter. The
 * button removes itself, and focus lands back in the box.
 */
export const ClearByKeyboard: Story = {
	args: { value: "country" },
	play: async ({ canvas }) => {
		const box = canvas.getByRole("textbox", { name: "Search" });
		box.focus();
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Clear search" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(box).toHaveValue("");
		await expect(box).toHaveFocus();
	},
};

/** A long query on a phone stays inside the box, clear of the clear button. */
export const LongQueryPhone: Story = {
	args: { value: "seeded rye with toasted sunflower and a long cold retard" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const box = canvas.getByRole("textbox", { name: "Search" });
		const clear = canvas.getByRole("button", { name: "Clear search" });
		await expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(
			box.getBoundingClientRect().right,
		);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
