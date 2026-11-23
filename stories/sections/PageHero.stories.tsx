import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { PageHero } from "../../src/sections";
import { unbroken } from "../fixtures/sections";
import { resolvedColor } from "../support/color";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * An interior page's opener on the alternate band: eyebrow, headline, lead.
 */
const meta = {
	title: "Sections/PageHero",
	component: PageHero,
	args: {
		eyebrow: "Cakes to order",
		title: (
			<>
				A cake for the <em className="serif">day itself</em>
			</>
		),
		lead: "Two days for a round cake, two weeks for anything tiered. Every one is decorated by hand.",
	},
	globals: pin("desktop"),
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Left aligned: the headline and the lead start on one edge. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 1 });
		await expect(title).toHaveTextContent("A cake for the day itself");
		const lead = canvas.getByText(/Two days for a round cake/);
		await expect(Math.round(lead.getBoundingClientRect().left)).toBe(
			Math.round(title.getBoundingClientRect().left),
		);
	},
};

/** Centered: the headline sits in the middle of the page. */
export const Centered: Story = {
	args: { center: true },
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 1 });
		const range = document.createRange();
		range.selectNodeContents(title);
		const words = range.getBoundingClientRect();
		const middle = (words.left + words.right) / 2;
		await expect(Math.abs(middle - window.innerWidth / 2)).toBeLessThan(4);
	},
};

/** On the page's own surface, for a page whose next band is the alternate one. */
export const DefaultSurface: Story = { args: { surface: "default" } };

/** Extra content under the lead: jump links. */
export const WithChildren: Story = {
	args: {
		children: (
			<p>
				<a href="#round">Round cakes</a> · <a href="#tiered">Tiered cakes</a>
			</p>
		),
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Round cakes" })).toHaveAttribute(
			"href",
			"#round",
		);
	},
};

/** Only the headline: the eyebrow and the lead are optional. */
export const HeadlineOnly: Story = {
	args: { eyebrow: undefined, lead: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
	},
};

/** The longest realistic copy, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		eyebrow: "Cakes, tarts, and the wedding season",
		title: "Cakes for birthdays, weddings, anniversaries, and the Saturday after a long week",
		lead: "Two days for a round cake, two weeks for anything tiered, and a tasting on a Saturday morning for a wedding, with every one decorated by hand in the back of the shop.",
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * One unbroken word in the headline, on a phone: a word wider than the
 * screen breaks where it must, and the page stays still.
 */
export const UnbrokenWord: Story = {
	globals: pin("phone"),
	args: { title: `The ${unbroken}` },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/**
 * `surface="primary"`: the band on the primary fill, the kicker, the
 * headline, its accent, and the lead each in --on-primary.
 */
export const OnPrimary: Story = {
	args: { surface: "primary" },
	play: async ({ canvas }) => {
		const title = canvas.getByRole("heading", { level: 1 });
		const band = title.closest("section") as HTMLElement;
		await expect(band).toHaveAttribute("data-ground", "primary");
		const onPrimary = resolvedColor(band, "var(--on-primary)");
		await expect(getComputedStyle(band).backgroundColor).toBe(
			resolvedColor(band, "var(--primary-fill, var(--primary))"),
		);
		for (const words of [
			title,
			canvas.getByText("day itself"),
			canvas.getByText("Cakes to order"),
			canvas.getByText(/Two days for a round cake/),
		]) {
			await expect(getComputedStyle(words).color).toBe(onPrimary);
		}
	},
};
