import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { BasePathProvider } from "../../src/routing";
import { BlogIndex } from "../../src/sections";
import { blogItems, unbroken } from "../fixtures/sections";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The journal's archive: every post as a plain stack, newest first, each a link to its page.
 * Its muted dates fail contrast on this theme (stories/findings/sections.md).
 */
const meta = {
	title: "Sections/BlogIndex",
	component: BlogIndex,
	tags: ["known-issue"],
	parameters: { ...knownIssues("muted-text-contrast") },
	args: { items: blogItems },
	globals: pin("desktop"),
} satisfies Meta<typeof BlogIndex>;

export default meta;
type Story = StoryObj<typeof meta>;

const entries = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list")).getAllByRole("listitem");

/** Each entry: the date and reading time, the title, the excerpt, all one link. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const items = entries(canvas);
		await expect(items).toHaveLength(3);
		const first = within(items[0]).getByRole("link");
		await expect(first).toHaveAttribute("href", "/blog/why-the-rye-rests");
		await expect(within(first).getByRole("heading", { level: 2 })).toHaveTextContent(
			"Why our rye rests two days",
		);
		await expect(first).toHaveTextContent("5 min read");
		await expect(within(first).getByText(/baked on Tuesday/)).toBeVisible();
		await expect(within(first).getByText("October 14, 2026")).toBeVisible();
		// An entry with no excerpt or reading time carries neither.
		await expect(within(items[2]).getByRole("link")).not.toHaveTextContent("min read");
	},
};

/** The slugs hang from another path. */
export const OtherBasePath: Story = {
	args: { basePath: "/journal" },
	play: async ({ canvas }) => {
		await expect(within(entries(canvas)[0]).getByRole("link")).toHaveAttribute(
			"href",
			"/journal/why-the-rye-rests",
		);
	},
};

/** Under a site's base path (a preview served at /proto), every link carries it. */
export const UnderBasePath: Story = {
	decorators: [
		(Story) => (
			<BasePathProvider base="/proto">
				<Story />
			</BasePathProvider>
		),
	],
	play: async ({ canvas }) => {
		await expect(within(entries(canvas)[0]).getByRole("link")).toHaveAttribute(
			"href",
			"/proto/blog/why-the-rye-rests",
		);
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** No posts yet: an empty list. */
export const Empty: Story = {
	// Nothing here shows the file's known issue, so the story is checked whole.
	tags: ["!known-issue"],
	parameters: { ...knownIssues() },
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
	},
};

/** Many posts, the longest realistic titles, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: Array.from({ length: 8 }, (_, i) => ({
			slug: `post-${i}`,
			title: "Why our seeded rye rests two whole days before it reaches the counter on Thursday",
			description:
				"The seeded rye is baked on Tuesday and sold on Thursday, and the two days between are the whole point of the loaf.",
			publishedAt: `2026-0${(i % 9) + 1}-14`,
			readingMinutes: 12,
		})),
	},
	play: async ({ canvas }) => {
		await expect(entries(canvas)).toHaveLength(8);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * One unbroken word in an entry's title, on a phone. The heading never breaks inside a
 * word, so the page scrolls sideways.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { items: [{ slug: "guild", title: `The ${unbroken}`, publishedAt: "2026-10-01" }] },
	play: async () => {
		await knownBug("heading-long-word-overflow", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
