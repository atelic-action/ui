import type { Meta, StoryObj } from "@storybook/react-vite";
import { Croissant, Truck } from "lucide-react";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
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
import { knownBug, knownIssues } from "../../support/known-issues";
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
 * The command menu: a search box over grouped items that filters as it is
 * typed into, moves by the arrows, and picks on Enter. Inline, or in a
 * dialog as a palette.
 */
const meta = {
	title: "App/UI/Command",
	component: Command,
	// The palette holds a separator, which a listbox may not (stories/findings/email-app.md).
	tags: ["known-issue"],
	parameters: { layout: "padded", ...knownIssues("command-separator-in-listbox") },
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

/** Typing filters the items, the arrows move, and Enter picks. */
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
			await waitFor(() => expect(list.getAllByRole("option")).toHaveLength(1));
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

/** Nothing matches: the empty line, and a listbox with no options in it. */
export const Empty: Story = {
	parameters: { ...knownIssues("command-separator-in-listbox", "command-empty-listbox") },
	play: async ({ canvas }) => {
		await userEvent.type(canvas.getByRole("combobox"), "croquembouche");
		await waitFor(() => expect(canvas.getByText("Nothing matches.")).toBeVisible());
		await expect(canvas.queryAllByRole("option")).toHaveLength(0);
	},
};

function PaletteDialog() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button variant="outline" onClick={() => setOpen(true)}>
				Find anything
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Palette />
			</CommandDialog>
		</>
	);
}

/**
 * As a palette in a dialog: it opens on the search box, and Escape closes it.
 * The dialog has no title and no way to pass one, so it has no name; and it
 * has no trigger of its own, so closing it drops focus to the page instead
 * of the button that opened it.
 */
export const InADialog: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("command-dialog-unnamed", "command-separator-in-listbox") },
	render: () => <PaletteDialog />,
	play: async ({ canvas, step }) => {
		const button = canvas.getByRole("button", { name: "Find anything" });
		await userEvent.click(button);
		const dialog = await screen.findByRole("dialog");
		await step("it opens with focus in the search box", async () => {
			await expect(within(dialog).getByRole("combobox")).toHaveFocus();
		});
		await step("typing and Enter pick from inside it", async () => {
			await userEvent.keyboard("recipes{Enter}");
			await expect(picked.spy).toHaveBeenCalledWith("recipes");
		});
		await step("Escape closes it, and focus should return to the button", async () => {
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
			await knownBug("command-dialog-drops-focus", async () => {
				await expect(button).toHaveFocus();
			});
		});
	},
};

/** Left open, so the check reads the open palette: its first item highlighted, shortcut and all. */
export const InADialogOpen: Story = {
	tags: ["known-issue"],
	parameters: {
		...knownIssues(
			"command-dialog-unnamed",
			"command-separator-in-listbox",
			"app-muted-on-grey-contrast",
		),
	},
	render: () => <PaletteDialog />,
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Find anything" }));
		const dialog = await screen.findByRole("dialog");
		await waitFor(() => expect(dialog).toBeVisible());
		await expect(dialog).not.toHaveAccessibleName();
	},
};
