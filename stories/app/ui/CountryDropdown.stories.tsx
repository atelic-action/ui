import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import { CountryDropdown, Label } from "../../../src/app/ui";
import { knownBug, knownIssues } from "../../support/known-issues";
import { pin } from "../../support/viewports";

/**
 * Every flag the dropdown draws is an image on an outside host
 * (`react-circle-flags.pages.dev`), the library's default. The stories serve
 * a local stand in instead, so no story reaches the network, and record each
 * outside address the component asked for.
 */
const FLAG_HOST = "https://react-circle-flags.pages.dev/";
const flags = { asked: [] as string[] };

function serveFlagsLocally() {
	flags.asked = [];
	const setAttribute = Element.prototype.setAttribute;
	Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
		if (this instanceof HTMLImageElement && name === "src" && value.startsWith(FLAG_HOST)) {
			flags.asked.push(value);
			return setAttribute.call(this, name, "/images/email-app/flag.svg");
		}
		return setAttribute.call(this, name, value);
	};
	return () => {
		Element.prototype.setAttribute = setAttribute;
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
 * A searchable country picker in a popover: a trigger that shows the chosen
 * country and its flag, a search box, and every country as an option, with
 * "Not specified" first to clear it.
 */
const meta = {
	title: "App/UI/CountryDropdown",
	component: CountryDropdown,
	parameters: { layout: "padded" },
	beforeEach: serveFlagsLocally,
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
		await step("a click opens it with focus in the search box", async () => {
			await userEvent.click(trigger);
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			await waitFor(() => expect(screen.getByPlaceholderText("Search country...")).toHaveFocus());
		});
		await step("typing filters the countries", async () => {
			await userEvent.keyboard("iceland");
			const list = within(screen.getByRole("listbox"));
			await waitFor(() =>
				expect(list.getAllByRole("option").map((option) => option.textContent)).toEqual([
					"Iceland",
				]),
			);
		});
		await step("Enter picks it, closes, and the trigger shows it", async () => {
			await userEvent.keyboard("{Enter}");
			await expect(args.onChange).toHaveBeenCalledWith("Iceland");
			await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
			await expect(trigger).toHaveTextContent("Iceland");
			await expect(trigger).toHaveFocus();
		});
	},
};

/** Escape closes it without a pick, and focus returns to the trigger. */
export const Escape: Story = {
	play: async ({ canvas, args }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await userEvent.click(trigger);
		await screen.findByRole("listbox");
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
		await expect(trigger).toHaveFocus();
		await expect(args.onChange).not.toHaveBeenCalled();
	},
};

/** Chosen by its two letter code; "Not specified" clears it. */
export const ChosenThenCleared: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("country-popover-unnamed", "country-list-holds-the-search") },
	args: { value: "PT" },
	play: async ({ canvas, args }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toHaveTextContent("Portugal");
		await userEvent.click(trigger);
		await userEvent.click(await screen.findByRole("option", { name: /Not specified/ }));
		await expect(args.onChange).toHaveBeenCalledWith("");
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

/** Every flag is fetched from an outside host the app does not own. */
export const FlagsFromAnOutsideHost: Story = {
	tags: ["known-issue"],
	parameters: {
		...knownIssues(
			"country-popover-unnamed",
			"country-list-holds-the-search",
			"app-muted-on-grey-contrast",
		),
	},
	args: { value: "PT" },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Ships to" }));
		await screen.findByRole("listbox");
		await knownBug("country-flags-from-outside-host", async () => {
			await expect(flags.asked).toEqual([]);
		});
		await expect(flags.asked.length).toBeGreaterThan(200);
	},
};

/** Left open on a phone, so the check reads the open list; it fits the screen. */
export const OpenPhone: Story = {
	tags: ["known-issue"],
	parameters: {
		...knownIssues(
			"country-popover-unnamed",
			"country-list-holds-the-search",
			"app-muted-on-grey-contrast",
		),
	},
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Ships to" }));
		const list = await screen.findByRole("listbox");
		await waitFor(() => expect(list).toBeVisible());
		await expect(list.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
	},
};
