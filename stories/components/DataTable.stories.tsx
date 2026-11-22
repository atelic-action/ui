import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { DataTable, type DataTableColumn, type DataTableRow } from "../../src/components";
import { longURL, queryColumns, queryRows } from "../fixtures/primitives";
import { expectNoSidewaysScroll, inWrap } from "../primitives/support";
import { knownBug, knownIssues } from "../support/known-issues";
import { pin } from "../support/viewports";

/** The row names down the first column, top to bottom, as a reader sees them. */
function order(canvasElement: HTMLElement) {
	return Array.from(canvasElement.querySelectorAll("tbody tr")).map(
		(row) => within(row as HTMLElement).getByRole("rowheader").textContent,
	);
}

/**
 * A table whose first column names each row, sortable by a heading on a
 * wide screen and by a dropdown on a phone, where each row stacks and every
 * fact wears its column's label.
 */
const meta = {
	title: "Components/DataTable",
	component: DataTable,
	decorators: [inWrap],
	args: { columns: queryColumns, rows: queryRows },
	globals: pin("desktop"),
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The sorted column's heading fails contrast (stories/findings/primitives.md). */
const sortedContrast = {
	parameters: { ...knownIssues("data-table-active-sort-contrast") },
} satisfies Story;

/** As listed: the sortable headings say they are unsorted, and each row is named by its first cell. */
export const AsListed: Story = {
	play: async ({ canvas, canvasElement }) => {
		const place = canvas.getByRole("columnheader", { name: "Map place" });
		await expect(place).toHaveAttribute("aria-sort", "none");
		await expect(canvas.getByRole("columnheader", { name: "Search" })).not.toHaveAttribute(
			"aria-sort",
		);
		await expect(order(canvasElement)).toEqual([
			"sourdough near me",
			"bakery open sunday",
			"birthday cake fairhaven",
			"rye bread",
			"croissant",
		]);
	},
};

/**
 * A click on a heading sorts by it in the column's first direction, a second
 * click reverses it, and `aria-sort` follows. An empty cell sorts last both
 * ways, and a value cell sorts by its value, not its words.
 */
export const SortsByHeading: Story = {
	tags: ["known-issue"],
	...sortedContrast,
	play: async ({ canvas, canvasElement, userEvent, step }) => {
		const place = canvas.getByRole("columnheader", { name: "Map place" });
		const searches = canvas.getByRole("columnheader", { name: "Monthly searches" });
		await step("the first click sorts low to high, the column's first direction", async () => {
			await userEvent.click(within(place).getByRole("button", { name: "Map place" }));
			await expect(place).toHaveAttribute("aria-sort", "ascending");
			await expect(order(canvasElement)).toEqual([
				"bakery open sunday",
				"croissant",
				"sourdough near me",
				"birthday cake fairhaven",
				"rye bread",
			]);
		});
		await step("a second click reverses it", async () => {
			await userEvent.click(within(place).getByRole("button", { name: "Map place" }));
			await expect(place).toHaveAttribute("aria-sort", "descending");
			await expect(order(canvasElement)[0]).toBe("rye bread");
		});
		await step("a formatted number sorts as a number, largest first", async () => {
			await userEvent.click(within(searches).getByRole("button", { name: "Monthly searches" }));
			await expect(searches).toHaveAttribute("aria-sort", "descending");
			await expect(place).toHaveAttribute("aria-sort", "none");
			await expect(order(canvasElement)).toEqual([
				"croissant",
				"sourdough near me",
				"bakery open sunday",
				"birthday cake fairhaven",
				"rye bread",
			]);
		});
	},
};

/** The keyboard sorts too: the heading's button takes Enter. */
export const SortsByKeyboard: Story = {
	tags: ["known-issue"],
	...sortedContrast,
	play: async ({ canvas, canvasElement, userEvent }) => {
		within(canvas.getByRole("columnheader", { name: "Monthly searches" }))
			.getByRole("button")
			.focus();
		await userEvent.keyboard("{Enter}");
		await expect(order(canvasElement)[0]).toBe("croissant");
	},
};

/** Opens sorted by `defaultSort`. */
export const DefaultSort: Story = {
	tags: ["known-issue"],
	...sortedContrast,
	args: { defaultSort: { column: 2, direction: "asc" } },
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole("columnheader", { name: "Monthly searches" })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
		await expect(order(canvasElement)[0]).toBe("rye bread");
	},
};

/**
 * An empty cell draws a short rule and is heard as the column's empty
 * label; a cell left out of a short row is empty too.
 */
export const EmptyCells: Story = {
	play: async ({ canvasElement }) => {
		const rows = Array.from(canvasElement.querySelectorAll("tbody tr")) as HTMLElement[];
		const cake = rows.find((row) => row.textContent?.includes("birthday cake")) as HTMLElement;
		const croissant = rows.find((row) => row.textContent?.includes("croissant")) as HTMLElement;
		await expect(within(cake).getAllByRole("cell").at(-1)).toHaveTextContent("Not measured");
		await expect(within(croissant).getAllByRole("cell")).toHaveLength(3);
		await expect(within(croissant).getAllByRole("cell").at(-1)).toHaveTextContent("Not measured");
	},
};

