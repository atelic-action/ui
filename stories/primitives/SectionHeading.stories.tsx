import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { GridLayout, SectionHeading } from "../../src/primitives";
import { ExpandList, FeatureGrid } from "../../src/sections";
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

/** The block gap the page's density sets, read where the heading sits. */
const blockGap = (element: Element) =>
	Number.parseFloat(getComputedStyle(element).getPropertyValue("--block-gap"));
const gapUnder = (heading: Element, next: Element) =>
	next.getBoundingClientRect().top - heading.getBoundingClientRect().bottom;

/**
 * A grid set straight after the heading sits the block gap under its lead,
 * as the package's own sections set theirs, with no styling of the page's own.
 */
export const FollowedByGrid: Story = {
	render: (args) => (
		<>
			<SectionHeading {...args} />
			<GridLayout columns={3} ariaLabel="Towns">
				<span>Fairhaven</span>
				<span>Alder Point</span>
				<span>Birchmoor</span>
			</GridLayout>
		</>
	),
	play: async ({ canvas }) => {
		const lead = canvas.getByText(/Standing orders/);
		const grid = canvas.getByRole("list", { name: "Towns" });
		await expect(Math.round(gapUnder(lead, grid))).toBe(Math.round(blockGap(grid)));
	},
};

/** A fold out list set straight after the heading sits the same gap under it. */
export const FollowedByList: Story = {
	args: { lead: undefined },
	render: (args) => (
		<>
			<SectionHeading {...args} />
			<ExpandList
				items={[
					{ title: "Slicing", body: <p>Any loaf, on the counter's slicer.</p> },
					{ title: "Gift cards", body: <p>Any amount, at the counter.</p> },
				]}
			/>
		</>
	),
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { level: 2 });
		const first = canvas.getByRole("button", { name: /Slicing/ });
		// The first row sits under the list's own top rule, a hairline.
		await expect(Math.round(gapUnder(heading, first) - 1)).toBe(Math.round(blockGap(heading)));
	},
};

/** Inside a section that sets its own gap the heading adds none: `FeatureGrid`'s cards sit one block gap down. */
export const InsideASection: Story = {
	decorators: [],
	render: (args) => (
		<FeatureGrid
			title={args.title}
			lead={args.lead}
			items={[
				{ title: "Sourdough", description: "Two day ferment." },
				{ title: "Morning buns", description: "Out by seven." },
			]}
		/>
	),
	play: async ({ canvas }) => {
		const lead = canvas.getByText(/Standing orders/);
		const card = canvas.getByRole("heading", { name: "Sourdough" });
		const grid = card.parentElement as HTMLElement;
		await expect(Math.round(gapUnder(lead, grid))).toBe(Math.round(blockGap(grid)));
	},
};
