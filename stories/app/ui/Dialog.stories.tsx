import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Label,
} from "../../../src/app/ui";
import { pin } from "../../support/viewports";

/**
 * A modal dialog: it opens from its trigger, holds focus, and closes by its
 * close button, its own buttons, Escape, or a press outside, handing focus
 * back to the trigger.
 */
const meta = {
	title: "App/UI/Dialog",
	component: Dialog,
	parameters: { layout: "padded" },
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Rename the cafe</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename the cafe</DialogTitle>
					<DialogDescription>The name prints on every delivery label.</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="cafe-name">Name</Label>
					<Input id="cafe-name" defaultValue="Larkspur Coffee Bar" />
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Wait until an element's entrance animations have run, so its box is where it rests. */
async function settled(element: Element) {
	await Promise.all(element.getAnimations().map((animation) => animation.finished));
}

async function open() {
	const trigger = screen.getByRole("button", { name: "Rename the cafe" });
	await userEvent.click(trigger);
	const dialog = await screen.findByRole("dialog", { name: "Rename the cafe" });
	return { trigger, dialog };
}

/** It opens named and described with focus on the first field; Tab stays inside; Escape closes. */
export const OpenTrapEscape: Story = {
	play: async ({ step }) => {
		const { trigger, dialog } = await open();
		const inside = within(dialog);
		await step("named, described, focus on the first field", async () => {
			await expect(dialog).toHaveAccessibleDescription("The name prints on every delivery label.");
			await expect(inside.getByRole("textbox", { name: "Name" })).toHaveFocus();
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
		});
		await step("Tab walks the field, the buttons, the close button, and wraps", async () => {
			for (const name of ["Cancel", "Save", "Close"]) {
				await userEvent.tab();
				await expect(inside.getByRole("button", { name })).toHaveFocus();
			}
			await userEvent.tab();
			await expect(inside.getByRole("textbox", { name: "Name" })).toHaveFocus();
		});
		await step("Escape closes it and focus returns to the trigger", async () => {
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
			await expect(trigger).toHaveFocus();
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/** The X in the corner closes it. */
export const CloseButton: Story = {
	play: async () => {
		const { trigger, dialog } = await open();
		await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await expect(trigger).toHaveFocus();
	},
};

/** Its own Cancel closes it. */
export const CancelButton: Story = {
	play: async () => {
		const { trigger, dialog } = await open();
		await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await expect(trigger).toHaveFocus();
	},
};

/** A press on the overlay outside closes it. */
export const PressOutside: Story = {
	play: async () => {
		const { trigger, dialog } = await open();
		await settled(dialog);
		// The overlay has no role; it is whatever sits at the screen's corner.
		await userEvent.click(document.elementFromPoint(4, 4) as Element);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await expect(trigger).toHaveFocus();
	},
};

/** Left open on a phone, so the check reads it: it fits the screen. */
export const OpenPhone: Story = {
	globals: pin("phone"),
	play: async () => {
		const { dialog } = await open();
		await settled(dialog);
		await expect(dialog.getBoundingClientRect().left).toBeGreaterThanOrEqual(0);
		await expect(dialog.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
	},
};
