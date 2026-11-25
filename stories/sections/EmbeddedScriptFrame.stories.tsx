import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { PhoneLink } from "../../src/primitives";
import { EmbeddedScriptFrame } from "../../src/sections";
import { embeddedWidget } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { withReducedMotion } from "../support/motion";
import { pin } from "../support/viewports";

/** The bakery's number, as a link, for the fallback line. */
const bakeryPhone = { e164: "+15555550142", display: "555-0142" };

/**
 * A vendor's tool that arrives as a script mounting its own iframe into a
 * known element. The frame holds the space and covers it, with one spinner,
 * until the tool is ready, then gives way to it; it shows the site's own
 * line instead if the tool never comes. The stories load a local stand in,
 * never a vendor.
 */
const meta = {
	title: "Sections/EmbeddedScriptFrame",
	component: EmbeddedScriptFrame,
	args: {
		src: embeddedWidget({ mount: "order-tool-loads", story: "loads", delay: "600" }),
		mountId: "order-tool-loads",
		title: "Build a custom cake order",
		fallback: (
			<>
				The order tool did not load. Call the bakery at <PhoneLink phone={bakeryPhone} /> to order.
			</>
		),
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

/** The cover the status sits in, reached from the status, which has a role. */
const coverOf = (status: HTMLElement) => status.parentElement as HTMLElement;

/**
 * The one loader a reader sees. The stand in behaves as a vendor whose
 * iframe loads early and draws its tool later: it puts a whole page loader
 * of its own on the host page (hidden here by `hostChrome`), a loader of its
 * own inside its iframe (under the cover), and posts `stand-in-loaded` when
 * the tool is drawn, which `readyMessage` waits for. Until then the cover,
 * in the band's color, lies over the iframe at its full size.
 */
export const SingleLoader: Story = {
	args: {
		src: embeddedWidget({
			mount: "order-tool-single",
			story: "single",
			delay: "200",
			chrome: "stand-in-page-loader",
			ready: "1500",
		}),
		mountId: "order-tool-single",
		readyMessage: { origin: window.location.origin, type: "stand-in-loaded" },
		hostChrome: "#stand-in-page-loader",
	},
	// The stand in's page loader leaves only on the tool's message, so a run
	// that stops before it takes it away here, before the next story.
	beforeEach: () => () => document.getElementById("stand-in-page-loader")?.remove(),
	play: async ({ canvas, canvasElement, step }) => {
		const mount = canvasElement.querySelector("#order-tool-single") as HTMLElement;
		const status = canvas.getByRole("status");
		const cover = coverOf(status);
		await step("our spinner shows, and the vendor's page loader never does", async () => {
			await expect(status).toHaveTextContent("Loading");
			await waitFor(() => expect(document.getElementById("stand-in-page-loader")).not.toBeNull(), {
				timeout: 10_000,
			});
			const loader = document.getElementById("stand-in-page-loader") as HTMLElement;
			await expect(getComputedStyle(loader).display).toBe("none");
		});
		const iframe = await waitFor(
			() => within(mount).getByTitle("The stand in tool") as HTMLIFrameElement,
			{
				timeout: 10_000,
			},
		);
		await step(
			"the iframe loads at full size under an opaque cover, and the wait holds",
			async () => {
				await waitFor(() => expect(iframe.contentDocument?.readyState).toBe("complete"), {
					timeout: 10_000,
				});
				const box = iframe.getBoundingClientRect();
				await expect(box.width).toBeGreaterThan(0);
				await expect(box.height).toBeGreaterThan(0);
				await expect(canvas.getByRole("status")).toBeInTheDocument();
				await expect(cover.contains(hitAt(iframe))).toBe(true);
				await expect(getComputedStyle(cover).backgroundColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
			},
		);
		await step("the tool's message lifts the cover, and the tool takes the pointer", async () => {
			await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 10_000 });
			await expect(hitAt(iframe)).toBe(iframe);
			await expect(iframe.contentDocument?.body).toHaveTextContent(
				"The vendor's tool would load here.",
			);
		});
	},
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

/** While the tool is on its way: the cover over the held space, the large spinner centered in it. */
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
		await step("the cover takes the pointer, since nothing under it is usable yet", async () => {
			await expect(coverOf(status).contains(hitAt(coverOf(status)))).toBe(true);
		});
	},
};

