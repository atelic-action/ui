import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import { CountryDropdown, getCountryFlag, Label } from "../../../src/app/ui";
import { pin } from "../../support/viewports";
import { layerClosed, layerOpened, until } from "../layers";

/**
 * Where the stories' app serves its flags. Nothing is there: every image the
 * dropdown asks for at this base is pointed at one local stand in, and the
 * address it asked for is recorded, so a story can say exactly which flags
 * were fetched and none reaches the network.
 */
const FLAGS = "/flags/";
const STAND_IN = "/images/email-app/flag.svg";
const flags = { asked: [] as string[] };

/**
 * A story's `beforeEach`: catch each flag the page asks for at `FLAGS` and
 * serve the stand in, recording the address. It puts back exactly what it
 * replaced, the prototype's own `setAttribute`, and empties the record, so
 * nothing leaks into the next story.
 */
function serveFlagsLocally() {
	flags.asked = [];
	const original = Element.prototype.setAttribute;
	Element.prototype.setAttribute = function setAttribute(
		this: Element,
		name: string,
		value: string,
	) {
		if (this instanceof HTMLImageElement && name === "src" && value.includes(FLAGS)) {
			flags.asked.push(value.slice(value.indexOf(FLAGS) + FLAGS.length));
			return original.call(this, name, STAND_IN);
		}
		return original.call(this, name, value);
	};
	return () => {
		Element.prototype.setAttribute = original;
		flags.asked = [];
	};
}

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
 * A searchable country picker in a popover named "Countries": a trigger that
 * shows the chosen country and its flag, a search box above the list, and
 * every country as an option, with "Not specified" first to clear it. It
 * fetches no flag unless the app names its own host (`flagsBaseURL`), and
 * then only the flags in view; with none it draws each country's code.
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
				).toEqual(["ISIceland"]),
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
 * With no flag host named, nothing is fetched, open or closed: each country
 * shows its two letter code in a plain circle, beside its name, which is
 * what a reader hears. The popover is named and the search sits outside the
 * listbox it controls.
 */
export const NoFlagHost: Story = {
	args: { value: "PT" },
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Ships to" });
		await expect(trigger).toHaveTextContent("PTPortugal");
		const { dialog, search, list } = await openList(canvas);
		await expect(list.contains(search)).toBe(false);
		await expect(within(dialog).queryAllByRole("img")).toHaveLength(0);
		await expect(within(list).getByRole("option", { name: /Iceland/ })).toHaveTextContent(
			"ISIceland",
		);
		await expect(flags.asked).toEqual([]);
		await expect(
			performance
				.getEntriesByType("resource")
				.filter((entry) => entry.name.includes("circle-flags")),
		).toHaveLength(0);
		await userEvent.keyboard("{Escape}");
		await layerClosed(dialog);
	},
};

/**
 * With the app's own flag host, the trigger's flag loads at once, and the
 * open list asks only for the flags in view; scrolling to the end asks for
 * the last ones, and never for all of them.
 */
export const FlagsFromTheAppsHost: Story = {
	args: { value: "PT", flagsBaseURL: FLAGS },
	play: async ({ canvas, step }) => {
		await step("closed, only the chosen country's flag", async () => {
			await expect(flags.asked).toEqual(["pt.svg"]);
		});
		const { dialog, list } = await openList(canvas);
		const options = within(list).getAllByRole("option");
		await step("open, the flags in view and no more", async () => {
			await until(() => expect(flags.asked.length).toBeGreaterThan(1));
			await expect(flags.asked.length).toBeLessThan(40);
			await expect(flags.asked.length).toBeLessThan(options.length / 4);
		});
		await step("scrolled to the end, the last flags too", async () => {
			const before = flags.asked.length;
			// Not yet in view, the last row still draws its code in place of its flag.
			const last = options[options.length - 1].textContent?.slice(0, 2).toLowerCase();
			list.scrollTop = list.scrollHeight;
			await until(() => expect(flags.asked).toContain(`${last}.svg`));
			await expect(flags.asked.length).toBeGreaterThan(before);
			await expect(flags.asked.length).toBeLessThan(options.length / 2);
		});
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

/**
 * `getCountryFlag`, the helper beside it: an image named for the country,
 * its flag from the host it is given or its code with none, and nothing for
 * a name it does not know.
 */
export const FlagForAName: Story = {
	render: () => (
		<ul className="space-y-2">
			<li className="flex items-center gap-2">
				{getCountryFlag("Portugal", FLAGS)}
				Portugal, from the app's host
			</li>
			<li className="flex items-center gap-2">
				{getCountryFlag("Iceland")}
				Iceland, with no host
			</li>
			<li className="flex items-center gap-2">
				{getCountryFlag("Fairhaven")}
				Fairhaven
			</li>
		</ul>
	),
	play: async ({ canvas }) => {
		const [portugal, iceland, unknown] = canvas.getAllByRole("listitem");
		await expect(within(portugal).getByRole("img", { name: "Portugal" })).toBeVisible();
		await expect(within(iceland).getByRole("img", { name: "Iceland" })).toHaveTextContent("IS");
		await expect(within(unknown).queryByRole("img")).toBeNull();
		await expect(flags.asked).toEqual(["pt.svg"]);
	},
};
