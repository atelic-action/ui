import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { CountryDropdown, Label } from "../../../src/app/ui";
import { layerClosed, layerOpened, until } from "../../support/settle";
import { pin } from "../../support/viewports";

/**
 * The open list, once it has finished opening: the popover named for the
 * countries, its search, and its listbox.
 */
async function openList(canvas: { getByRole: typeof screen.getByRole }) {
	await userEvent.click(canvas.getByRole("button", { name: "Ships to" }));
	const dialog = await layerOpened(() => screen.getByRole("dialog", { name: "Countries" }));
	return {
		dialog,
		search: within(dialog).getByRole("combobox"),
		list: within(dialog).getByRole("listbox"),
	};
}

function Field({ value: initial, onChange, ...props }: Parameters<typeof CountryDropdown>[0]) {
	const [value, setValue] = useState(initial);
	return (
		<div className="max-w-xs space-y-2">
			<Label htmlFor="ship-country">Ships to</Label>
			<CountryDropdown
				{...props}
				id="ship-country"
				value={value}
				onChange={(next) => {
					setValue(next);
					onChange?.(next);
				}}
			/>
		</div>
	);
}

/**
 * Lets a reader pick a country in an app form by searching the list instead of
 * scrolling it. A searchable country picker in a popover named "Countries": a
 * trigger that shows the chosen country's name, a search box above the list,
 * and every country as an option by its name alone, with "Not specified" first
 * to clear it.
 */
const meta = {
	title: "App/UI/CountryDropdown",
	component: CountryDropdown,
	parameters: { layout: "padded" },
	args: { onChange: fn() },
	render: (args) => <Field {...args} />,
	globals: pin("desktop"),
} satisfies Meta<typeof CountryDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing chosen: the placeholder, and the trigger named by its label. */
export const Placeholder: Story = {
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toHaveTextContent("Select country");
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
	},
};

/** Open, type to filter, arrow to a country, Enter picks it and closes, and focus returns. */
export const SearchAndPick: Story = {
	play: async ({ canvas, args, step }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		let open!: Awaited<ReturnType<typeof openList>>;
		await step("a click opens it with focus in the search box", async () => {
			open = await openList(canvas);
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			await until(() => expect(open.search).toHaveFocus());
		});
		await step("typing filters the countries", async () => {
			await userEvent.keyboard("iceland");
			await until(() =>
				expect(
					within(open.list)
						.getAllByRole("option")
						.map((option) => option.textContent),
				).toEqual(["Iceland"]),
			);
		});
		await step("Enter picks it, closes, and the trigger shows it", async () => {
			await userEvent.keyboard("{Enter}");
			await expect(args.onChange).toHaveBeenCalledWith("Iceland");
			await layerClosed(open.dialog);
			await expect(trigger).toHaveTextContent("Iceland");
			await expect(trigger).toHaveFocus();
		});
	},
};

/** Escape closes it without a pick, and focus returns to the trigger. */
export const Escape: Story = {
	play: async ({ canvas, args }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		const { dialog } = await openList(canvas);
		await userEvent.keyboard("{Escape}");
		await layerClosed(dialog);
		await expect(trigger).toHaveFocus();
		await expect(args.onChange).not.toHaveBeenCalled();
	},
};

/** Chosen by its two letter code; "Not specified" clears it, and the list closes. */
export const ChosenThenCleared: Story = {
	args: { value: "PT" },
	play: async ({ canvas, args }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toHaveTextContent("Portugal");
		const { dialog, list } = await openList(canvas);
		await userEvent.click(within(list).getByRole("option", { name: /Not specified/ }));
		await expect(args.onChange).toHaveBeenCalledWith("");
		await layerClosed(dialog);
		await expect(trigger).toHaveTextContent("Select country");
	},
};

/** Disabled: it does not open. */
export const Disabled: Story = {
	args: { disabled: true, value: "Portugal" },
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toBeDisabled();
	},
};

/**
 * The open list: the popover is named, its search sits above the listbox and
 * outside it, and every option is a country's name and nothing else, with
 * North Korea and the entries the data marks deleted or retired (the USSR)
 * left out.
 */
export const OpenList: Story = {
	args: { value: "PT" },
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toHaveTextContent(/^Portugal$/);
		const { dialog, search, list } = await openList(canvas);
		await expect(dialog.contains(search)).toBe(true);
		await expect(list.contains(search)).toBe(false);
		await expect(within(dialog).queryAllByRole("img")).toHaveLength(0);
		await expect(within(list).getByRole("option", { name: "Iceland" })).toHaveTextContent(
			/^Iceland$/,
		);
		const names = within(list)
			.getAllByRole("option")
			.map((option) => option.textContent);
		await expect(names).not.toContain("Korea, Democratic People's Republic Of");
		await expect(names).not.toContain("USSR");
		await expect(names).toContain("Korea, Republic Of");
		await userEvent.keyboard("{Escape}");
		await layerClosed(dialog);
	},
};

/** Left open on a phone, so the check reads the open list; it fits the screen. */
export const OpenPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const { list } = await openList(canvas);
		await expect(list).toBeVisible();
		await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
	},
};
