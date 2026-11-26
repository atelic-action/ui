import type { Meta, StoryObj } from "@storybook/react-vite";
import { Clock, MapPin, Phone, Truck } from "lucide-react";
import { expect } from "storybook/test";
import { IconList } from "../../src/components";
import { longURL } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

const items = [
	{ body: "Open seven to three, Tuesday to Sunday" },
	{ body: "418 Alder Street, Fairhaven" },
	{ body: "Delivery to cafes before six" },
];

/**
 * Lists short items marked by icons instead of bullets, when the icon says
 * something a bullet would not; see `TickList` for plain checks. A list whose
 * bullets are icons, one for the list or one per item, each in a tone. The
 * bullets are decoration: a screen reader hears the items alone.
 */
const meta = {
	title: "Components/IconList",
	component: IconList,
	decorators: [inWrap],
	args: { items },
} satisfies Meta<typeof IconList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A dot before each item, in the text's color; the bullets are hidden. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const rows = canvas.getAllByRole("listitem");
		await expect(rows).toHaveLength(3);
		await expect(rows[0]).toHaveTextContent("Open seven to three, Tuesday to Sunday");
		await expect(canvas.queryAllByRole("img")).toHaveLength(0);
	},
};

/** One icon for the whole list, in a tone. */
export const ListIconAndTone: Story = {
	args: { icon: <Clock size={16} />, tone: "good" },
};

/** Each item its own icon and tone; the list's fill in where an item sets none. */
export const PerItem: Story = {
	args: {
		tone: "muted",
		items: [
			{ body: "Open seven to three", icon: <Clock size={16} />, tone: "good" },
			{ body: "418 Alder Street", icon: <MapPin size={16} /> },
			{ body: "Call (555) 555-0142", icon: <Phone size={16} />, tone: "info" },
			{ body: "No delivery on Mondays", icon: <Truck size={16} />, tone: "bad" },
		],
	},
};

/** Every tone the bullet reads in. */
export const Tones: Story = {
	args: {
		items: (["good", "warn", "bad", "info", "muted"] as const).map((tone) => ({
			body: `A ${tone} item`,
			tone,
		})),
	},
};

export const Empty: Story = {
	args: { items: [] },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("listitem")).toHaveLength(0);
	},
};

/**
 * Long items and a bare address, on a phone: the list wraps inside the
 * screen, the address breaking where it must.
 */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		icon: <MapPin size={16} />,
		items: [
			...items,
			{ body: `The whole list is at ${longURL}` },
			{
				body: "Standing orders change by a message the afternoon before, and a cake needs two days' notice and a deposit at the counter.",
			},
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
