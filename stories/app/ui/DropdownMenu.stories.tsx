import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../../../src/app/ui";
import { knownIssues } from "../../support/known-issues";
import { pin } from "../../support/viewports";

/** What an item reports, fresh for each story. */
const chose = { spy: fn() };

function OrderMenu() {
	const [labels, setLabels] = useState(true);
	const [sort, setSort] = useState("drop");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Order actions</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>Larkspur Coffee Bar</DropdownMenuLabel>
				<DropdownMenuItem onSelect={() => chose.spy("duplicate")}>
					Duplicate
					<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem disabled onSelect={() => chose.spy("invoice")}>
					Send the invoice
				</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem onSelect={() => chose.spy("thursday")}>
							Thursday's van
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => chose.spy("friday")}>Friday's van</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem checked={labels} onCheckedChange={setLabels}>
					Print labels
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
					<DropdownMenuRadioItem value="drop">By drop time</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="name">By name</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * A menu of actions from a button: plain items with shortcuts, a disabled
 * item, a submenu, a checkbox item, and a radio group, all on the keyboard.
 */
const meta = {
	title: "App/UI/DropdownMenu",
	component: DropdownMenu,
	parameters: { layout: "padded" },
	beforeEach: () => {
		chose.spy = fn();
	},
	render: () => <OrderMenu />,
	globals: pin("desktop"),
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click opens it, a click on an item runs it and closes, and focus returns. */
export const ByClick: Story = {
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole("button", { name: "Order actions" });
		await step("closed, it says it has a menu", async () => {
			await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
		});
		await step("a click opens it", async () => {
			await userEvent.click(trigger);
			await expect(await screen.findByRole("menu")).toBeInTheDocument();
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
		});
		await step("an item runs and the menu closes, focus back on the trigger", async () => {
			await userEvent.click(screen.getByRole("menuitem", { name: /Duplicate/ }));
			await expect(chose.spy).toHaveBeenCalledWith("duplicate");
			await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
			await expect(trigger).toHaveFocus();
		});
	},
};

/** The keyboard: Enter opens on the first item, the arrows skip the disabled one, Escape closes. */
export const Keyboard: Story = {
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole("button", { name: "Order actions" });
		await step("Enter opens on the first item", async () => {
			trigger.focus();
			await userEvent.keyboard("{Enter}");
			await waitFor(() =>
				expect(screen.getByRole("menuitem", { name: /Duplicate/ })).toHaveFocus(),
			);
		});
		await step("ArrowDown skips the disabled item to the submenu", async () => {
			await expect(screen.getByRole("menuitem", { name: "Send the invoice" })).toHaveAttribute(
				"aria-disabled",
				"true",
			);
			await userEvent.keyboard("{ArrowDown}");
			await expect(screen.getByRole("menuitem", { name: "Move to" })).toHaveFocus();
		});
		await step("ArrowRight opens the submenu on its first item, ArrowLeft closes it", async () => {
			const sub = screen.getByRole("menuitem", { name: "Move to" });
			await userEvent.keyboard("{ArrowRight}");
			await waitFor(() =>
				expect(screen.getByRole("menuitem", { name: "Thursday's van" })).toHaveFocus(),
			);
			await expect(sub).toHaveAttribute("aria-expanded", "true");
			await userEvent.keyboard("{ArrowLeft}");
			await waitFor(() => expect(sub).toHaveFocus());
			await expect(sub).toHaveAttribute("aria-expanded", "false");
		});
		await step("End and Home jump; Escape closes and focus returns", async () => {
			await userEvent.keyboard("{End}");
			await expect(screen.getByRole("menuitemradio", { name: "By name" })).toHaveFocus();
			await userEvent.keyboard("{Home}");
			await expect(screen.getByRole("menuitem", { name: /Duplicate/ })).toHaveFocus();
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
			await expect(trigger).toHaveFocus();
		});
	},
};

/** The checkbox item toggles and the radio items choose one, each saying so. */
export const CheckAndChoose: Story = {
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Order actions" });
		await userEvent.click(trigger);
		const labels = await screen.findByRole("menuitemcheckbox", { name: "Print labels" });
		await expect(labels).toHaveAttribute("aria-checked", "true");
		await userEvent.click(labels);
		await userEvent.click(trigger);
		await expect(
			await screen.findByRole("menuitemcheckbox", { name: "Print labels" }),
		).toHaveAttribute("aria-checked", "false");
		await userEvent.click(await screen.findByRole("menuitemradio", { name: "By name" }));
		await userEvent.click(trigger);
		await expect(await screen.findByRole("menuitemradio", { name: "By name" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect(screen.getByRole("menuitemradio", { name: "By drop time" })).toHaveAttribute(
			"aria-checked",
			"false",
		);
		// Closed again, so the check reads the page rather than a menu mid animation.
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
	},
};

/** A click outside closes it. */
export const ClickOutside: Story = {
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Order actions" }));
		const menu = await screen.findByRole("menu");
		await waitFor(() => expect(menu).toBeVisible());
		// The open menu turns pointer events off on the page, as a modal does,
		// so the press is made without user-event's check for them.
		const user = userEvent.setup({ pointerEventsCheck: 0 });
		await user.click(
			document.elementFromPoint(window.innerWidth - 4, window.innerHeight - 4) as Element,
		);
		await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
	},
};

/** Left open, so the check reads the open menu. */
export const Open: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("checker-radix-hides-page") },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Order actions" }));
		const menu = await screen.findByRole("menu");
		await waitFor(() => expect(menu).toBeVisible());
		await expect(within(menu).getByText("Larkspur Coffee Bar")).toBeVisible();
	},
};
