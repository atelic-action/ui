import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Chip } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";
import { expectNoSidewaysScroll, onDarkBand } from "./support";

/** A small mono tag, for a credential, a feature, or a service area. */
const meta = {
	title: "Primitives/Chip",
	component: Chip,
	parameters: { layout: "padded" },
	args: { children: "Since 2014" },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain, it is text, not a link. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Since 2014")).toBeVisible();
		await expect(canvas.queryByRole("link")).toBeNull();
	},
};

/** The brand dot before the label. */
export const WithDot: Story = { args: { dot: true, children: "Open today" } };

export const OnDark: Story = { args: { onDark: true, dot: true }, decorators: [onDarkBand] };

/** With an `href` it is a link, a jump on a page hero. */
export const AsLink: Story = {
	args: { href: "#visit", children: "Find the shop" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Find the shop" })).toHaveAttribute(
			"href",
			"#visit",
		);
	},
};

/** A row of service areas, wrapping as a row of chips does. */
export const Row: Story = {
	render: () => (
		<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
			{["Fairhaven", "Old Mill", "The Riverside blocks", "Alder Street", "North Bank"].map(
				(area) => (
					<Chip key={area}>{area}</Chip>
				),
			)}
		</div>
	),
};

/**
 * The longest label on a phone should stay inside the screen. A chip never
 * wraps its words, so a long one runs past it and the page scrolls sideways
 * (stories/findings/primitives.md, `chip-nowrap-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: { children: `Certified ${longWord} baker` },
	play: async () => {
		await knownBug("chip-nowrap-overflow", expectNoSidewaysScroll);
	},
};
