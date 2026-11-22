import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";
import { Hint } from "../../src/components";
import { pin } from "../support/viewports";

/**
 * An info icon beside a word that opens a short explainer. It opens on
 * hover or keyboard focus and stays open on a click or a tap; Escape or a
 * press elsewhere closes it. The bubble is the button's description.
 */
const meta = {
	title: "Components/Hint",
	component: Hint,
	parameters: { layout: "padded" },
	args: {
		label: "About First paint",
		children: "How long a phone waits before the first loaf photo shows, on a slow connection.",
	},
	render: (args) => (
		<p>
			First paint
			<Hint {...args} />
			<button type="button" style={{ marginLeft: 24 }}>
				Elsewhere
			</button>
		</p>
	),
} satisfies Meta<typeof Hint>;

export default meta;
type Story = StoryObj<typeof meta>;

const bubble = () => document.querySelector("[role='tooltip']") as HTMLElement;

/** Closed: the button is named, collapsed, and described by the bubble's text. */
export const Closed: Story = {
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await expect(button).toHaveAttribute("aria-expanded", "false");
		await expect(button).toHaveAccessibleDescription(/How long a phone waits/);
		await expect(bubble()).not.toBeVisible();
	},
};

/** A pointer resting on the icon opens it, and leaving closes it. */
export const OpensOnHover: Story = {
	play: async ({ canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await userEvent.hover(button);
		await expect(button).toHaveAttribute("aria-expanded", "true");
		await expect(bubble()).toBeVisible();
		await userEvent.unhover(button);
		await expect(button).toHaveAttribute("aria-expanded", "false");
	},
};

/** Keyboard focus opens it and Escape closes it, focus staying on the button. */
export const OpensOnFocus: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await step("Tab to the icon opens the bubble", async () => {
			await userEvent.tab();
			await expect(button).toHaveFocus();
			await expect(button).toHaveAttribute("aria-expanded", "true");
		});
		await step("Escape closes it", async () => {
			await userEvent.keyboard("{Escape}");
			await expect(button).toHaveAttribute("aria-expanded", "false");
			await expect(button).toHaveFocus();
		});
		await step("Tab on closes it when focus leaves", async () => {
			await userEvent.tab({ shift: true });
			await userEvent.tab();
			await expect(button).toHaveAttribute("aria-expanded", "true");
			await userEvent.tab();
			await expect(canvas.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
			await expect(button).toHaveAttribute("aria-expanded", "false");
		});
	},
};

/** A click pins it open past the pointer leaving; a second click closes it. */
export const ClickPins: Story = {
	play: async ({ canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await userEvent.click(button);
		await userEvent.unhover(button);
		await expect(button).toHaveAttribute("aria-expanded", "true");
		await userEvent.click(button);
		await expect(button).toHaveAttribute("aria-expanded", "false");
	},
};

/** A press anywhere outside closes a pinned bubble. */
export const OutsidePressCloses: Story = {
	play: async ({ canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await userEvent.click(button);
		await expect(button).toHaveAttribute("aria-expanded", "true");
		await userEvent.click(canvas.getByRole("button", { name: "Elsewhere" }));
		await expect(button).toHaveAttribute("aria-expanded", "false");
	},
};

/** A press on the bubble's own text keeps it open and focus on the button. */
export const PressOnBubbleStays: Story = {
	play: async ({ canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		await userEvent.click(button);
		await userEvent.click(bubble());
		await expect(button).toHaveAttribute("aria-expanded", "true");
		await expect(button).toHaveFocus();
	},
};

/** The icon before its word, for a right aligned heading. */
export const SideBefore: Story = {
	args: { side: "before" },
	render: (args) => (
		<p style={{ textAlign: "right" }}>
			<Hint {...args} />
			<span>First paint</span>
		</p>
	),
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "About First paint" });
		const word = canvas.getByText("First paint");
		await expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
			word.getBoundingClientRect().left,
		);
	},
};

/** Near the right edge of a phone the bubble slides left to stay on the screen. */
export const NearTheEdgeOnPhone: Story = {
	globals: pin("phone"),
	args: {
		children:
			"How long a phone waits before the first loaf photo shows, measured on a slow connection from the shop's own corner of town.",
	},
	render: (args) => (
		<p style={{ textAlign: "right" }}>
			First paint
			<Hint {...args} />
		</p>
	),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "About First paint" }));
		await waitFor(() => expect(bubble()).toBeVisible());
		const box = bubble().getBoundingClientRect();
		await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
		await expect(box.left).toBeGreaterThanOrEqual(0);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
