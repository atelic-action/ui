import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { expect, fn } from "storybook/test";
import { Button } from "../../../src/app/ui";

/** The kit's button: six variants and four sizes, or any element through `asChild`. */
const meta = {
	title: "App/UI/Button",
	component: Button,
	parameters: { layout: "padded" },
	args: { children: "Save the order", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	play: async ({ canvas, args, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

/** The destructive button: white on red 600, 4.63 to 1; its hover darkens the red. */
export const Destructive: Story = {
	args: { variant: "destructive", children: "Delete the order" },
};

export const Outline: Story = { args: { variant: "outline" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const Ghost: Story = { args: { variant: "ghost" } };

export const LinkLook: Story = { args: { variant: "link", children: "See every order" } };

/** The three text sizes side by side. */
export const Sizes: Story = {
	render: (args) => (
		<div className="flex items-center gap-2">
			<Button {...args} size="sm">
				Small
			</Button>
			<Button {...args}>Default</Button>
			<Button {...args} size="lg">
				Large
			</Button>
		</div>
	),
	play: async ({ canvas }) => {
		const heights = ["Small", "Default", "Large"].map(
			(name) => canvas.getByRole("button", { name }).getBoundingClientRect().height,
		);
		await expect(heights).toEqual([36, 40, 44]);
	},
};

/** An icon button, square, named by its label. */
export const Icon: Story = {
	args: { size: "icon", "aria-label": "New order", children: <Plus aria-hidden="true" /> },
	play: async ({ canvas }) => {
		const box = canvas.getByRole("button", { name: "New order" }).getBoundingClientRect();
		await expect(box.width).toBe(box.height);
	},
};

/** Disabled: dimmed, and no click lands. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args }) => {
		const button = canvas.getByRole("button", { name: "Save the order" });
		await expect(button).toBeDisabled();
		button.click();
		await expect(args.onClick).not.toHaveBeenCalled();
	},
};

/** It takes focus from the keyboard, and Enter and Space both press it. */
export const Keyboard: Story = {
	play: async ({ canvas, args, userEvent }) => {
		await userEvent.tab();
		await expect(canvas.getByRole("button", { name: "Save the order" })).toHaveFocus();
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard(" ");
		await expect(args.onClick).toHaveBeenCalledTimes(2);
	},
};

/** A router link wearing the button, through `asChild`. */
export const AsLink: Story = {
	args: { asChild: true, children: <Link to="/orders">See every order</Link> },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "See every order" })).toHaveAttribute(
			"href",
			"/orders",
		);
	},
};
