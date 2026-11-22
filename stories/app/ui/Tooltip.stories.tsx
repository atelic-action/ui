import type { Meta, StoryObj } from "@storybook/react-vite";
import { Printer } from "lucide-react";
import { expect, screen, userEvent, waitFor } from "storybook/test";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../../../src/app/ui";

/**
 * A short line about a control, on hover or focus. It describes the control
 * and never names it, so an icon button keeps its own `aria-label`.
 */
const meta = {
	title: "App/UI/Tooltip",
	component: Tooltip,
	parameters: { layout: "padded" },
	args: { delayDuration: 0 },
	render: (args) => (
		<TooltipProvider>
			<div className="p-12">
				<Tooltip {...args}>
					<TooltipTrigger asChild>
						<Button variant="outline" size="icon" aria-label="Print labels">
							<Printer aria-hidden="true" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>One label per tray, for tomorrow's drops.</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover shows it and describes the button; moving away hides it. */
export const Hover: Story = {
	play: async ({ canvas, step }) => {
		const button = canvas.getByRole("button", { name: "Print labels" });
		await step("hover shows it, describing the button", async () => {
			await userEvent.hover(button);
			await waitFor(() =>
				expect(screen.getByRole("tooltip")).toHaveTextContent("One label per tray"),
			);
			await expect(button).toHaveAccessibleDescription("One label per tray, for tomorrow's drops.");
			await expect(button).toHaveAccessibleName("Print labels");
		});
		await step("moving away hides it", async () => {
			await userEvent.unhover(button);
			await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
		});
	},
};

/** Focus from the keyboard shows it, and Escape hides it with focus staying put. */
export const FocusAndEscape: Story = {
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "Print labels" });
		await userEvent.tab();
		await expect(button).toHaveFocus();
		await waitFor(() => expect(screen.getByRole("tooltip")).toBeInTheDocument());
		await userEvent.keyboard("{Escape}");
		await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
		await expect(button).toHaveFocus();
	},
};

/** Left showing, so the check reads it. */
export const Showing: Story = {
	args: { defaultOpen: true },
	play: async () => {
		const tip = await screen.findByRole("tooltip");
		await expect(tip).toHaveTextContent("One label per tray");
	},
};
