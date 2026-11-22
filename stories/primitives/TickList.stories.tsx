import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { TickList } from "../../src/primitives";
import { longWord } from "../fixtures/primitives";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/** A list with a check mark before each item, for a feature or a price card. */
const meta = {
	title: "Primitives/TickList",
	component: TickList,
	parameters: { layout: "padded" },
	args: { items: ["Ready by eight", "Paid at pickup", "Two days for a cake"] },
} satisfies Meta<typeof TickList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A real list; the ticks are hidden, so a screen reader hears only the items. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const items = canvas.getAllByRole("listitem");
		await expect(items).toHaveLength(3);
		await expect(items[0]?.textContent).toBe("Ready by eight");
	},
};

/** No items: an empty list. */
export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
	},
};

/** Items take nodes, a link among them. */
export const RichItems: Story = {
	args: {
		items: [
			"Ready by eight",
			<>
				Paid at pickup, or <a href="/order">ahead online</a>
			</>,
		],
	},
};

/**
 * The longest items, on a phone: they wrap inside the screen, the unbroken
 * word breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		items: [
			"Delivered before six on weekdays and seven on Saturday, invoiced at the end of the month",
			`The ${longWord}, sliced to order`,
			...Array.from({ length: 8 }, (_, i) => `Standing order slot ${i + 1}`),
		],
	},
	play: async ({ canvas }) => {
		const first = canvas.getAllByRole("listitem")[0] as HTMLElement;
		const tick = first.querySelector("[aria-hidden='true']") as HTMLElement;
		await expect(
			Math.abs(tick.getBoundingClientRect().top - first.getBoundingClientRect().top),
		).toBeLessThan(4);
		await expectNoSidewaysScroll();
	},
};
