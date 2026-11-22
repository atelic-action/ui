import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { CalloutPanel } from "../../src/sections";
import { knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/**
 * Short callouts on the primary field, set inside a section after its copy.
 * Its white words fail contrast on this theme's primary (FINDINGS.md).
 */
const meta = {
	title: "Sections/CalloutPanel",
	component: CalloutPanel,
	tags: ["known-issue"],
	parameters: { ...knownIssues("on-primary-contrast") },
	args: {
		items: [
			{ title: "Since 2014", subtitle: "One shop on Alder Street" },
			{ title: "Best morning bun in the county", subtitle: "Fairhaven Gazette readers" },
			{ title: "11 cafes", subtitle: "Carry the morning bake" },
			{ title: "Two days", subtitle: "Notice for a cake to order" },
		],
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>Why the line is long</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof CalloutPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each callout's title and subtitle, by position in the row. */
function callouts(
	canvas: ReturnType<typeof within>,
	items: { title: unknown; subtitle?: unknown }[],
) {
	return within(canvas.getByRole("list"))
		.getAllByRole("listitem")
		.map((item, i) => {
			const title = within(item).getByText(String(items[i]?.title));
			const words = items[i]?.subtitle;
			const subtitle = words === undefined ? title : within(item).getByText(String(words));
			return { item: item.getBoundingClientRect(), title, subtitle };
		});
}

const top = (element: Element) => Math.round(element.getBoundingClientRect().top);

/** How many lines an element's words run to. */
function lines(element: Element) {
	const range = document.createRange();
	range.selectNodeContents(element);
	return new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))).size;
}

/** Four across, and the titles and subtitles each on one line across the row. */
export const Desktop: Story = {
	play: async ({ canvas, args }) => {
		const row = callouts(canvas, args.items);
		await expect(new Set(row.map(({ item }) => Math.round(item.top))).size).toBe(1);
		await expect(new Set(row.map(({ title }) => top(title))).size).toBe(1);
		// The two line title does not push its own subtitle out of step.
		await expect(new Set(row.map(({ subtitle }) => top(subtitle))).size).toBe(1);
		// And one title really does run to two lines.
		await expect(Math.max(...row.map(({ title }) => lines(title)))).toBeGreaterThan(1);
	},
};

/** Two by two on a phone, each row keeping its titles and subtitles in step. */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas, args }) => {
		const [a, b, c, d] = callouts(canvas, args.items);
		await expect(Math.round(a.item.top)).toBe(Math.round(b.item.top));
		await expect(Math.round(c.item.top)).toBe(Math.round(d.item.top));
		await expect(c.item.top).toBeGreaterThan(a.item.bottom - 1);
		await expect(Math.round(a.item.left)).toBe(Math.round(c.item.left));
		for (const [left, right] of [
			[a, b],
			[c, d],
		]) {
			await expect(top(left.title)).toBe(top(right.title));
			await expect(top(left.subtitle)).toBe(top(right.subtitle));
		}
	},
};

/** The tablet sits below the four across step, so it keeps the two by two. */
export const Tablet: Story = {
	globals: pin("tablet"),
	play: async ({ canvas, args }) => {
		const [a, b, c] = callouts(canvas, args.items);
		await expect(Math.round(a.item.top)).toBe(Math.round(b.item.top));
		await expect(c.item.top).toBeGreaterThan(a.item.top);
	},
};

/** A callout with no subtitle keeps its place in the row. */
export const MissingSubtitle: Story = {
	args: {
		items: [
			{ title: "Since 2014", subtitle: "One shop on Alder Street" },
			{ title: "11 cafes" },
			{ title: "Two days", subtitle: "Notice for a cake to order" },
			{ title: "Open six days", subtitle: "Closed Mondays" },
		],
	},
	play: async ({ canvas, args }) => {
		const row = callouts(canvas, args.items);
		await expect(new Set(row.map(({ title }) => top(title))).size).toBe(1);
	},
};

/** The longest realistic titles, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		items: [
			{
				title: "Best morning bun in the county",
				subtitle: "Fairhaven Gazette readers, three years running",
			},
			{
				title: "Eleven cafes and two grocers",
				subtitle: "Carry the morning bake before they open",
			},
			{ title: "Two days", subtitle: "Notice for a cake to order" },
			{ title: "Since 2014", subtitle: "One shop on Alder Street" },
		],
	},
	play: async () => {
		await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	},
};
