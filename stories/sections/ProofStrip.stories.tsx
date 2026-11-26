import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { StarRow } from "../../src/primitives";
import { ProofStrip } from "../../src/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * Backs a page's opening claim with a row of short facts, right under the
 * hero. One row of short proof facts under a hero, a figure over its label
 * each.
 */
const meta = {
	title: "Sections/ProofStrip",
	component: ProofStrip,
	args: {
		ariaLabel: "Why the line is long",
		items: [
			{
				value: (
					<>
						4.9 <StarRow rating={5} size={15} />
					</>
				),
				label: "212 reviews",
			},
			{ value: "Since 2014", label: "On Alder Street" },
			{ value: "1,200 loaves", label: "Baked every week" },
			{ value: "11 cafes", label: "Carry the morning bake" },
			{ value: "Two days", label: "Notice for a cake" },
		],
	},
	globals: pin("desktop"),
} satisfies Meta<typeof ProofStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

const facts = (canvas: ReturnType<typeof within>) =>
	within(canvas.getByRole("list", { name: "Why the line is long" })).getAllByRole("listitem");

/** As many across as fit: all five on one row at a desktop. */
export const Default: Story = {
	play: async ({ canvas }) => {
		const tops = new Set(facts(canvas).map((fact) => Math.round(fact.getBoundingClientRect().top)));
		await expect(tops.size).toBe(1);
	},
};

/** A phone wraps the facts to a clean grid, never sideways. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const items = facts(canvas);
		const tops = new Set(items.map((fact) => Math.round(fact.getBoundingClientRect().top)));
		await expect(tops.size).toBeGreaterThan(1);
		await expect(Math.round(items[0].getBoundingClientRect().top)).toBe(
			Math.round(items[1].getBoundingClientRect().top),
		);
		await expectNoSidewaysScroll();
	},
};

export const AltSurface: Story = { args: { surface: "alt" } };

/** Three facts and no name for the list. */
export const Short: Story = {
	args: {
		ariaLabel: undefined,
		items: [
			{ value: "Since 2014", label: "On Alder Street" },
			{ value: "11 cafes", label: "Carry the morning bake" },
			{ value: "Two days", label: "Notice for a cake" },
		],
	},
	play: async ({ canvas }) => {
		await expect(within(canvas.getByRole("list")).getAllByRole("listitem")).toHaveLength(3);
	},
};

export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: [
			{ value: "Since 2014", label: "On Alder Street, by the old mill and the ferry landing" },
			{ value: "1,200 loaves", label: "Baked every week in the back of the shop" },
			{ value: "Eleven cafes", label: "Carry the morning bake before they open" },
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
