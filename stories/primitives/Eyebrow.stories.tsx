import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Eyebrow } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll, onDarkBand } from "./support";

/**
 * The small mono kicker above a heading, trailed by a bar that fades to the
 * right, in the brand's primary.
 */
const meta = {
	title: "Primitives/Eyebrow",
	component: Eyebrow,
	parameters: { layout: "padded" },
	args: { children: "Baked daily" },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The primary on the page surface fails contrast (stories/findings/primitives.md). */
const eyebrowContrast = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("eyebrow-contrast") },
} satisfies Story;

/** A paragraph, so it never adds a heading to the outline. */
export const Default: Story = {
	...eyebrowContrast,
	play: async ({ canvas }) => {
		const eyebrow = canvas.getByText("Baked daily");
		await expect(eyebrow.tagName).toBe("P");
		await expect(canvas.queryByRole("heading")).toBeNull();
	},
};

/** Centered, the trailing fade included. */
export const Center: Story = {
	...eyebrowContrast,
	args: { center: true },
	decorators: [
		(Story) => (
			<div style={{ display: "grid" }}>
				<Story />
			</div>
		),
	],
};

/** On a dark band the color lifts to the bright primary. */
export const OnDark: Story = { args: { onDark: true }, decorators: [onDarkBand] };

/**
 * On the primary field it turns to the words' color, softened, which fails
 * contrast like every word on that field (stories/findings/sections.md,
 * `on-primary-field-contrast`).
 */
export const OnPrimaryField: Story = {
	tags: ["known-issue"],
	parameters: { ...knownIssues("on-primary-field-contrast") },
	decorators: [
		(Story) => (
			<div className="on-primary" style={{ background: "var(--primary)", padding: 24 }}>
				<Story />
			</div>
		),
	],
};

/** The deprecated `run` prop changes nothing: the fade is the only rendering. */
export const DeprecatedRun: Story = { ...eyebrowContrast, args: { run: true } };

/**
 * The longest kicker, on a phone. It should wrap inside the screen; the unbroken word runs
 * past it and the page scrolls sideways (stories/findings/primitives.md,
 * `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	...eyebrowContrast,
	globals: pin("phone"),
	args: { children: `Wholesale for cafes, grocers, and ${longWord} lovers across Fairhaven` },
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
