import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { SectionHeading } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll, inWrap, onDarkBand } from "./support";

/** The standard section opener: an eyebrow, the title, and a lead. */
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
 * On a dark band the eyebrow lifts, but the lead keeps the page's quiet ink
 * and all but vanishes (stories/findings/primitives.md,
 * `section-heading-on-dark-lead`).
 */
export const OnDark: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("section-heading-on-dark-lead") },
	args: { onDark: true },
	decorators: [onDarkBand],
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
 * The longest title and lead, with an unbroken word, on a phone. It should wrap inside the screen; the unbroken word runs
 * past it and the page scrolls sideways (stories/findings/primitives.md,
 * `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: {
		eyebrow: "Wholesale for cafes, grocers, and markets",
		title: `Standing orders of ${longWord} for every counter in Fairhaven`,
		lead: "Delivered before six on weekdays and seven on Saturday, invoiced monthly, and changed by a message the afternoon before.",
	},
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
