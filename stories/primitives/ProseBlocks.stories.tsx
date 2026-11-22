import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, fireEvent, waitFor } from "storybook/test";
import { ProseBlocks } from "../../src/primitives";
import { longURL, proseFigures, prosePost, proseText } from "../fixtures/primitives";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll, inWrap } from "./support";

/**
 * A document body carried as data: headings, paragraphs, lists, and figures,
 * for a legal page or a ported post whose words must arrive unedited. A run
 * of figures is one row of tiles, and each tile opens its file large in a
 * modal dialog.
 */
const meta = {
	title: "Primitives/ProseBlocks",
	component: ProseBlocks,
	decorators: [inWrap],
	args: { blocks: proseText },
	globals: pin("desktop"),
} satisfies Meta<typeof ProseBlocks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The open lightbox, once the tile has opened it. */
function openDialog() {
	return document.querySelector("dialog[open]") as HTMLDialogElement | null;
}

/** Whether a computed color paints anything. */
function paints(color: string) {
	return color !== "transparent" && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(color);
}

/** Headings, paragraphs, and a list: an `h2` by default, a block marked level 3 an `h3`. */
export const Text: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(
			"Why our rye rests two days",
		);
		await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(2);
		await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
		const list = canvas.getByRole("list");
		await expect(getComputedStyle(list).listStyleType).toBe("disc");
	},
};

/** Under a page whose sections are `h2`, the default level steps down to `h3`; a level 3 block stays `h3`. */
export const HeadingLevelThree: Story = {
	args: { headingLevel: "h3" },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
		await expect(canvas.getAllByRole("heading", { level: 3 })).toHaveLength(3);
	},
};

/** No blocks: an empty body. */
export const Empty: Story = {
	args: { blocks: [] },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector(".prose-blocks")?.childElementCount).toBe(0);
	},
};

/**
 * A run of figures is one row: a photograph, a clip, and one still to shoot.
 * Each real tile is a button naming what it opens; the one without a file is
 * its labeled block and opens nothing.
 */
export const Figures: Story = {
	args: { blocks: proseFigures },
	play: async ({ canvas }) => {
		const photo = canvas.getByRole("button", {
			name: "Open larger: The ovens at dawn, the first trays going in",
		});
		const clip = canvas.getByRole("button", {
			name: "Open larger: A baker scoring loaves on the bench",
		});
		// Two wide files outgrow one line of the column, so the row wraps inside it.
		const row = photo.closest("figure")?.parentElement as HTMLElement;
		await expect(clip.getBoundingClientRect().right).toBeLessThanOrEqual(
			row.getBoundingClientRect().right,
		);
		await expect(photo.getBoundingClientRect().height).toBe(240);
		await expect(canvas.getByText("The rye resting in linen on the rack")).toBeVisible();
		await expect(canvas.getAllByRole("button")).toHaveLength(2);
		await expect(canvas.getByText("The first trays, at five")).toBeVisible();
	},
};

/** The whole post: text, the row of figures, and more text. */
export const Post: Story = { args: { blocks: prosePost } };

/**
 * The tile opens its picture large in a modal dialog with focus inside it,
 * and every way out (the close button, Escape, the backdrop) closes it and
 * hands focus back to the tile.
 */
export const LightboxOpensAndCloses: Story = {
	args: { blocks: proseFigures.slice(0, 1) },
	play: async ({ canvas, userEvent, step }) => {
		const tile = canvas.getByRole("button", {
			name: "Open larger: The ovens at dawn, the first trays going in",
		});
		await step("nothing large is loaded until a reader asks", async () => {
			await expect(document.querySelectorAll("img")).toHaveLength(1);
		});
		await step("the tile opens the dialog, named by the picture, with focus inside", async () => {
			await userEvent.click(tile);
			const dialog = openDialog() as HTMLDialogElement;
			await expect(dialog).toBeTruthy();
			await expect(dialog).toHaveAccessibleName("The ovens at dawn, the first trays going in");
			await expect(dialog.contains(document.activeElement)).toBe(true);
			await expect(dialog.querySelector("img")).toBeVisible();
			await expect(dialog).toHaveTextContent("The first trays, at five");
		});
		await step("the close button closes it and focus returns to the tile", async () => {
			const dialog = openDialog() as HTMLDialogElement;
			const close = Array.from(dialog.querySelectorAll("button")).find(
				(b) => b.getAttribute("aria-label") === "Close",
			) as HTMLButtonElement;
			await userEvent.click(close);
			await waitFor(() => expect(openDialog()).toBeNull());
			await expect(tile).toHaveFocus();
		});
		await step("Escape closes it and focus returns to the tile", async () => {
			await userEvent.click(tile);
			const dialog = openDialog() as HTMLDialogElement;
			dialog.requestClose();
			await waitFor(() => expect(openDialog()).toBeNull());
			await expect(tile).toHaveFocus();
		});
		await step("a click on the backdrop closes it", async () => {
			await userEvent.click(tile);
			const dialog = openDialog() as HTMLDialogElement;
			const box = dialog.getBoundingClientRect();
			fireEvent.click(dialog, { clientX: box.left - 10, clientY: box.top - 10 });
			await waitFor(() => expect(openDialog()).toBeNull());
			await expect(tile).toHaveFocus();
		});
		await step("a click on the panel's own padding does not", async () => {
			await userEvent.click(tile);
			const dialog = openDialog() as HTMLDialogElement;
			const box = dialog.getBoundingClientRect();
			fireEvent.click(dialog, { clientX: box.left + 4, clientY: box.bottom - 4 });
			await expect(openDialog()).toBe(dialog);
			dialog.requestClose();
			await waitFor(() => expect(openDialog()).toBeNull());
		});
	},
};

