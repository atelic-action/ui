import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, spyOn } from "storybook/test";
import { AppErrorBoundary } from "../../src/artifact";

/** Whether the child below throws on its next render; a story flips it. */
const fault = { on: true };

/** A child that crashes its render while the fault is on. */
function Fragile() {
	if (fault.on) throw new Error("The oven timer came back undefined");
	return <p>The morning bake, back on the shelf.</p>;
}

/** Keeps React's report of the caught crash out of the test log, and restores it after. */
function quietCrash() {
	const spy = spyOn(console, "error").mockImplementation(() => {});
	return () => spy.mockRestore();
}

/**
 * The plain error boundary around an artifact's routes: a crash below it
 * renders the dependency free fallback, and Try Again renders the children
 * again.
 */
const meta = {
	title: "Artifact/AppErrorBoundary",
	component: AppErrorBoundary,
	args: { children: <Fragile /> },
	beforeEach: quietCrash,
} satisfies Meta<typeof AppErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing throws: the children render as they are. */
export const Healthy: Story = {
	beforeEach: () => {
		fault.on = false;
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("The morning bake, back on the shelf.")).toBeVisible();
		await expect(canvas.queryByRole("heading", { name: "Something went wrong" })).toBeNull();
	},
};

/**
 * A child that throws renders the fallback; once the fault clears, Try Again
 * renders the child again.
 */
export const CatchesAndRetries: Story = {
	beforeEach: () => {
		fault.on = true;
	},
	play: async ({ canvas, userEvent, step }) => {
		await step("the crash renders the fallback", async () => {
			await expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
			await expect(canvas.queryByText(/back on the shelf/)).toBeNull();
		});
		await step("Try Again while the fault stands lands on the fallback again", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Try Again" }));
			await expect(canvas.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
		});
		await step("with the fault cleared, Try Again renders the child", async () => {
			fault.on = false;
			await userEvent.click(canvas.getByRole("button", { name: "Try Again" }));
			await expect(canvas.getByText("The morning bake, back on the shelf.")).toBeVisible();
		});
	},
};
