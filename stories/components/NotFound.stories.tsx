import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { NotFound } from "../../src/components";
import { cta, flatLinks } from "../fixtures/bakery";
import { expectNoSidewaysScroll } from "../primitives/support";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * The page a missing path renders: a headline, a row of popular pages, and
 * the closing call to action. It renders the page body only; a site wraps it
 * in its shell.
 */
const meta = {
	title: "Components/NotFound",
	component: NotFound,
	decorators: [
		(Story) => (
			<main className="clears-nav">
				<Story />
			</main>
		),
	],
	args: {
		title: "That loaf is not on the shelf.",
		lead: "The page you were after has moved or never existed. The bread is still where it always was.",
		links: flatLinks,
		closing: { eyebrow: "Still hungry", title: "Order ahead for Saturday." },
		primaryCTA: cta,
	},
	globals: pin("desktop"),
} satisfies Meta<typeof NotFound>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page's `h1`, the popular pages as a named nav, and the closing pair of actions. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
			"That loaf is not on the shelf.",
		);
		await expect(canvas.getByText("404")).toBeVisible();
		const nav = within(canvas.getByRole("navigation", { name: "Popular Pages" }));
		await expect(nav.getAllByRole("link")).toHaveLength(4);
		await expect(canvas.getByRole("link", { name: /Order ahead/ })).toHaveAttribute(
			"href",
			"/order",
		);
		await expect(canvas.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
	},
};

/** No popular pages: the row and its heading are gone. */
export const NoLinks: Story = {
	args: { links: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("navigation")).toBeNull();
	},
};

/** The site's own words for the kicker, the row, and the way back. */
export const CustomWords: Story = {
	args: {
		eyebrow: "Not found",
		linksLabel: "Try one of these",
		secondary: { label: "See the menu", href: "/menu" },
		lead: undefined,
		closing: { title: "Order ahead for Saturday." },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("navigation", { name: "Try one of these" })).toBeVisible();
		await expect(canvas.getByRole("link", { name: "See the menu" })).toBeVisible();
		await expect(canvas.queryByText("Still hungry")).toBeNull();
	},
};

/** An outside order flow opens in a new tab. */
export const ExternalAction: Story = {
	args: { primaryCTA: { label: "Order ahead", href: "https://order.example.com", external: true } },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: /Order ahead/ })).toHaveAttribute(
			"target",
			"_blank",
		);
	},
};

/** A phone call never does, whatever the config says. */
export const PhoneAction: Story = {
	args: { primaryCTA: { label: "Call the shop", href: "tel:+15555550142", external: true } },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: /Call the shop/ })).not.toHaveAttribute("target");
	},
};

/**
 * The arrow after the action's words is decoration. It is not hidden, so it
 * is read as part of the link's name (stories/findings/primitives.md,
 * `not-found-arrow-in-name`).
 */
export const ArrowIsDecoration: Story = {
	tags: ["known-issue"],
	play: async ({ canvas }) => {
		await knownBug("not-found-arrow-in-name", async () => {
			await expect(canvas.getByRole("link", { name: "Order ahead" })).toBeVisible();
		});
	},
};

/** On a phone with a long title and every page in the row. */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		title: "That loaf is not on the shelf, and neither is the page you were looking for today.",
		links: [...flatLinks, { label: "Wholesale for cafes and grocers", href: "/wholesale" }],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
