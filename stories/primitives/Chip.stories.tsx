import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Chip } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";
import { onDarkBand } from "./support";

/**
 * Tags something with a short mono label, such as a credential, a feature, or
 * a service area. A small mono tag, for a credential, a feature, or a service
 * area.
 */
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
 * The longest label on a phone stays inside the screen: a chip moves whole
 * to its own line, and only a label longer than the column wraps inside the
 * pill, every word still shown.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: { children: `Certified ${longWord} baker` },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
