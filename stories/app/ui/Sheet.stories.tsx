import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";
import {
	Button,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "../../../src/app/ui";
import { pin } from "../../support/viewports";
import { layerOpened, noneLeft } from "../layers";

type Side = "top" | "right" | "bottom" | "left";

function OrderSheet({ side }: { side: Side }) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Larkspur's order</Button>
			</SheetTrigger>
			<SheetContent side={side}>
				<SheetHeader>
					<SheetTitle>Larkspur Coffee Bar</SheetTitle>
					<SheetDescription>Standing order, Monday to Saturday at 06:15.</SheetDescription>
				</SheetHeader>
				<p className="py-4">Four trays: two of morning buns, one country, one rye.</p>
				<SheetFooter>
					<SheetClose asChild>
						<Button>Done</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

async function open() {
	const trigger = screen.getByRole("button", { name: "Larkspur's order" });
	await userEvent.click(trigger);
	const sheet = await layerOpened(() =>
		screen.getByRole("dialog", { name: "Larkspur Coffee Bar" }),
	);
	await Promise.all(sheet.getAnimations().map((animation) => animation.finished));
	return { trigger, sheet };
}

/**
 * A dialog that slides in from an edge: the menu sheet's base. It holds
 * focus, closes by its X, its own buttons, Escape, or a press outside, and
 * hands focus back to its trigger.
 */
const meta = {
	title: "App/UI/Sheet",
	component: OrderSheet,
	parameters: { layout: "padded" },
	args: { side: "right" },
	globals: pin("desktop"),
} satisfies Meta<typeof OrderSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** From the right: named, described, focus inside and held there; Escape closes. */
export const RightEscape: Story = {
	play: async ({ step }) => {
		const { trigger, sheet } = await open();
		const inside = within(sheet);
		await step("named, described, at the right edge, focus inside", async () => {
			await expect(sheet).toHaveAccessibleDescription(
				"Standing order, Monday to Saturday at 06:15.",
			);
			await expect(Math.round(sheet.getBoundingClientRect().right)).toBe(window.innerWidth);
			await expect(sheet.contains(document.activeElement)).toBe(true);
		});
		await step("Tab walks Done and the X and wraps", async () => {
			const done = inside.getByRole("button", { name: "Done" });
			const close = inside.getByRole("button", { name: "Close" });
			done.focus();
			await userEvent.tab();
			await expect(close).toHaveFocus();
			await userEvent.tab();
			await expect(done).toHaveFocus();
		});
		await step("Escape closes it and focus returns", async () => {
			await userEvent.keyboard("{Escape}");
			await noneLeft(() => screen.queryByRole("dialog"));
			await expect(trigger).toHaveFocus();
		});
	},
};

/** The X closes it. */
export const CloseButton: Story = {
	play: async () => {
		const { trigger, sheet } = await open();
		await userEvent.click(within(sheet).getByRole("button", { name: "Close" }));
		await noneLeft(() => screen.queryByRole("dialog"));
		await expect(trigger).toHaveFocus();
	},
};

/** Its own Done closes it. */
export const OwnButton: Story = {
	play: async () => {
		const { trigger, sheet } = await open();
		await userEvent.click(within(sheet).getByRole("button", { name: "Done" }));
		await noneLeft(() => screen.queryByRole("dialog"));
		await expect(trigger).toHaveFocus();
	},
};

/** A press on the overlay closes it. */
export const PressOutside: Story = {
	play: async () => {
		const { trigger } = await open();
		await userEvent.click(document.elementFromPoint(4, 4) as Element);
		await noneLeft(() => screen.queryByRole("dialog"));
		await expect(trigger).toHaveFocus();
	},
};

/** From the left edge. */
export const Left: Story = {
	args: { side: "left" },
	play: async () => {
		const { sheet } = await open();
		await expect(Math.round(sheet.getBoundingClientRect().left)).toBe(0);
	},
};

/** From the top, the full width. */
export const Top: Story = {
	args: { side: "top" },
	play: async () => {
		const { sheet } = await open();
		await expect(Math.round(sheet.getBoundingClientRect().top)).toBe(0);
		await expect(Math.round(sheet.getBoundingClientRect().width)).toBe(window.innerWidth);
	},
};

/** From the bottom, the full width. */
export const Bottom: Story = {
	args: { side: "bottom" },
	play: async () => {
		const { sheet } = await open();
		await expect(Math.round(sheet.getBoundingClientRect().bottom)).toBe(window.innerHeight);
	},
};

/** On a phone from the right it takes three quarters of the screen. */
export const RightPhone: Story = {
	globals: pin("phone"),
	play: async () => {
		const { sheet } = await open();
		await expect(Math.round(sheet.getBoundingClientRect().width)).toBe(
			Math.round(window.innerWidth * 0.75),
		);
	},
};