/**
 * On a phone, with the frame starting about 340px down the page, the large
 * spinner sits centered in the held space (the first `minHeight`, 600px)
 * and in view, and stays there when the vendor's iframe grows the frame
 * past the held height under the cover.
 */
export const WaitingPhone: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-waiting-phone", story: "waiting-phone", never: "" }),
		mountId: "order-tool-waiting-phone",
		timeoutMS: 600_000,
		minHeight: "600px",
	},
	decorators: [
		(Story) => (
			<>
				<div style={{ height: 300 }} />
				<Story />
			</>
		),
	],
	globals: pin("phone"),
	play: async ({ canvas, canvasElement, step }) => {
		const status = canvas.getByRole("status");
		const cover = coverOf(status);
		const spinner = within(status).getByText("Loading").parentElement as HTMLElement;
		const middle = () => {
			const box = spinner.getBoundingClientRect();
			return box.top + box.height / 2;
		};
		const top = cover.getBoundingClientRect().top;
		await step("the frame starts about 340px down a 390 by 844 page", async () => {
			await expect(window.innerHeight).toBe(844);
			await expect(top).toBeGreaterThan(300);
			await expect(top).toBeLessThan(420);
		});
		const before = middle();
		await step("the spinner is centered in the held space, and in view", async () => {
			await expect(Math.abs(before - (top + 300))).toBeLessThanOrEqual(3);
			await expect(spinner.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
		});
		await step("it stays put when the frame grows past the held height", async () => {
			// Playing the vendor: what it draws in the mount grows the frame.
			const mount = canvasElement.querySelector("#order-tool-waiting-phone") as HTMLElement;
			const grown = document.createElement("div");
			grown.style.height = "1200px";
			mount.appendChild(grown);
			await expect(cover.getBoundingClientRect().height).toBeGreaterThan(1000);
			await expect(Math.abs(middle() - before)).toBeLessThanOrEqual(1);
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
				bakery at <PhoneLink phone={bakeryPhone} /> and we will take your order by phone, or try the
				page again in a minute.
			</>
		),
	},
	play: async ({ canvas, step }) => {
		await waitFor(
			() => expect(canvas.getByRole("status")).toHaveTextContent("The order tool did not load"),
			{ timeout: 5000 },
		);
		const link = canvas.getByRole("link", { name: "555-0142" });
		await step(
			"the link in the fallback takes the pointer, and the clear cover does not",
			async () => {
				await expect(hitAt(link)).toBe(link);
				const status = canvas.getByRole("status");
				const box = coverOf(status).getBoundingClientRect();
				const corner = document.elementFromPoint(box.left + 4, box.bottom - 4);
				await expect(coverOf(status).contains(corner)).toBe(false);
			},
		);
		await step("the line runs the column's width, with no width of its own", async () => {
			const line = canvas.getByText(/The order tool did not load/);
			await expect(line.getBoundingClientRect().width).toBeGreaterThan(600);
		});
	},
};

/**
 * A tool that arrives after the fallback took its place still takes it
 * back, and the cover goes at once: no ground comes back over the tool to
 * fade.
 */
export const LateArrival: Story = {
	args: {
		src: embeddedWidget({ mount: "order-tool-late", story: "late", delay: "1500" }),
		mountId: "order-tool-late",
		timeoutMS: 800,
	},
	play: async ({ canvas, step }) => {
		const cover = coverOf(canvas.getByRole("status"));
		await step("the fallback shows first", async () => {
			await waitFor(
				() => expect(canvas.getByRole("status")).toHaveTextContent("The order tool did not load"),
				{ timeout: 5000 },
			);
		});
		await step("the tool takes its place with no ground and no fade", async () => {
			await waitFor(() => expect(canvas.queryByRole("status")).toBeNull(), { timeout: 10_000 });
			await expect(getComputedStyle(cover).backgroundColor).toBe("rgba(0, 0, 0, 0)");
			await expect(cover.getAnimations()).toHaveLength(0);
			await expect(getComputedStyle(cover).visibility).toBe("hidden");
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
