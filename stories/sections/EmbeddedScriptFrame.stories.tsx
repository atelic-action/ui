import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { EmbeddedScriptFrame } from "../../src/sections";
import { embeddedWidget } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { withReducedMotion } from "../support/motion";
import { pin } from "../support/viewports";

/**
 * A vendor's tool that arrives as a script mounting its own iframe into a
 * known element. The frame holds the space, shows a spinner beside the
 * mount until the iframe has loaded, and shows the site's own line instead
 * if it never does. The stories load a local stand in, never a vendor.
 */
const meta = {
	title: "Sections/EmbeddedScriptFrame",
	component: EmbeddedScriptFrame,
	args: {
		src: embeddedWidget({ mount: "order-tool-loads", story: "loads", delay: "600" }),
		mountId: "order-tool-loads",
		title: "Build a custom cake order",
		fallback: "The order tool did not load. Call the bakery at 555-0142 to order.",
		minHeight: "420px",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof EmbeddedScriptFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

const region = (canvas: ReturnType<typeof within>) =>
	canvas.getByRole("region", { name: "Build a custom cake order" });

/** The spinner holds the space until the vendor's iframe has loaded, then gives way to it. */
export const Loads: Story = {
	play: async ({ canvas, canvasElement, step }) => {
		const mount = canvasElement.querySelector("#order-tool-loads") as HTMLElement;
		await step("the wait shows beside the empty mount, never inside it", async () => {
			const status = canvas.getByRole("status");
			await expect(status).toHaveTextContent("Loading");
			await expect(mount.contains(status)).toBe(false);
		});
		await step("the tool arrives in the mount and the spinner goes", async () => {
			await waitFor(() => expect(within(mount).getByTitle("The stand in tool")).toBeVisible(), {
				timeout: 5000,
			});
			await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 5000 });
			await expect(region(canvas)).toContainElement(mount);
		});
	},
};

/** While the tool is on its way: the spinner in the middle of the held space. */
export const Waiting: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-waiting", story: "waiting", never: "" }),
		mountId: "order-tool-waiting",
		timeoutMS: 600_000,
	},
	play: async ({ canvas }) => {
		const box = region(canvas).getBoundingClientRect();
		await expect(box.height).toBeGreaterThanOrEqual(420);
		await expect(canvas.getByRole("status")).toHaveTextContent("Loading");
	},
};

/** A tool that never loads gives way to the site's own line when the wait runs out. */
export const Fallback: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-fallback", story: "fallback", never: "" }),
		mountId: "order-tool-fallback",
		timeoutMS: 800,
	},
	play: async ({ canvas }) => {
		await waitFor(
			() => expect(canvas.getByRole("status")).toHaveTextContent("The order tool did not load."),
			{ timeout: 5000 },
		);
	},
};

/** On the alternate band. */
export const AltSurface: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-alt", story: "alt", never: "" }),
		mountId: "order-tool-alt",
		timeoutMS: 600_000,
		surface: "alt",
	},
};

/** Under reduced motion the ring holds still and the wait is said in words. */
export const ReducedMotion: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-still", story: "still", never: "" }),
		mountId: "order-tool-still",
		timeoutMS: 600_000,
	},
	beforeEach: withReducedMotion,
	play: async ({ canvas }) => {
		const status = canvas.getByRole("status");
		await expect(status.getAnimations({ subtree: true })).toHaveLength(0);
		await expect(within(status).getByText("Loading").getBoundingClientRect().width).toBeGreaterThan(
			1,
		);
	},
};

/** A phone holds the vendor's iframe to the column, and the page never scrolls sideways. */
export const Phone: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-phone", story: "phone", delay: "100" }),
		mountId: "order-tool-phone",
	},
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		const mount = canvasElement.querySelector("#order-tool-phone") as HTMLElement;
		await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 5000 });
		await expect(within(mount).getByTitle("The stand in tool")).toBeVisible();
		await expectNoSidewaysScroll();
	},
};
