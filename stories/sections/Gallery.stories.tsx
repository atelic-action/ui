import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Gallery } from "../../src/sections";
import { photos, unbroken } from "../fixtures/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A captioned grid of the business's own photos, every tile cropped to one
 * shape. It opens no lightbox: a tile is a picture and its caption. The
 * eyebrow fails contrast on this theme (stories/findings/primitives.md).
 */
const meta = {
	title: "Sections/Gallery",
	component: Gallery,
	tags: ["known-issue"],
	parameters: { ...knownIssues("eyebrow-contrast") },
	args: {
		id: "the-bake",
		eyebrow: "From the back of the shop",
		title: "This week's bake",
		lead: "Every picture is ours, taken on the bench between batches.",
		photos,
		footnote: "Photos by the bakers, October 2026.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const tiles = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list")).getAllByRole("listitem");
const tops = (canvas: ReturnType<typeof within>) =>
	tiles(canvas).map((tile) => Math.round(tile.getBoundingClientRect().top));

/** Three across, every tile the same shape, each caption under its photo. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const rows = tops(canvas);
		await expect(new Set(rows.slice(0, 3)).size).toBe(1);
		await expect(rows[3]).toBeGreaterThan(rows[0]);
		const sizes = tiles(canvas).map((tile) => {
			const box = within(tile).getByRole("img").getBoundingClientRect();
			return `${Math.round(box.width)}x${Math.round(box.height)}`;
		});
		await expect(new Set(sizes).size).toBe(1);
		const first = within(tiles(canvas)[0]);
		const caption = first.getByText("Tuesday's country loaves").getBoundingClientRect();
		await expect(caption.top).toBeGreaterThanOrEqual(
			first.getByRole("img").getBoundingClientRect().bottom - 1,
		);
		await expect(canvas.getByText("Photos by the bakers, October 2026.")).toBeVisible();
		await expect(canvas.queryByRole("button")).toBeNull();
	},
};

/** Two across. */
export const TwoColumns: Story = {
	args: { columns: 2 },
	play: async ({ canvas }) => {
		const rows = tops(canvas);
		await expect(rows[0]).toBe(rows[1]);
		await expect(rows[2]).toBeGreaterThan(rows[1]);
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** Before the photography exists: each tile its shot brief, the same shape as a photo. */
export const Placeholders: Story = {
	parameters: { ...knownIssues("eyebrow-contrast", "inset-soft-text-contrast") },
	args: {
		photos: [
			{ placeholder: "Photo: the levain at ten at night", caption: "The levain" },
			{ placeholder: "Photo: buns on the tray", caption: "The buns" },
			{ placeholder: "Photo: the counter at seven" },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Photo: the levain at ten at night")).toBeVisible();
		await expect(canvas.queryByRole("img")).toBeNull();
	},
};

/** Photos with no caption and no alt text: decorative, with nothing under them. */
export const NoCaptions: Story = {
	args: { photos: photos.map(({ src }) => ({ src })), footnote: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("img")).toHaveLength(0);
	},
};

/** Only the title over the grid. */
export const TitleOnly: Story = {
	// Nothing here shows the file's known issue, so the story is checked whole.
	tags: ["!known-issue"],
	parameters: { ...knownIssues() },
	args: { eyebrow: undefined, lead: undefined, footnote: undefined },
};

/** The tablet sits between the grid's steps: two across. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const rows = tops(canvas);
		await expect(rows[0]).toBe(rows[1]);
		await expect(rows[2]).toBeGreaterThan(rows[1]);
	},
};

/** One to a row on a phone, the longest captions inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		photos: photos.map((photo) => ({
			...photo,
			caption: `${photo.caption}, out of the deck ovens before the doors open on Alder Street`,
		})),
	},
	play: async ({ canvas }) => {
		const rows = tops(canvas);
		await expect(rows[1]).toBeGreaterThan(rows[0]);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/** One unbroken word in a caption, on a phone. */
export const UnbrokenCaption: Story = {
	globals: pin("phone"),
	args: { photos: [{ ...photos[0], caption: unbroken }] },
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
