import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Eyebrow } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";
import { onDarkBand } from "./support";

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

/** A paragraph, so it never adds a heading to the outline. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const eyebrow = canvas.getByText("Baked daily");
		await expect(eyebrow.tagName).toBe("P");
		await expect(canvas.queryByRole("heading")).toBeNull();
	},
};

/** Centered, the trailing fade included. */
export const Center: Story = {
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

/** On the primary field (`--primary-fill`, as a section paints it) it turns to the words' color. */
export const OnPrimaryField: Story = {
	decorators: [
		(Story) => (
			<div className="on-primary" style={{ background: "var(--primary-fill)", padding: 24 }}>
				<Story />
			</div>
		),
	],
};

/** The deprecated `run` prop changes nothing: the fade is the only rendering. */
export const DeprecatedRun: Story = {
	args: { run: true },
};

/**
 * The longest kicker, on a phone: it wraps inside the screen, the unbroken
 * word breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: { children: `Wholesale for cafes, grocers, and ${longWord} lovers across Fairhaven` },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
