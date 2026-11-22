import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Checklist } from "../../src/components";
import { longURL } from "../fixtures/primitives";
import { expectNoSidewaysScroll, inWrap } from "../primitives/support";
import { knownBug } from "../support/known-issues";
import { pin } from "../support/viewports";

const items = [
	{ label: "Hours on the page", detail: "Tuesday to Sunday, matching the map", pass: true },
	{ label: "Phone number is a link", pass: true },
	{ label: "Menu readable on a phone", detail: "It is a photo of the chalkboard", pass: false },
	{ label: "Order form delivers", detail: "Posts to an address that bounces", pass: false },
];

/** A short list of checks, each passed or failed, in two columns when there is room. */
const meta = {
	title: "Components/Checklist",
	component: Checklist,
	decorators: [inWrap],
	args: { items },
	globals: pin("desktop"),
} satisfies Meta<typeof Checklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each mark is named, so a pass and a fail are never told by color alone; wide, the list runs in two columns. */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("img", { name: "Passes" })).toHaveLength(2);
		await expect(canvas.getAllByRole("img", { name: "Fails" })).toHaveLength(2);
		const [first, second] = canvas.getAllByRole("listitem") as HTMLElement[];
		await expect(first?.getBoundingClientRect().top).toBe(second?.getBoundingClientRect().top);
	},
};

/** A caller's own words for a pass and a fail. */
export const CustomLabels: Story = {
	args: { passLabel: "Done", failLabel: "To fix" },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("img", { name: "Done" })).toHaveLength(2);
		await expect(canvas.getAllByRole("img", { name: "To fix" })).toHaveLength(2);
	},
};

/** Every check passes. */
export const AllPass: Story = { args: { items: items.map((item) => ({ ...item, pass: true })) } };

/** No checks: an empty list. */
export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
	},
};

/** On a phone the list runs in one column. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const [first, second] = canvas.getAllByRole("listitem") as HTMLElement[];
		await expect(second?.getBoundingClientRect().top).toBeGreaterThan(
			first?.getBoundingClientRect().bottom ?? 0,
		);
		await expectNoSidewaysScroll();
	},
};

/**
 * Many checks with long details and a bare address, on a phone. It should wrap inside the screen; the bare address runs past it
 * and the page scrolls sideways (stories/findings/primitives.md, `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: {
		items: [
			...items,
			{ label: "Canonical address", detail: longURL, pass: false },
			...Array.from({ length: 6 }, (_, i) => ({
				label: `Menu page ${i + 1} in the index`,
				detail: "Found by a site search and listed in the sitemap the site publishes",
				pass: i % 2 === 0,
			})),
		],
	},
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
