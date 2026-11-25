import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { PhoneLink } from "../../src/primitives";
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

/** The element a pointer at the middle of `element` would land on. */
const hitAt = (element: Element) => {
	const box = element.getBoundingClientRect();
	return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
};

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
			// One wait for both, generous because a full run loads the stand in's
			// page slowly; the story's own time still bounds it.
			await waitFor(
				async () => {
					await expect(within(mount).getByTitle("The stand in tool")).toBeVisible();
					await expect(canvas.queryByRole("status")).toBeNull();
				},
				{ timeout: 10_000 },
			);
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
	play: async ({ canvas, step }) => {
		const status = canvas.getByRole("status");
		await step("the held space is there, with the spinner in it", async () => {
			const box = region(canvas).getBoundingClientRect();
			await expect(box.height).toBeGreaterThanOrEqual(420);
			await expect(status).toHaveTextContent("Loading");
		});
		await step("a pointer passes through the spinner to whatever is under it", async () => {
			await expect(status.contains(hitAt(status))).toBe(false);
		});
	},
};

/**
 * A tool that never loads gives way to the site's own line when the wait
 * runs out. The line takes the column's width, and a link in it works.
 */
export const Fallback: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-fallback", story: "fallback", never: "" }),
		mountId: "order-tool-fallback",
		timeoutMS: 800,
		fallback: (
			<>
				The order tool did not load just now, which happens when a browser blocks it. Call the
				bakery at <PhoneLink phone={{ e164: "+15555550142", display: "555-0142" }} /> and we will
				take your order by phone, or try the page again in a minute.
			</>
		),
	},
	play: async ({ canvas, step }) => {
		await waitFor(
			() => expect(canvas.getByRole("status")).toHaveTextContent("The order tool did not load"),
			{ timeout: 5000 },
		);
		const link = canvas.getByRole("link", { name: "555-0142" });
		await step("the link in the fallback takes the pointer", async () => {
			await expect(hitAt(link)).toBe(link);
		});
		await step("the line runs the column's width, with no width of its own", async () => {
			const line = canvas.getByText(/The order tool did not load/);
			await expect(line.getBoundingClientRect().width).toBeGreaterThan(600);
		});
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
		await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 10_000 });
		await expect(within(mount).getByTitle("The stand in tool")).toBeVisible();
		await expectNoSidewaysScroll();
	},
};
