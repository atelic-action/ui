import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ReportCard } from "../../src/components";
import { longWord, reportGroups, reportGroupsLater, reportLegend } from "../fixtures/primitives";
import { inWrap } from "../primitives/support";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * A report card: a name, a grade, and one line per row, in labeled groups.
 * Each grade is spoken as words around its letter, so a grade is never told
 * by its color alone; a linked row is a link from edge to edge.
 */
const meta = {
	title: "Components/ReportCard",
	component: ReportCard,
	decorators: [inWrap],
	args: { title: "At a Glance", legend: reportLegend, groups: reportGroups },
	globals: pin("desktop"),
} satisfies Meta<typeof ReportCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A row's words as a screen reader hears them: everything but what is hidden from it. */
function spoken(row: Element) {
	const copy = row.cloneNode(true) as Element;
	for (const hidden of copy.querySelectorAll("[aria-hidden='true']")) hidden.remove();
	return copy.textContent ?? "";
}

/** The row holding a name. */
const rowOf = (name: HTMLElement) => name.closest("b")?.parentElement as HTMLElement;

/** Each row says its grade in words before its name; the section is named by its heading. */
export const FirstRead: Story = {
	play: async ({ canvas }) => {
		const card = canvas.getByRole("region", { name: "At a Glance" });
		await expect(within(card).getByRole("heading", { level: 2 })).toHaveTextContent("At a Glance");
		const row = rowOf(within(card).getByText("Core Web Vitals"));
		await expect(spoken(row)).toMatch(/^Grade C: Core Web Vitals/);
		await expect(canvas.getByText("Health")).toBeVisible();
		await expect(canvas.getByText("Broken")).toBeVisible();
	},
};

/**
 * A linked row is one link from edge to edge: a press anywhere on the row,
 * its line included, lands on the link.
 */
export const LinkedRows: Story = {
	play: async ({ canvas }) => {
		const link = canvas.getByRole("link", { name: "Technical SEO" });
		await expect(link).toHaveAttribute("href", "#technical-seo");
		const line = canvas.getByText(/two cake pages copy each other/).getBoundingClientRect();
		const hit = document.elementFromPoint(line.left + 4, line.top + line.height / 2);
		await expect(hit?.closest("a")).toBe(link);
		await expect(canvas.queryByRole("link", { name: "Conversion" })).toBeNull();
	},
};

/** A link inside a row's line still goes where it points. */
export const LinkInTheLine: Story = {
	args: {
		groups: [
			{
				title: "Visibility",
				rows: [
					{
						name: "GEO",
						href: "#geo",
						grade: "b",
						line: (
							<>
								Named in 9 of 12 answers; the misses ask about{" "}
								<a href="#gluten-free">gluten free</a>.
							</>
						),
					},
				],
			},
		],
	},
	play: async ({ canvas }) => {
		const inner = canvas.getByRole("link", { name: "gluten free" });
		const box = inner.getBoundingClientRect();
		const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
		await expect(hit?.closest("a")).toBe(inner);
	},
};

/**
 * A later card: the earlier grade sits faded beside the grade and is spoken
 * with the caller's word for it, and a row not yet graded says so.
 */
export const LaterRead: Story = {
	args: {
		title: undefined,
		label: "At a glance",
		legend: undefined,
		labels: { before: "June 2026" },
		groups: reportGroupsLater,
	},
	play: async ({ canvas }) => {
		const card = canvas.getByRole("region", { name: "At a glance" });
		const moved = rowOf(within(card).getByText("Technical SEO"));
		await expect(spoken(moved)).toMatch(/^June 2026: B\. Grade A: Technical SEO/);
		const unread = rowOf(within(card).getByText("Analytics"));
		await expect(spoken(unread)).toMatch(/^Not graded yet: Analytics/);
	},
};

/** The legend under the card, so nothing sits between the heading and the rows. */
export const LegendAtFoot: Story = {
	args: { legendAt: "foot" },
	play: async ({ canvas }) => {
		const legend = canvas.getAllByRole("list").at(-1) as HTMLElement;
		const firstRow = canvas.getByText("Technical SEO");
		await expect(legend.getBoundingClientRect().top).toBeGreaterThan(
			firstRow.getBoundingClientRect().bottom,
		);
	},
};

/** No title and no legend: no head at all, the card named by `label`. */
export const Bare: Story = {
	args: { title: undefined, legend: undefined, label: "The bakery's grades" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "The bakery's grades" })).toBeVisible();
		await expect(canvas.queryByRole("heading")).toBeNull();
	},
};

/** A group with no rows is left out, its label with it. */
export const EmptyGroup: Story = {
	args: { groups: [...reportGroups, { title: "Reputation", rows: [] }] },
	play: async ({ canvas }) => {
		await expect(canvas.queryByText("Reputation")).toBeNull();
	},
};

/** Every word around the letters in the caller's language. */
export const OwnWords: Story = {
	args: {
		groups: reportGroupsLater,
		labels: { grade: "Nota", before: "Antes", notGraded: "Sin nota" },
	},
	play: async ({ canvas }) => {
		await expect(spoken(rowOf(canvas.getByText("Analytics")))).toMatch(/^Sin nota:/);
		await expect(spoken(rowOf(canvas.getByText("Technical SEO")))).toMatch(/^Antes: B\. Nota A:/);
	},
};

/** On a phone with the longest names and lines, nothing scrolls sideways. */
export const LongestOnPhone: Story = {
	globals: pin("phone"),
	args: {
		groups: [
			...reportGroups,
			{
				title: "Conversion and Analytics",
				rows: [
					{
						name: "Analytics and Conversion Tracking",
						href: "#analytics",
						grade: "d",
						before: "c",
						line: `The order form's thank you page fires no event, so the ${longWord} special counted zero orders.`,
					},
				],
			},
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
