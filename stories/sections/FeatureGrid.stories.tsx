import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, type within } from "storybook/test";
import { FeatureGrid } from "../../src/sections";
import { features, unbroken } from "../fixtures/sections";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * A heading over a grid of numbered cards. The heading's eyebrow and the
 * cards' indexes fail contrast on this theme (stories/findings/).
 */
const meta = {
	title: "Sections/FeatureGrid",
	component: FeatureGrid,
	tags: ["known-issue"],
	parameters: { ...knownIssues("eyebrow-contrast", "feature-num-contrast") },
	args: {
		eyebrow: "What we bake",
		title: "Four things, done every morning",
		lead: "Everything is baked in the back of the shop, and most of it is gone by noon.",
		items: features,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof FeatureGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const cardTops = (canvas: ReturnType<typeof within>) =>
	canvas
		.getAllByRole("heading", { level: 3 })
		.map((title: HTMLElement) => Math.round(title.getBoundingClientRect().top));

/** Four across, the default. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(new Set(cardTops(canvas)).size).toBe(1);
		await expect(canvas.getByText("01")).toBeVisible();
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** Three across: the fourth card wraps to a second row. */
export const ThreeColumns: Story = {
	args: { columns: 3 },
	play: async ({ canvas }) => {
		const tops = cardTops(canvas);
		await expect(new Set(tops.slice(0, 3)).size).toBe(1);
		await expect(tops[3]).toBeGreaterThan(tops[0]);
	},
};

/** Two across. */
export const TwoColumns: Story = {
	args: { columns: 2 },
	play: async ({ canvas }) => {
		const tops = cardTops(canvas);
		await expect(tops[0]).toBe(tops[1]);
		await expect(tops[2]).toBeGreaterThan(tops[1]);
	},
};

/** On the page's own surface. */
export const DefaultSurface: Story = { args: { surface: "default" } };

/** Linked cards: the whole card is the link, its label trailing. */
export const Linked: Story = {
	args: {
		items: features.map((item) => ({
			num: item.num,
			title: item.title,
			description: String(item.description),
			href: `/menu/${item.title.toLowerCase().replace(/\s+/g, "-")}`,
			linkLabel: "See it",
		})),
	},
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: /Country sourdough/ });
		await expect(link).toHaveAttribute("href", "/menu/country-sourdough");
		await expect(link).toHaveTextContent("See it");
	},
};

/** An unlinked card whose description links one word. */
export const LinkInsideDescription: Story = {
	args: {
		items: [
			{
				title: "Country sourdough",
				description: (
					<>
						A two day <a href="/glossary/levain">levain</a> ferment.
					</>
				),
			},
			...features.slice(1),
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "levain" })).toHaveAttribute(
			"href",
			"/glossary/levain",
		);
	},
};

/** No numbers, no eyebrow, no lead. */
export const Plain: Story = {
	// Nothing here shows the file's known issue, so the story is checked whole.
	tags: ["!known-issue"],
	parameters: { ...knownIssues() },
	args: {
		eyebrow: undefined,
		lead: undefined,
		items: features.map(({ num: _num, ...item }) => item),
	},
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("01")).toBeNull();
	},
};

/** The tablet sits between the grid's steps: two across. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas }) => {
		const tops = cardTops(canvas);
		await expect(tops[0]).toBe(tops[1]);
		await expect(tops[2]).toBeGreaterThan(tops[1]);
	},
};

/** One to a row on a phone, with the longest realistic copy inside the page. */
export const Phone: Story = {
	globals: pin("phone"),
	args: {
		items: [
			...features,
			{
				num: "05",
				title: "The guild's prize loaf, once a year",
				description:
					"Baked once a year for the county fair in the autumn, and sold the morning after.",
			},
		],
	},
	play: async ({ canvas }) => {
		const tops = cardTops(canvas);
		await expect(tops[1]).toBeGreaterThan(tops[0]);
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};

/**
 * One unbroken word in a card's title, on a phone. The card's title never
 * breaks inside a word, so the card, and the page, scroll sideways.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { items: [{ num: "01", title: unbroken, description: "The guild's prize loaf." }] },
	play: async () => {
		await knownBug("heading-long-word-overflow", async () => {
			await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		});
	},
};
