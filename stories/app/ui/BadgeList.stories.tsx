import type { Meta, StoryObj } from "@storybook/react-vite";
import { Wheat } from "lucide-react";
import { expect } from "storybook/test";
import { BadgeList } from "../../../src/app/ui";
import { expectNoSidewaysScroll } from "../../support/geometry";
import { pin } from "../../support/viewports";

const tags = [
	{ label: "Rye" },
	{ label: "Seeded", icon: <Wheat className="h-3 w-3" aria-hidden="true" /> },
	{ label: "Vegan", variant: "secondary" as const },
	{ label: "Nut free" },
	{ label: "Overnight" },
];

/** A wrapping row of small badges, optionally capped with a "+N" for the rest. */
const meta = {
	title: "App/UI/BadgeList",
	component: BadgeList,
	parameters: { layout: "padded" },
	args: { items: tags },
	globals: pin("desktop"),
} satisfies Meta<typeof BadgeList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every tag, outline by default, an icon where one is given. */
export const Default: Story = {
	play: async ({ canvas }) => {
		for (const tag of tags) await expect(canvas.getByText(tag.label)).toBeVisible();
	},
};

/** Capped at two, the rest counted. */
export const Capped: Story = {
	args: { maxDisplay: 2 },
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Rye")).toBeVisible();
		await expect(canvas.queryByText("Vegan")).toBeNull();
		await expect(canvas.getByText("+3")).toBeVisible();
	},
};

/** No tags, no row. */
export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.textContent).toBe("");
	},
};

/**
 * A long tag truncates at the badge's cap with no way to read the rest: no
 * title, no tooltip, so a sighted reader sees "Seventy tw…".
 */
export const LongTag: Story = {
	args: { items: [{ label: "Seventy two hour cold fermented" }, { label: "Rye" }] },
	play: async ({ canvas }) => {
		const long = canvas.getByText("Seventy two hour cold fermented");
		await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
	},
};

/** On a phone the row wraps and never scrolls sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	args: { items: [...tags, ...tags.map((tag) => ({ ...tag, label: `${tag.label} loaf` }))] },
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
