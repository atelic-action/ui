import type { Meta, StoryObj } from "@storybook/react-vite";
import { Croissant, Truck } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import {
	Button,
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "../../../src/app/ui";
import { layerOpened, noneLeft, until } from "../../support/settle";
import { pin } from "../../support/viewports";

/** What a pick reports, fresh for each story. */
const picked = { spy: fn() };

function Palette() {
	return (
		<>
			<CommandInput placeholder="Find a page or a cafe" />
			<CommandList>
				<CommandEmpty>Nothing matches.</CommandEmpty>
				<CommandGroup heading="Pages">
					<CommandItem onSelect={() => picked.spy("orders")}>
						<Truck aria-hidden="true" />
						Today's orders
						<CommandShortcut>G O</CommandShortcut>
					</CommandItem>
					<CommandItem onSelect={() => picked.spy("recipes")}>
						<Croissant aria-hidden="true" />
						Recipes
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Cafes">
					<CommandItem onSelect={() => picked.spy("larkspur")}>Larkspur Coffee Bar</CommandItem>
					<CommandItem onSelect={() => picked.spy("wicket")}>Wicket Lane Deli</CommandItem>
					<CommandItem disabled onSelect={() => picked.spy("alder")}>
						Alder Street Reading Room
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</>
	);
}

/**
 * Lets a reader find and pick an action or an item by typing, in an app where
 * the list is too long to scan. The command menu: a search box over grouped
 * items that filters as it is typed into, moves by the arrows, and picks on
 * Enter. Inline, or in a dialog as a palette.
 */
const meta = {
	title: "App/UI/Command",
	component: Command,
	parameters: { layout: "padded" },
	beforeEach: () => {
		picked.spy = fn();
	},
	render: (args) => (
		<Command {...args} className="max-w-md rounded-lg border">
			<Palette />
		</Command>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Typing filters the items (the separator hides once a group empties), the arrows move, and Enter picks. */
export const FilterAndPick: Story = {
	play: async ({ canvas, step }) => {
		const input = canvas.getByRole("combobox");
		const list = within(canvas.getByRole("listbox"));
		await step("every item shows, the first one active", async () => {
			await expect(list.getAllByRole("option")).toHaveLength(5);
			await expect(list.getByRole("option", { name: /Today's orders/ })).toHaveAttribute(
				"aria-selected",
				"true",
			);
		});
		await step("typing filters to what matches", async () => {
			await userEvent.type(input, "lark");
			await until(() => expect(list.getAllByRole("option")).toHaveLength(1));
			await expect(list.getByRole("option", { name: "Larkspur Coffee Bar" })).toBeVisible();
		});
		await step("Enter picks the active item", async () => {
			await userEvent.keyboard("{Enter}");
			await expect(picked.spy).toHaveBeenCalledWith("larkspur");
		});
	},
};

/** The arrows walk the items and skip a disabled one; the input keeps focus throughout. */
export const Arrows: Story = {
	play: async ({ canvas }) => {
		const input = canvas.getByRole("combobox");
		input.focus();
		await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
		const deli = canvas.getByRole("option", { name: "Wicket Lane Deli" });
		await expect(deli).toHaveAttribute("aria-selected", "true");
		await expect(input).toHaveAttribute("aria-activedescendant", deli.id);
		await userEvent.keyboard("{ArrowDown}");
		await expect(deli).toHaveAttribute("aria-selected", "true");
		await expect(input).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await expect(picked.spy).toHaveBeenCalledWith("wicket");
	},
};

/**
 * Nothing matches: the empty line is the list's one option, disabled, so a
 * reader hears it as the list's only entry. The separator hides while a
 * search is typed.
 */
export const Empty: Story = {
	play: async ({ canvas }) => {
		await userEvent.type(canvas.getByRole("combobox"), "croquembouche");
		await until(() => expect(canvas.getByText("Nothing matches.")).toBeVisible());
		const list = within(canvas.getByRole("listbox"));
		const only = list.getByRole("option", { name: "Nothing matches." });
		await expect(list.getAllByRole("option")).toEqual([only]);
		await expect(only).toHaveAttribute("aria-disabled", "true");
	},
};

function PaletteDialog({ title, showTitle }: { title?: string; showTitle?: boolean }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="outline" onClick={() => setOpen(true)}>
				Find anything
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen} title={title} showTitle={showTitle}>
				<Palette />
			</CommandDialog>
		</>
	);
}

/**
 * As a palette in a dialog: it opens on the search box, named "Commands" by
 * default, and Escape closes it. It has no trigger of its own (it is opened
 * by state), and still hands focus back to the button that opened it.
 */
export const InADialog: Story = {
	render: () => <PaletteDialog />,
	play: async ({ canvas, step }) => {
		const button = canvas.getByRole("button", { name: "Find anything" });
		await userEvent.click(button);
		const dialog = await layerOpened(() => screen.getByRole("dialog", { name: "Commands" }));
		await step("it opens with focus in the search box", async () => {
			await expect(within(dialog).getByRole("combobox")).toHaveFocus();
		});
		await step("typing and Enter pick from inside it", async () => {
			await userEvent.keyboard("recipes{Enter}");
			await expect(picked.spy).toHaveBeenCalledWith("recipes");
		});
		await step("Escape closes it, and focus returns to the button", async () => {
			await userEvent.keyboard("{Escape}");
			await noneLeft(() => screen.queryByRole("dialog"));
			await expect(button).toHaveFocus();
		});
	},
};

/**
 * Left open, so the check reads the open palette: its first item
 * highlighted, the shortcut's muted words on the grey (4.81 to 1), the
 * dialog named, and the separator no part of the listbox.
 */
export const InADialogOpen: Story = {
	render: () => <PaletteDialog />,
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Find anything" }));
		const dialog = await layerOpened(() => screen.getByRole("dialog", { name: "Commands" }));
		await until(() => expect(dialog).toBeVisible());
		const first = within(dialog).getByRole("option", { name: /Today's orders/ });
		await until(() => expect(first).toHaveAttribute("aria-selected", "true"));
		await expect(within(dialog).queryByRole("separator")).toBeNull();
	},
};

/** A palette titled for what it does, the title shown above the search. */
export const TitledDialog: Story = {
	render: () => <PaletteDialog title="Jump to a page" showTitle />,
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Find anything" }));
		const dialog = await layerOpened(() => screen.getByRole("dialog", { name: "Jump to a page" }));
		await until(() => expect(within(dialog).getByText("Jump to a page")).toBeVisible());
		await userEvent.keyboard("{Escape}");
		await noneLeft(() => screen.queryByRole("dialog"));
	},
};