/**
 * A column's hint sits in its heading and the heading is still named by its
 * label; the hint opens on a click.
 */
export const HeadingHint: Story = {
	play: async ({ canvas, userEvent }) => {
		const hint = canvas.getByRole("button", { name: "About Map place" });
		await expect(canvas.getByRole("columnheader", { name: "Map place" })).toContainElement(hint);
		await userEvent.click(hint);
		await expect(hint).toHaveAttribute("aria-expanded", "true");
		await expect(canvas.getByRole("tooltip")).toBeVisible();
	},
};

/** Unstriped, with a column that hugs its content. */
export const Plain: Story = {
	args: {
		striped: false,
		columns: [{ label: "Search" }, { label: "Place", fit: true, align: "center" }],
		rows: queryRows.map((row) => ({ ...row, cells: row.cells.slice(0, 2) })),
	},
	play: async ({ canvas }) => {
		const table = canvas.getByRole("table");
		const fit = canvas.getByRole("columnheader", { name: "Place" });
		await expect(fit.getBoundingClientRect().width).toBeLessThan(
			table.getBoundingClientRect().width / 3,
		);
	},
};

/** No sortable column: no dropdown and no heading buttons. */
export const NotSortable: Story = {
	args: { columns: queryColumns.map(({ label, align }) => ({ label, align })) },
	play: async ({ canvas }) => {
		await expect(canvas.queryAllByRole("button")).toHaveLength(0);
		await expect(canvas.queryByRole("combobox")).toBeNull();
	},
};

/** No rows: the headings over an empty body. */
export const Empty: Story = {
	args: { rows: [] },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll("tbody tr")).toHaveLength(0);
	},
};

/**
 * On a phone each row stacks, the headings are out of sight, and a named
 * dropdown sorts. Nothing scrolls sideways.
 */
export const PhoneSortsByDropdown: Story = {
	globals: pin("phone"),
	play: async ({ canvas, canvasElement, userEvent }) => {
		const sort = canvas.getByRole("combobox", { name: "Sort by" });
		await expect(sort).toHaveDisplayValue("As listed");
		await userEvent.selectOptions(sort, "Monthly searches, high to low");
		await expect(order(canvasElement)[0]).toBe("croissant");
		await expect(sort).toHaveDisplayValue("Monthly searches, high to low");
		await expect(canvas.queryByRole("option", { name: "As listed" })).toBeNull();
		const [first, second] = canvas.getAllByRole("rowheader") as HTMLElement[];
		await expect(second?.getBoundingClientRect().top).toBeGreaterThan(
			first?.getBoundingClientRect().bottom ?? 0,
		);
		await expectNoSidewaysScroll();
	},
};

/** The phone's sort control takes the page's own label. */
export const PhoneSortLabel: Story = {
	globals: pin("phone"),
	args: { sortLabel: "Order the searches by" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("combobox", { name: "Order the searches by" })).toBeVisible();
	},
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const wideColumns: DataTableColumn[] = [
	{ label: "Search" },
	...months.map((month) => ({ label: `${month} place`, align: "right" as const, sortable: true })),
];

const wideRows: DataTableRow[] = queryRows.map((row, r) => ({
	cells: [row.cells[0], ...months.map((_, m) => ((r + m) % 9) + 1)],
}));

/**
 * The widest table a read carries, on a tablet: thirteen columns. It should
 * scroll inside its own box with the page still; the table has no box of its
 * own to scroll, so the page scrolls sideways (stories/findings/primitives.md,
 * `data-table-no-scroll-box`).
 */
export const WidestOnTablet: Story = {
	tags: ["known-issue"],
	globals: pin("tablet"),
	args: { columns: wideColumns, rows: wideRows },
	play: async ({ canvas }) => {
		const table = canvas.getByRole("table");
		await knownBug("data-table-no-scroll-box", async () => {
			await expectNoSidewaysScroll();
			const box = table.parentElement as HTMLElement;
			await expect(box.scrollWidth).toBeGreaterThan(box.clientWidth);
		});
	},
};

/**
 * The longest cells, a bare address among them, on a phone. The stacked rows
 * should wrap; the address runs past the screen (stories/findings/primitives.md,
 * `long-word-overflow`).
 */
export const LongestOnPhone: Story = {
	tags: ["known-issue"],
	globals: pin("phone"),
	args: {
		rows: [
			...queryRows,
			{ cells: [longURL, 4, "12,400", "+3"] },
			...Array.from({ length: 10 }, (_, i) => ({
				cells: [`sourdough delivery fairhaven ${i + 1}`, i + 1, `${(i + 1) * 110}`, "0"],
			})),
		],
	},
	play: async () => {
		await knownBug("long-word-overflow", expectNoSidewaysScroll);
	},
};