/** The open lightbox dims the page behind it: its backdrop paints the shade. */
export const LightboxBackdrop: Story = {
	args: { blocks: proseFigures.slice(0, 1) },
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: /Open larger/ }));
		const dialog = openDialog() as HTMLDialogElement;
		const backdrop = getComputedStyle(dialog, "::backdrop").backgroundColor;
		await expect(paints(backdrop)).toBe(true);
		dialog.requestClose();
	},
};

/**
 * The backdrop where `--shade` is undefined, as it is for an app or a site
 * that loads `primitives.css` without `components.css`, the one sheet that
 * declares the token's default. Simulated by unsetting the token on a wrapper.
 * The backdrop should still dim the page; it paints nothing
 * (stories/findings/primitives.md, `lightbox-backdrop-needs-shade`).
 */
export const LightboxBackdropWithoutShadeToken: Story = {
	tags: ["known-issue"],
	args: { blocks: proseFigures.slice(0, 1) },
	decorators: [
		(Story) => (
			<div style={{ "--shade": "initial" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: /Open larger/ }));
		const dialog = openDialog() as HTMLDialogElement;
		await knownBug("lightbox-backdrop-needs-shade", async () => {
			await expect(paints(getComputedStyle(dialog, "::backdrop").backgroundColor)).toBe(true);
		});
		dialog.requestClose();
	},
};

/**
 * A clip opens large with its controls, and mounts only while the dialog is
 * open. The tile's own clip has no controls, since it sits inside a button.
 */
export const LightboxClip: Story = {
	args: { blocks: proseFigures.slice(1, 2) },
	play: async ({ canvas, userEvent, step }) => {
		const tile = canvas.getByRole("button", { name: /Open larger/ });
		await step("the tile's clip carries no controls of its own", async () => {
			await expect(tile.querySelector("video")).not.toHaveAttribute("controls");
			await expect(document.querySelectorAll("video")).toHaveLength(1);
		});
		await step("opened, the large clip mounts with controls, and goes when closed", async () => {
			await userEvent.click(tile);
			const dialog = openDialog() as HTMLDialogElement;
			const large = dialog.querySelector("video") as HTMLVideoElement;
			await expect(large).toHaveAttribute("controls");
			await expect(large).toHaveAccessibleName("A baker scoring loaves on the bench");
			dialog.requestClose();
			await waitFor(() => expect(openDialog()).toBeNull());
			await expect(dialog.querySelector("video")).toBeNull();
		});
	},
};

/**
 * A clip plays only while it is on screen: still below the fold, playing
 * once scrolled to, and paused again when it leaves.
 */
export const ClipPlaysOnlyOnScreen: Story = {
	args: { blocks: proseFigures.slice(1, 2) },
	decorators: [
		(Story) => (
			<>
				<div style={{ height: "250vh" }} />
				<Story />
				<div style={{ height: "250vh" }} />
			</>
		),
	],
	play: async ({ canvas, step }) => {
		const tile = canvas.getByRole("button", { name: /Open larger/ });
		const video = tile.querySelector("video") as HTMLVideoElement;
		await step("below the fold, it has not started", async () => {
			await expect(video.paused).toBe(true);
		});
		await step("scrolled onto the screen, it plays", async () => {
			video.scrollIntoView({ block: "center", behavior: "instant" });
			await waitFor(() => expect(video.paused).toBe(false), { timeout: 4000 });
			await expect(video.muted).toBe(true);
		});
		await step("scrolled away, it pauses", async () => {
			window.scrollTo({ top: 0, behavior: "instant" });
			await waitFor(() => expect(video.paused).toBe(true), { timeout: 4000 });
		});
	},
};

/** A figure with no size of its own is four by five; with a size it keeps the file's shape. */
export const TileShapes: Story = {
	args: {
		blocks: [
			{ type: "figure", src: "/images/bakery-loop-first-frame.jpg", alt: "The ovens, unsized" },
			{
				type: "figure",
				src: "/images/bakery-loop-first-frame.jpg",
				alt: "The ovens, sized",
				width: 960,
				height: 400,
			},
		],
	},
	play: async ({ canvas }) => {
		const [plain, sized] = canvas.getAllByRole("button");
		const ratio = (el?: HTMLElement) => {
			const box = (el as HTMLElement).getBoundingClientRect();
			return box.width / box.height;
		};
		await expect(Math.abs(ratio(plain) - 0.8)).toBeLessThan(0.02);
		await expect(Math.abs(ratio(sized) - 2.4)).toBeLessThan(0.05);
	},
};

/** The post on a phone: the row of figures wraps and nothing scrolls sideways. */
export const PostOnPhone: Story = {
	globals: pin("phone"),
	args: { blocks: prosePost },
	play: async ({ canvas }) => {
		const [photo, clip] = canvas.getAllByRole("button");
		await expect((clip as HTMLElement).getBoundingClientRect().top).toBeGreaterThan(
			(photo as HTMLElement).getBoundingClientRect().top,
		);
		await expectNoSidewaysScroll();
	},
};

/** The longest prose a port carries, a bare address in a paragraph and a list, wraps on a phone. */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		blocks: [
			{ type: "h", text: "Where the list lives" },
			{ type: "p", text: `The whole autumn list is at ${longURL} and changes every Thursday.` },
			{ type: "ul", items: [longURL, "Ask at the counter for a printed copy"] },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
