import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMutation } from "@tanstack/react-query";
import { expect, screen, userEvent } from "storybook/test";
import { AppProvider, queryClient } from "../../src/app";
import { Button } from "../../src/app/ui";
import { storyAppConfig, storyAppNav } from "../fixtures/app";
import { until } from "../support/settle";
import { pin } from "../support/viewports";

/** A save that succeeds or fails, carrying the toast it raises in its meta, as an app's mutations do. */
function SaveOrder({ fails = false }: { fails?: boolean }) {
	const save = useMutation({
		mutationFn: async () => {
			if (fails) throw new Error("The van is already loaded.");
			return { trays: 4 };
		},
		meta: {
			toast: {
				success: "Order saved",
				successDescription: (data) =>
					`${(data as { trays: number }).trays} trays on Thursday's van.`,
				error: "The order did not save",
			},
		},
	});
	return <Button onClick={() => save.mutate()}>Save the order</Button>;
}

/**
 * The provider every app renders above its router. What it draws is the
 * toaster: a mutation carrying `meta.toast` raises a success or an error
 * toast through the shell's query client. The story's frame already holds
 * one provider with no toaster; this one, inside it, brings the default
 * toaster and the shell's own query client.
 */
const meta = {
	title: "App/AppProvider",
	component: AppProvider,
	parameters: { layout: "padded" },
	args: { config: storyAppConfig, nav: storyAppNav, queryClient, children: <SaveOrder /> },
	globals: pin("desktop"),
} satisfies Meta<typeof AppProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A save that succeeds raises the success toast with its description, its green words darkened to pass on their tint. */
export const SuccessToast: Story = {
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		const title = await screen.findByText("Order saved");
		await until(() => expect(title).toBeVisible());
		await expect(screen.getByText("4 trays on Thursday's van.")).toBeVisible();
		const region = screen.getByRole("region", { name: /Notifications/ });
		await expect(region).toHaveAttribute("aria-live", "polite");
	},
};

/** A save that fails raises the error toast with the error's message, its red words darkened to pass on their tint. */
export const ErrorToast: Story = {
	args: { children: <SaveOrder fails /> },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		const title = await screen.findByText("The order did not save");
		await until(() => expect(title).toBeVisible());
		await until(() => expect(screen.getByText("The van is already loaded.")).toBeVisible());
	},
};

/** With `toaster={false}` nothing is drawn: the toast has nowhere to land. */
export const NoToaster: Story = {
	args: { toaster: false },
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Save the order" }));
		// The toaster's region mounts with the toaster, before any toast, so its absence needs no wait.
		await expect(screen.queryByRole("region", { name: /notifications/i })).toBeNull();
		await expect(screen.queryByText("Order saved")).toBeNull();
	},
};
