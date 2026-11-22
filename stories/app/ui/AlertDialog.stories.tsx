import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, within } from "storybook/test";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
} from "../../../src/app/ui";
import { layerOpened, noneLeft, settledLayer, until } from "../../support/settle";
import { pin } from "../../support/viewports";

/** The confirm handler, fresh for each story. */
const confirm = { spy: fn() };

/**
 * The confirm step before a destructive act. It holds focus, opens on the
 * safe choice, and closes only by its own buttons or Escape.
 */
const meta = {
	title: "App/UI/AlertDialog",
	component: AlertDialog,
	parameters: { layout: "padded" },
	beforeEach: () => {
		confirm.spy = fn();
	},
	render: (args) => (
		<AlertDialog {...args}>
			<AlertDialogTrigger asChild>
				<Button variant="outline">Cancel the standing order</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancel Larkspur's standing order?</AlertDialogTitle>
					<AlertDialogDescription>
						The Monday to Saturday drop stops after tomorrow. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Keep it</AlertDialogCancel>
					<AlertDialogAction onClick={() => confirm.spy()}>Cancel the order</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

async function open() {
	const trigger = screen.getByRole("button", { name: "Cancel the standing order" });
	await userEvent.click(trigger);
	const dialog = await layerOpened(() =>
		screen.getByRole("alertdialog", {
			name: "Cancel Larkspur's standing order?",
		}),
	);
	return { trigger, dialog };
}

/** Opens named and described, with focus on the safe choice; Tab stays in; Escape backs out. */
export const OpenAndEscape: Story = {
	play: async ({ step }) => {
		const { trigger, dialog } = await open();
		const keep = within(dialog).getByRole("button", { name: "Keep it" });
		const act = within(dialog).getByRole("button", { name: "Cancel the order" });
		await step("named, described, and focused on Keep it", async () => {
			await expect(dialog).toHaveAccessibleDescription(/cannot be undone/);
			await expect(keep).toHaveFocus();
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
		});
		await step("Tab cycles inside it, both ways", async () => {
			await userEvent.tab();
			await expect(act).toHaveFocus();
			await userEvent.tab();
			await expect(keep).toHaveFocus();
			await userEvent.tab({ shift: true });
			await expect(act).toHaveFocus();
		});
		await step("Escape closes it and focus returns to the trigger", async () => {
			await userEvent.keyboard("{Escape}");
			await noneLeft(() => screen.queryByRole("alertdialog"));
			await expect(trigger).toHaveFocus();
			await expect(confirm.spy).not.toHaveBeenCalled();
		});
	},
};

/** A press outside does not close it: the choice must be made. Keep it closes it. */
export const OutsidePressStays: Story = {
	play: async () => {
		const { dialog, trigger } = await open();
		await settledLayer(dialog);
		// The overlay has no role; it is whatever sits at the screen's corner.
		await userEvent.click(document.elementFromPoint(4, 4) as Element);
		await new Promise((resolve) => setTimeout(resolve, 300));
		await expect(screen.getByRole("alertdialog")).toBe(dialog);
		await expect(dialog).toBeVisible();
		await userEvent.click(within(dialog).getByRole("button", { name: "Keep it" }));
		await noneLeft(() => screen.queryByRole("alertdialog"));
		await expect(trigger).toHaveFocus();
	},
};

/** The action runs its handler and closes. */
export const Confirm: Story = {
	play: async () => {
		const { dialog, trigger } = await open();
		await userEvent.click(within(dialog).getByRole("button", { name: "Cancel the order" }));
		await expect(confirm.spy).toHaveBeenCalledOnce();
		await noneLeft(() => screen.queryByRole("alertdialog"));
		await expect(trigger).toHaveFocus();
	},
};

/** Left open on a phone, so the check reads it: the buttons stack, the action on top. */
export const OpenPhone: Story = {
	globals: pin("phone"),
	play: async () => {
		const { dialog } = await open();
		const keep = within(dialog).getByRole("button", { name: "Keep it" });
		const act = within(dialog).getByRole("button", { name: "Cancel the order" });
		await until(() =>
			expect(act.getBoundingClientRect().bottom).toBeLessThanOrEqual(
				keep.getBoundingClientRect().top,
			),
		);
		await expect(dialog.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
	},
};
