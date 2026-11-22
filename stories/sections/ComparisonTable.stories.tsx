import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ComparisonTable } from "../../src/sections";
import { comparisonRows, unbroken } from "../fixtures/sections";
import { expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * A graded before and after, one row per thing graded, each side a grade
 * beside its points. A changed grade takes the primary color.
 */
const meta = {
	title: "Sections/ComparisonTable",
	component: ComparisonTable,
	args: {
		rows: comparisonRows,
		footnote: "A is the best grade, D the worst. Measured on a phone in October.",
	},
	decorators: [
		(Story) => (
			<section className="section">
				<div className="wrap">
					<h2>What changed</h2>
					<Story />
				</div>
			</section>
		),
	],
	globals: pin("desktop"),
} satisfies Meta<typeof ComparisonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = (canvas: ReturnType<typeof within>, name: string) =>
	within(canvas.getByRole("row", { name: new RegExp(`^${name}`) }));

/** The column heads, a header cell per row, and an even before and after. */
export const Default: Story = {
	play: async ({ canvas, step }) => {
		await step("the heads default to a before and after", async () => {
			const heads = canvas.getAllByRole("columnheader").map((head) => head.textContent);
			await expect(heads).toEqual(["Area", "Before", "After"]);
		});
		await step("each row is named by its label, and a label can link", async () => {
			await expect(canvas.getByRole("rowheader", { name: "Phone speed" })).toBeVisible();
			await expect(canvas.getByRole("link", { name: "Phone speed" })).toHaveAttribute(
				"href",
				"/glossary/speed",
			);
		});
		await step("the halves are equal whatever they hold", async () => {
			const [, before, after] = canvas.getAllByRole("columnheader");
			await expect(
				Math.abs(before.getBoundingClientRect().width - after.getBoundingClientRect().width),
			).toBeLessThan(1);
		});
		await step("a moved grade reads differently from one that held", async () => {
			const moved = row(canvas, "Phone speed").getAllByText(/^[A-D]$/);
			const held = row(canvas, "Hours").getAllByText("B");
			await expect(getComputedStyle(moved[1]).color).not.toBe(getComputedStyle(moved[0]).color);
			await expect(getComputedStyle(held[1]).color).toBe(getComputedStyle(held[0]).color);
		});
		await step("one point reads as prose, several as a list", async () => {
			await expect(row(canvas, "Phone speed").getAllByRole("listitem")).toHaveLength(2);
			await expect(row(canvas, "Ordering ahead").queryAllByRole("listitem")).toHaveLength(0);
		});
		await step("an ungraded side says so in words, not a letter", async () => {
			await expect(row(canvas, "Reviews").getByText("not measured")).toBeVisible();
		});
		await expect(canvas.getByText(/A is the best grade/)).toBeVisible();
	},
};

/** The heads renamed for a comparison that is not a before and after. */
export const CustomColumns: Story = {
	args: {
		columns: { stage: "What", before: "The old site", after: "The rebuild" },
		footnote: undefined,
	},
	play: async ({ canvas }) => {
		const heads = canvas.getAllByRole("columnheader").map((head) => head.textContent);
		await expect(heads).toEqual(["What", "The old site", "The rebuild"]);
	},
};

/** No rows: only the heads. */
export const Empty: Story = {
	args: { rows: [], footnote: undefined },
	play: async ({ canvas }) => {
		await expect(canvas.getAllByRole("row")).toHaveLength(1);
	},
};

/**
 * On a phone the table keeps its side by side shape and scrolls sideways
 * inside its own box, never the page.
 */
export const Phone: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		const table = canvas.getByRole("table");
		const [, before, after] = canvas.getAllByRole("columnheader");
		await expect(Math.round(before.getBoundingClientRect().top)).toBe(
			Math.round(after.getBoundingClientRect().top),
		);
		const scroller = table.parentElement as HTMLElement;
		await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
		await expectNoSidewaysScroll();
	},
};

/**
 * On a phone the box scrolls, so it is a named region a keyboard reaches by
 * Tab and scrolls by its arrows, even when no row holds a link to land on
 * (axe's `scrollable-region-focusable`). On a desktop, where nothing
 * scrolls, it takes no tab stop at all.
 */
export const PhoneKeyboard: Story = {
	globals: pin("phone"),
	args: {
		rows: comparisonRows.map(({ stageHref: _, ...row }) => row),
		ariaLabel: "The bakery's site, before and after",
	},
	play: async ({ canvas, userEvent, step }) => {
		const table = canvas.getByRole("table");
		await step("the box scrolls, and it is a region named for what it compares", async () => {
			const box = table.parentElement as HTMLElement;
			await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
			await expect(
				canvas.getByRole("region", { name: "The bakery's site, before and after" }),
			).toBe(box);
		});
		await step("Tab reaches it, though no row holds a link", async () => {
			await expect(canvas.queryAllByRole("link")).toHaveLength(0);
			// A synthetic arrow key never scrolls a region (stories/README.md),
			// so focus is the proof.
			await userEvent.tab();
			await expect(table.parentElement).toHaveFocus();
		});
	},
};

/** Where the table fits, the box is plain: no region, no tab stop. */
export const DesktopTakesNoStop: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("region")).toBeNull();
		await expect(canvas.getByRole("table").parentElement).not.toHaveAttribute("tabindex");
	},
};

/** The region's default name, on a phone, when a page names none. */
export const PhoneDefaultName: Story = {
	globals: pin("phone"),
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("region", { name: "Comparison" })).toHaveAttribute(
			"tabindex",
			"0",
		);
	},
};

/** Many rows, the longest realistic points, and an unbroken word, on a phone. */
export const LongestContent: Story = {
	globals: pin("phone"),
	args: {
		rows: [
			...comparisonRows,
			{
				id: "menu",
				stage: "The menu, by day of the week and season",
				before: {
					grade: "D",
					points: ["A scanned picture of last year's printed menu, unreadable on a phone"],
				},
				after: { grade: "A", points: ["Text, by day", unbroken, "Updated every Monday"] },
			},
		],
	},
	play: async () => {
		await expectNoSidewaysScroll();
	},
};
