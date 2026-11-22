import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "@tanstack/react-router";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { ActionButton } from "../../src/app";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The app's responsive action button: an icon alone on a phone, the icon and
 * its label from `sm` up, with the label always its accessible name.
 */
const meta = {
	title: "App/ActionButton",
	component: ActionButton,
	parameters: { layout: "padded" },
	args: { icon: Plus, label: "New order", onClick: fn() },
	globals: pin("desktop"),
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The outline default, icon and label. */
export const Outline: Story = {
	play: async ({ canvas, args, userEvent }) => {
		const button = canvas.getByRole("button", { name: "New order" });
		await expect(canvas.getByText("New order")).toBeVisible();
		await userEvent.click(button);
		await expect(args.onClick).toHaveBeenCalledOnce();
	},
};

export const Solid: Story = { args: { variant: "default" } };

export const Secondary: Story = { args: { variant: "secondary" } };

export const Ghost: Story = { args: { variant: "ghost" } };

/** The destructive variant, for a delete. Its white words on the kit's red fail contrast. */
export const Destructive: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("app-destructive-contrast") },
	args: { variant: "destructive", icon: Trash2, label: "Delete order" },
};

/** On a phone the label hides and the icon carries the name. */
export const IconOnlyPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const button = canvas.getByRole("button", { name: "New order" });
		await expect(canvas.getByText("New order")).not.toBeVisible();
		await expect(button.getBoundingClientRect().width).toBeLessThan(60);
	},
};

/**
 * An accessible name longer than the label, for an icon that needs the
 * context. It must still hold the label's words, since the label shows from
 * `sm` up and a voice user says what they see.
 */
export const OwnAccessibleName: Story = {
	args: { "aria-label": "New order for a cafe" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("button", { name: "New order for a cafe" })).toBeVisible();
	},
};

/** Disabled, it takes no click. */
export const Disabled: Story = {
	args: { disabled: true },
	play: async ({ canvas, args }) => {
		const button = canvas.getByRole("button", { name: "New order" });
		await expect(button).toBeDisabled();
		button.click();
		await expect(args.onClick).not.toHaveBeenCalled();
	},
};

/** Loading, the icon spins and the button is disabled, so a second press never submits twice. */
export const Loading: Story = {
	args: { icon: RefreshCw, label: "Sync orders", loading: true },
	play: async ({ canvas, args }) => {
		const button = canvas.getByRole("button", { name: "Sync orders" });
		await expect(button).toBeDisabled();
		button.click();
		await expect(args.onClick).not.toHaveBeenCalled();
	},
};

/** The request the pending story starts, held open until the story lets it settle. */
const sync = { release: () => {}, request: fn() };

function PendingSync() {
	const [pending, setPending] = useState(false);
	return (
		<ActionButton
			icon={RefreshCw}
			label="Sync orders"
			loading={pending}
			onClick={() => {
				setPending(true);
				sync.request();
				new Promise<void>((resolve) => {
					sync.release = resolve;
				}).finally(() => setPending(false));
			}}
		/>
	);
}

/** Wired to a request the way an app does: pending while it runs, and a double press sends one. */
export const PendingWhileItRuns: Story = {
	beforeEach: () => {
		sync.request = fn();
	},
	render: () => <PendingSync />,
	play: async ({ canvas, userEvent, step }) => {
		const button = canvas.getByRole("button", { name: "Sync orders" });
		await step("a double press sends one request and disables the button", async () => {
			await userEvent.dblClick(button);
			await expect(sync.request).toHaveBeenCalledOnce();
			await expect(button).toBeDisabled();
		});
		await step("when the request settles the button comes back", async () => {
			sync.release();
			await waitFor(() => expect(button).toBeEnabled());
		});
	},
};

/** As a router link, through `asChild`. */
export const AsLink: Story = {
	args: {
		asChild: true,
		children: (
			<Link to="/orders">
				<Plus aria-hidden="true" />
				<span>New order</span>
			</Link>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "New order" })).toHaveAttribute(
			"href",
			"/orders",
		);
	},
};
