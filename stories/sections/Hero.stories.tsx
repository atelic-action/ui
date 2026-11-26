import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { expect, within } from "storybook/test";
import { Hero } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Opens the home page with the headline, the main actions, and trust figures;
 * use `PageHero` on every other page. The home page opener, in its two
 * layouts: over a full bleed photo, and split beside one.
 */
const meta = {
	title: "Sections/Hero",
	component: Hero,
	args: {
		eyebrow: "Alder Street, since 2014",
		title: (
			<>
				Bread worth the <em className="serif">early line</em>.
			</>
		),
		subtitle:
			"Sourdough, morning buns, and cakes to order, baked in the back of the shop every day but Monday.",
		image: { src: "/images/bakery-band.svg", alt: "Loaves cooling on a rack" },
		primaryCTA: { label: "Order ahead", href: "/order" },
		secondaryCTA: { label: "See the menu", href: "/menu" },
	},
	globals: pin("desktop"),
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overlay: Story = {
	args: {
		trust: [
			{ value: "1,200", label: "Loaves a week" },
			{ value: "4.9", label: "Average review" },
			{ value: "11", label: "Cafes we supply" },
		],
		scrollTarget: "#menu",
	},
	play: async ({ canvas, step }) => {
		await step("the headline, the pair of actions, and the trust figures", async () => {
			await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(
				"Bread worth the early line.",
			);
			await expect(canvas.getByRole("link", { name: "Order ahead" })).toHaveAttribute(
				"href",
				"/order",
			);
			await expect(canvas.getByRole("link", { name: "See the menu" })).toHaveAttribute(
				"href",
				"/menu",
			);
			await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
		});
		await step("a screen tall, the photo behind it all", async () => {
			const photo = canvas.getByRole("img", { name: "Loaves cooling on a rack" });
			const band = photo.getBoundingClientRect();
			await expect(Math.round(band.width)).toBe(window.innerWidth);
			await expect(band.height).toBeGreaterThanOrEqual(window.innerHeight - 1);
		});
		await step("the scroll cue jumps down the page", async () => {
			await expect(canvas.getByRole("link", { name: "Scroll down" })).toHaveAttribute(
				"href",
				"#menu",
			);
		});
	},
};

export const OverlayPhone: Story = {
	globals: pin("phone"),
	args: {
		image: { src: "/images/bakery-band.svg", alt: "Loaves cooling on a rack", position: "27% 35%" },
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Loaves cooling on a rack" })).toHaveStyle({
			objectPosition: "27% 35%",
		});
		await expectNoSidewaysScroll();
	},
};

/** Before the photography exists: the token gradient stands in, and nothing claims to be a picture. */
export const OverlayNoPhoto: Story = {
	args: { image: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("img")).toBeNull();
		await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
	},
};

/**
 * The copy and its actions on the primary field beside the photo, at the
 * height the copy needs. The headline's serif accent takes the field's own
 * words color, and the button on the field turns to the surface.
 */
export const Split: Story = {
	args: {
		layout: "split",
		secondaryCTA: { label: "Call (555) 555-0142", href: "tel:+15555550142" },
	},
	play: async ({ canvas }) => {
		const copy = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
		const photo = canvas
			.getByRole("img", { name: "Loaves cooling on a rack" })
			.getBoundingClientRect();
		await expect(photo.left).toBeGreaterThanOrEqual(copy.right);
		await expect(photo.top).toBeLessThan(copy.bottom);
		// The split takes the copy's height, not the screen's.
		await expect(
			canvas.getByRole("heading", { level: 1 }).closest("section")?.getBoundingClientRect().height,
		).toBeLessThan(window.innerHeight);
		await expect(canvas.queryByRole("link", { name: "Scroll down" })).toBeNull();
		await expect(canvas.getByRole("link", { name: "Call (555) 555-0142" })).not.toHaveAttribute(
			"target",
		);
	},
};

/** On a phone the split stacks, the photo first. */
export const SplitPhone: Story = {
	args: { layout: "split" },
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const copy = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
		const photo = canvas
			.getByRole("img", { name: "Loaves cooling on a rack" })
			.getBoundingClientRect();
		await expect(photo.bottom).toBeLessThanOrEqual(copy.top);
		await expect(Math.round(photo.width)).toBe(window.innerWidth);
	},
};

export const SplitNoPhoto: Story = {
	args: { layout: "split", image: undefined },
};

/** Only the headline: every other part is optional. */
export const HeadlineOnly: Story = {
	args: { eyebrow: undefined, subtitle: undefined, primaryCTA: undefined, secondaryCTA: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** The longest realistic copy, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		eyebrow: "Alder Street and the Riverside blocks, since 2014",
		title: "Country sourdough, seeded rye, and morning buns worth setting an alarm for",
		subtitle:
			"Baked in the back of the shop every day but Monday, delivered to eleven cafes before they open, and cakes to order with two days' notice.",
		primaryCTA: { label: "Order for Saturday pickup", href: "/order" },
		secondaryCTA: { label: "See this week's menu", href: "/menu" },
		trust: [
			{ value: "1,200", label: "Loaves a week" },
			{ value: "4.9", label: "Average review" },
			{ value: "11", label: "Cafes we supply" },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};

/** The kicker without its trailing rule (`eyebrowRule={false}`). */
export const EyebrowWithoutRule: Story = {
	args: { eyebrowRule: false },
	play: async ({ canvas }) => {
		const eyebrow = canvas.getByText("Alder Street, since 2014");
		await expect(getComputedStyle(eyebrow, "::after").display).toBe("none");
	},
};

/**
 * The split hero's copy sides set by `--hero-split-pad` (here 40px) rather
 * than the page wrap's edge, which puts them 176px in at 1280.
 */
export const SplitTighterPad: Story = {
	args: { layout: "split" },
	decorators: [
		(Story) => (
			<div style={{ "--hero-split-pad": "40px" } as CSSProperties}>
				<Story />
			</div>
		),
	],
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { level: 1 });
		await expect(Math.round(heading.getBoundingClientRect().left)).toBe(40);
	},
};

/** The default: the copy starts where the page wrap's content does. */
export const SplitDefaultPad: Story = {
	args: { layout: "split" },
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { level: 1 });
		await expect(Math.round(heading.getBoundingClientRect().left)).toBe(176);
	},
};
