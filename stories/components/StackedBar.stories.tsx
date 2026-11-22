import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StackedBar } from "../../src/components";
import { segments } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * One bar split into the parts of a whole, and a key naming each part and
 * its figure. The bar is one picture whose name carries every part.
 */
const meta = {
	title: "Components/StackedBar",
	component: StackedBar,
	decorators: [inWrap],
	args: { segments },
	globals: pin("desktop"),
} satisfies Meta<typeof StackedBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The name reads every part and figure; each part's width is its share of the whole. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("img");
		await expect(bar).toHaveAccessibleName(
			"Map listing: 1,840, Search: 1,158, Social: 620, Typed in: 330",
		);
		const parts = Array.from(bar.children) as HTMLElement[];
		const widths = parts.map((part) => part.getBoundingClientRect().width);
		await expect(widths[0] ?? 0).toBeGreaterThan(widths[1] ?? 0);
		await expect(canvas.getByText("1,840")).toBeVisible();
	},
};

/** A figure printed its own way. */
export const CustomDisplay: Story = {
	args: {
		segments: [
			{ label: "Map listing", value: 0.46, display: "46%", tone: "good" },
			{ label: "Search", value: 0.54, display: "54%", tone: "info" },
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img")).toHaveAccessibleName("Map listing: 46%, Search: 54%");
	},
};

/** A part of zero is keyed and named, but not drawn. */
export const ZeroPart: Story = {
	args: { segments: [...segments, { label: "Email", value: 0, tone: "bad" }] },
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("img");
		await expect(bar.children).toHaveLength(4);
		await expect(bar).toHaveAccessibleName(/Email: 0/);
		await expect(canvas.getByText("Email")).toBeVisible();
	},
};

/** Parts in their own colors, for parts that are neither good nor bad. */
export const OwnColors: Story = {
	args: {
		segments: [
			{ label: "Flour", value: 62, color: "#c9a66b" },
			{ label: "Water", value: 30, color: "#6b8fb3" },
			{ label: "Salt and starter", value: 8, color: "#8a5a3c" },
		],
	},
};

/** The bar alone, for a page that keys the parts itself; it keeps its spoken name. */
export const NoKey: Story = {
	args: { showKey: false },
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("list")).toBeNull();
		await expect(canvas.getByRole("img")).toHaveAccessibleName(/Map listing: 1,840/);
	},
};

/** Every part zero: an empty bar that still names each part. */
export const AllZero: Story = {
	args: { segments: segments.map((segment) => ({ ...segment, value: 0 })) },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img").children).toHaveLength(0);
	},
};

/** Many parts with long names, on a phone: the key wraps and nothing scrolls sideways. */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		segments: [
			...segments,
			{ label: "A neighbor's newsletter in the Riverside blocks", value: 140, tone: "muted" },
			{ label: "The chalkboard on the sidewalk", value: 90, tone: "warn" },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
