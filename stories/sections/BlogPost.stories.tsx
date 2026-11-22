import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { BlogPost } from "../../src/sections";
import { blogPost, longEmail, unbroken } from "../fixtures/sections";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * One journal post: the way back, the headline, the byline and dates, and the body.
 * Its muted byline and way back fail contrast on this theme (stories/findings/sections.md).
 */
const meta = {
	title: "Sections/BlogPost",
	component: BlogPost,
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	args: { doc: blogPost },
	globals: pin("desktop"),
} satisfies Meta<typeof BlogPost>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The post's own headline is the page's one h1, the byline and both dates under it. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "All posts" })).toHaveAttribute("href", "/blog");
		await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(blogPost.title);
		await expect(canvas.getByText("Ines Varga")).toBeVisible();
		await expect(canvas.getByText("October 14, 2026")).toBeVisible();
		await expect(canvas.getByText("Updated October 20, 2026")).toBeVisible();
		await expect(
			canvas.getByRole("heading", { level: 2, name: "What happens in the two days" }),
		).toBeVisible();
		await expect(canvas.getByRole("heading", { level: 3, name: "Why Thursday" })).toBeVisible();
		await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
	},
};

/**
 * The figure opens large in a dialog: by its tile, and closed by Escape, by
 * the close button, and by a click on the backdrop, with focus back on the
 * tile each time.
 */
export const FigureOpensAndCloses: Story = {
	play: async ({ canvas, userEvent, step }) => {
		const tile = canvas.getByRole("button", { name: "Open larger: Seeded rye sliced on a board" });
		const name = "Seeded rye sliced on a board";
		const opened = () => waitFor(() => canvas.getByRole("dialog", { name }), { timeout: 3000 });
		// Closed means the page has heard it too: the dialog is shut and its
		// large picture unmounted, leaving the tile's own picture alone. The
		// close event lands a task after the dialog shuts, so a press of the
		// tile before then would be undone by it.
		const closed = () =>
			waitFor(
				() => {
					expect(canvas.queryByRole("dialog")).toBeNull();
					expect(canvas.getAllByRole("img", { name, hidden: true })).toHaveLength(1);
				},
				{ timeout: 3000 },
			);
		tile.scrollIntoView({ block: "center", behavior: "instant" });
		await step("closed, there is no dialog to reach", async () => {
			await expect(canvas.queryByRole("dialog")).toBeNull();
		});
		await step("the tile opens the dialog, the large picture and caption in it", async () => {
			await userEvent.click(tile);
			const dialog = within(await opened());
			await expect(dialog.getByRole("img", { name })).toBeVisible();
			await expect(dialog.getByText("Thursday's rye, sliced")).toBeVisible();
		});
		await step("Escape closes it and focus returns to the tile", async () => {
			((await opened()) as HTMLDialogElement).requestClose();
			await closed();
			await expect(tile).toHaveFocus();
		});
		await step("the close button closes it, focus back on the tile", async () => {
			await userEvent.click(tile);
			await userEvent.click(within(await opened()).getByRole("button", { name: "Close" }));
			await closed();
			await expect(tile).toHaveFocus();
		});
		await step("a click on the backdrop closes it", async () => {
			await userEvent.click(tile);
			const dialog = await opened();
			await userEvent.pointer({
				keys: "[MouseLeft]",
				target: dialog,
				coords: { clientX: 2, clientY: 2 },
			});
			await closed();
		});
	},
};

/** A post that was never revised shows no updated line, and one with no author no byline. */
export const NeverUpdated: Story = {
	args: { doc: { ...blogPost, updatedAt: null, author: undefined } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/Updated/)).toBeNull();
		await expect(canvas.queryByText("Ines Varga")).toBeNull();
	},
};

/** An updated date equal to the published one is not a revision. */
export const UpdatedSameDay: Story = {
	args: { doc: { ...blogPost, updatedAt: blogPost.publishedAt } },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText(/Updated/)).toBeNull();
	},
};

/** A journal at another path, with its own words for the way back. */
export const OtherBasePath: Story = {
	args: { basePath: "/journal", backLabel: "The whole journal" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "The whole journal" })).toHaveAttribute(
			"href",
			"/journal",
		);
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** The body as plain paragraphs only, on a phone, with a long address inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		doc: {
			...blogPost,
			title: "Why our seeded rye rests two whole days before it reaches the counter",
			blocks: [
				...blogPost.blocks,
				{ type: "p", text: `Questions about a standing order go to ${longEmail}.` },
			],
		},
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * One unbroken word in the headline, on a phone. The heading never breaks inside a
 * word, so the page scrolls sideways.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { doc: { ...blogPost, title: `The ${unbroken}` } },
	play: async () => {
		await knownBug("heading-long-word-overflow", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
