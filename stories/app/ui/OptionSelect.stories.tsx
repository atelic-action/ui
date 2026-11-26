import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { OptionSelect } from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";
import { layerOpened, noneLeft, until } from "../../support/settle";
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

/**
 * Lets a reader pick one value from a short flat list in an app, as a toolbar
 * filter does; use `Select` when the options need grouping. A single select
 * over a flat list of options, named by its `ariaLabel`: the toolbar's filter.
 */
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
			const list = within(await layerOpened(() => screen.getByRole("listbox")));
			await expect(list.getByRole("option", { name: "Every van" })).toHaveAttribute(
				"aria-selected",
				"true",
			);
			await userEvent.click(list.getByRole("option", { name: "Late drop" }));
		});
		await step("the pick shows, is reported, and focus is back on the select", async () => {
			await until(() => expect(select).toHaveTextContent("Late drop"));
			await expect(args.onValueChange).toHaveBeenCalledWith("late");
			await until(() => expect(select).toHaveFocus());
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
			await until(() => expect(screen.getByRole("option", { name: "Every van" })).toHaveFocus());
		});
		await step("ArrowDown moves, and typing jumps to a match", async () => {
			await userEvent.keyboard("{ArrowDown}");
			await expect(screen.getByRole("option", { name: "North loop" })).toHaveFocus();
			await userEvent.keyboard("h");
			await until(() =>
				expect(screen.getByRole("option", { name: "Harbor and the market" })).toHaveFocus(),
			);
		});
		await step("Enter picks it", async () => {
			await userEvent.keyboard("{Enter}");
			await until(() => expect(select).toHaveTextContent("Harbor and the market"));
			await expect(args.onValueChange).toHaveBeenCalledWith("harbor");
		});
		await step("Escape closes without a pick", async () => {
			await userEvent.keyboard("{Enter}");
			await layerOpened(() => screen.getByRole("listbox"));
			await userEvent.keyboard("{ArrowDown}{Escape}");
			await noneLeft(() => screen.queryByRole("listbox"));
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
 * On a phone with the trigger as wide as the screen, the open list keeps
 * inside the screen: never wider than its trigger, its border and padding
 * inside that width, and no wider than the room the popper leaves.
 */
export const Phone: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-radix-hides-page") },
	args: { className: "w-full" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("combobox", { name: "Van" });
		await userEvent.click(trigger);
		// The list opens with an animation; wait on it, not on a clock.
		const list = await layerOpened(() => screen.getByRole("listbox"));
		const box = list.getBoundingClientRect();
		await expect(box.left).toBeGreaterThanOrEqual(0);
		await expect(box.right).toBeLessThanOrEqual(window.innerWidth);
		await expect(box.width).toBeLessThanOrEqual(trigger.getBoundingClientRect().width);
	},
};

/**
 * With room to spare (the trigger set in from the screen's edge, past the
 * popper's collision padding), the open list is exactly its trigger's width
 * and starts where it does, its border inside it.
 */
export const MatchesItsTrigger: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-radix-hides-page") },
	render: (args) => (
		<div className="p-8">
			<Held {...args} />
		</div>
	),
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("combobox", { name: "Van" });
		await userEvent.click(trigger);
		const list = await layerOpened(() => screen.getByRole("listbox"));
		const box = list.getBoundingClientRect();
		const field = trigger.getBoundingClientRect();
		await expect(Math.abs(box.width - field.width)).toBeLessThan(1);
		await expect(Math.abs(box.left - field.left)).toBeLessThan(1);
	},
};
