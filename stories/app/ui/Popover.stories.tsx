import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from "../../../src/app/ui";
import { pin } from "../../support/viewports";

/**
 * A floating panel from a trigger, for a small form or detail. Its content
 * is a `dialog`, so it needs a name: here a heading inside it, by
 * `aria-labelledby`.
 */
const meta = {
	title: "App/UI/Popover",
	component: Popover,
	parameters: { layout: "padded" },
	render: (args) => (
		<Popover {...args}>
			<PopoverTrigger asChild>
				<Button variant="outline">Change the drop time</Button>
			</PopoverTrigger>
			<PopoverContent aria-labelledby="drop-heading">
				<div className="space-y-3">
					<h2 id="drop-heading" className="font-medium">
						Drop time
					</h2>
					<Label htmlFor="drop-time">Leaves the bakehouse at</Label>
					<Input id="drop-time" type="time" defaultValue="06:15" />
				</div>
			</PopoverContent>
		</Popover>
	),
	globals: pin("desktop"),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click opens it with focus inside; Escape closes it and focus returns. */
export const OpenAndEscape: Story = {
	play: async ({ canvas, step }) => {
		const trigger = canvas.getByRole("button", { name: "Change the drop time" });
		await step("closed, the trigger says it controls a dialog", async () => {
			await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
			await expect(trigger).toHaveAttribute("aria-expanded", "false");
		});
		await step("a click opens it, named by its heading, focus inside", async () => {
			await userEvent.click(trigger);
			const panel = await screen.findByRole("dialog", { name: "Drop time" });
			await expect(trigger).toHaveAttribute("aria-expanded", "true");
			await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
		});
		await step("Tab reaches the field inside", async () => {
			await userEvent.tab();
			await expect(screen.getByLabelText("Leaves the bakehouse at")).toHaveFocus();
		});
		await step("Escape closes it and focus returns", async () => {
			await userEvent.keyboard("{Escape}");
			await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
			await expect(trigger).toHaveFocus();
		});
	},
};

/** A second click on the trigger closes it. */
export const ToggleByTrigger: Story = {
	play: async ({ canvas }) => {
		const trigger = canvas.getByRole("button", { name: "Change the drop time" });
		await userEvent.click(trigger);
		await screen.findByRole("dialog");
		await userEvent.click(trigger);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
	},
};

/** A press outside closes it. */
export const PressOutside: Story = {
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Change the drop time" }));
		const panel = await screen.findByRole("dialog");
		await Promise.all(panel.getAnimations().map((animation) => animation.finished));
		await userEvent.click(
			document.elementFromPoint(window.innerWidth - 4, window.innerHeight - 4) as Element,
		);
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	},
};

/** Left open on a phone, so the check reads it; it stays on the screen. */
export const OpenPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Change the drop time" }));
		const panel = await screen.findByRole("dialog", { name: "Drop time" });
		await Promise.all(panel.getAnimations().map((animation) => animation.finished));
		await expect(within(panel).getByLabelText("Leaves the bakehouse at")).toBeVisible();
		await expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
	},
};
