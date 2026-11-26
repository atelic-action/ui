import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SectionHeading } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";
import { inWrap, onDarkBand } from "./support";

/**
 * Opens a section with an eyebrow, a title, and a lead, so every section opens
 * alike. The standard section opener: an eyebrow, the title, and a lead.
 */
const meta = {
	title: "Primitives/SectionHeading",
	component: SectionHeading,
	decorators: [inWrap],
	args: {
		eyebrow: "Wholesale",
		title: "Bread for your counter, before you open.",
		lead: "Standing orders for cafes and grocers across Fairhaven, delivered by six.",
	},
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An `h2` by default, with the eyebrow and the lead outside it. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { level: 2 });
		await expect(heading).toHaveAccessibleName("Bread for your counter, before you open.");
		const eyebrow = canvas.getByText("Wholesale");
		await expect(eyebrow.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			heading.getBoundingClientRect().top,
		);
	},
};

/** The title alone. */
export const TitleOnly: Story = {
	args: { eyebrow: undefined, lead: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("Wholesale")).toBeNull();
	},
};

export const Center: Story = { args: { center: true } };

/** A page's opener: an `h1`. */
export const AsH1: Story = {
	args: { as: "h1" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
	},
};

export const AsH3: Story = {
	args: { as: "h3" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { level: 3 })).toBeVisible();
	},
};

/**
 * On a dark band the whole heading lifts: the eyebrow to the bright primary,
 * the title to the band's own words, and the lead to its quiet words, each
 * clearing 4.5 to 1 there.
 */
export const OnDark: Story = {
	args: { onDark: true },
	decorators: [onDarkBand],
	play: async ({ canvas }) => {
		const ink = (element: HTMLElement) => getComputedStyle(element).color;
		const title = canvas.getByRole("heading", { level: 2 });
		const lead = title.nextElementSibling as HTMLElement;
		// The title in the band's own words whatever color a site gives its
		// headings, the lead in the band's quiet words; the page's own ink
		// for them (--ink-soft) would all but vanish here.
		await expect(ink(title)).toBe("rgb(255, 255, 255)");
		await expect(ink(lead)).toBe("rgba(248, 244, 237, 0.74)");
	},
};

/** A title with serif emphasis, the way a site sets one. */
export const EmphasizedTitle: Story = {
	args: {
		title: (
			<>
				Bread for your counter, <em>before you open.</em>
			</>
		),
	},
};

/**
 * The longest title and lead, with an unbroken word, on a phone: both wrap
 * inside the screen, the word breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		eyebrow: "Wholesale for cafes, grocers, and markets",
		title: `Standing orders of ${longWord} for every counter in Fairhaven`,
		lead: "Delivered before six on weekdays and seven on Saturday, invoiced monthly, and changed by a message the afternoon before.",
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
