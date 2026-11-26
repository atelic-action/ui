import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, type within } from "storybook/test";
import { FeatureGrid } from "../../src/sections";
import { features, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Presents several offerings at a glance as numbered cards under a heading;
 * use `FeatureDetail` to explain one at length. A heading over a grid of
 * numbered cards.
 */
const meta = {
	title: "Sections/FeatureGrid",
	component: FeatureGrid,
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
		await expectNoSidewaysScroll();
	},
};

/**
 * One unbroken word in a card's title, on a phone: the title breaks it where
 * it must, and neither the card nor the page scrolls sideways.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { items: [{ num: "01", title: unbroken, description: "The guild's prize loaf." }] },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * A card whose link leaves the site (`external`) opens in a new tab and says
 * so to a screen reader, after its own words; a card on the site keeps the
 * tab and says nothing more.
 */
export const ExternalCard: Story = {
	args: {
		items: [
			{
				num: "01",
				title: "Price sheet",
				description: "This season's list, on the wholesale portal",
				href: "https://portal.example.com/prices",
				linkLabel: "Open the portal",
				external: true,
			},
			{
				num: "02",
				title: "Standing orders",
				description: "Delivered before you open",
				href: "/wholesale/standing",
				linkLabel: "Start one",
			},
		],
		columns: 2,
	},
	play: async ({ canvas }) => {
		const external = canvas.getByRole("link", { name: /Price sheet.*opens in a new tab$/ });
		await expect(external).toHaveAttribute("target", "_blank");
		await expect(external).toHaveAttribute("rel", "noopener");
		const own = canvas.getByRole("link", { name: /Standing orders/ });
		await expect(own).not.toHaveAttribute("target");
		await expect(own).not.toHaveAccessibleName(/new tab/);
	},
};
