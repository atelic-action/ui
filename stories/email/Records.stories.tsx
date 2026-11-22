import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card, Records, type RecordsColumn, Row } from "../../src/email";
import { pin } from "../support/viewports";
import { fitsTheColumn, inColumn } from "./column";

const columns: RecordsColumn[] = [
	{ label: "Cafe" },
	{ label: "Trays", right: true },
	{ label: "Drop", right: true },
	{ label: "Change" },
];

const rows = [
	[
		{ value: "Larkspur" },
		{ value: "4", mono: true },
		{ value: "06:15", mono: true },
		{ value: "+1 Saturday", hot: true },
	],
	[
		{ value: "Wicket Lane" },
		{ value: "1", mono: true },
		{ value: "07:30", mono: true },
		{ value: "" },
	],
	[
		{ value: "Fairhaven" },
		{ value: "2", mono: true },
		{ value: "07:00", mono: true },
		{ value: "trial", muted: true },
	],
];

/** The column headers' words, in order, read the way a screen reader reads them. */
function headers(canvas: Canvas) {
	return canvas.getAllByRole("columnheader").map((cell: HTMLElement) => cell.textContent);
}

/** A header cell's share of its table's width. */
function share(canvas: Canvas, label: string) {
	const table = canvas.getByRole("table").getBoundingClientRect();
	return (
		canvas.getByRole("columnheader", { name: label }).getBoundingClientRect().width / table.width
	);
}

const fixedWidths = [200, 60, 60, 120];

/**
 * A table of numbers with a header row; a column every row leaves empty is
 * dropped unless it says keep. A data table: its header cells name the
 * column a reader is in, and a hot cell wears the accent's ink.
 */
const meta = {
	title: "Email/Records",
	component: Records,
	decorators: [
		(Story) => (
			<Card>
				<Row last>
					<Story />
				</Row>
			</Card>
		),
		// Outermost: the column holds the card the piece sits in.
		inColumn,
	],
	args: { columns, rows },
	globals: pin("desktop"),
} satisfies Meta<typeof Records>;

export default meta;
type Story = StoryObj<typeof meta>;
type Canvas = ReturnType<typeof within>;

/** Four columns, the numbers right aligned. */
export const Default: Story = {
	play: async ({ canvas, canvasElement }) => {
		await expect(headers(canvas)).toEqual(["Cafe", "Trays", "Drop", "Change"]);
		const trays = canvas.getByText("Trays").getBoundingClientRect();
		const four = canvas.getByText("4").getBoundingClientRect();
		await expect(Math.abs(four.right - trays.right)).toBeLessThan(2);
		await fitsTheColumn(canvasElement);
	},
};

/** A column every row leaves empty drops away. */
export const DropsAnEmptyColumn: Story = {
	args: { rows: rows.map((row) => [row[0], row[1], row[2], { value: "" }]) },
	play: async ({ canvas }) => {
		await expect(headers(canvas)).toEqual(["Cafe", "Trays", "Drop"]);
	},
};

/** Unless it says keep. */
export const KeepsAnEmptyColumn: Story = {
	args: {
		columns: columns.map((column) =>
			column.label === "Change" ? { ...column, keep: true } : column,
		),
		rows: rows.map((row) => [row[0], row[1], row[2], { value: "" }]),
	},
	play: async ({ canvas }) => {
		await expect(headers(canvas)).toEqual(["Cafe", "Trays", "Drop", "Change"]);
	},
};

/**
 * Fixed widths, so sibling tables share a grid: each column takes the share
 * of the table its pixels ask for, whatever the table's width.
 */
export const FixedWidths: Story = {
	args: { columns: columns.map((column, i) => ({ ...column, width: fixedWidths[i] })) },
	play: async ({ canvas }) => {
		const total = fixedWidths.reduce((sum, width) => sum + width, 0);
		for (const [i, label] of ["Cafe", "Trays", "Drop", "Change"].entries()) {
			await expect(Math.abs(share(canvas, label) - fixedWidths[i] / total)).toBeLessThan(0.01);
		}
	},
};

/**
 * One fixed column beside free ones keeps its share of the 630 pixel desktop
 * table, and the free columns share the rest.
 */
export const OneFixedColumn: Story = {
	args: {
		columns: columns.map((column) =>
			column.label === "Trays" ? { ...column, width: 63 } : column,
		),
	},
	play: async ({ canvas }) => {
		await expect(Math.abs(share(canvas, "Trays") - 63 / 630)).toBeLessThan(0.01);
	},
};

/** A cell may carry markup: a link. */
export const MarkupCell: Story = {
	args: {
		rows: [
			[
				{ html: <a href="https://example.test/accounts/larkspur">Larkspur</a> },
				{ value: "4" },
				{ value: "06:15" },
				{ value: "" },
			],
		],
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("link", { name: "Larkspur" })).toBeVisible();
	},
};

/** On a phone, four columns of short values fit the card. */
export const DefaultPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/**
 * On a phone, the widths a desktop column asked for narrow with the card in
 * the same proportions, so the email stays on the screen.
 */
export const FixedWidthsPhone: Story = {
	args: { columns: columns.map((column, i) => ({ ...column, width: fixedWidths[i] })) },
	globals: pin("phone"),
	play: async ({ canvas, canvasElement }) => {
		await fitsTheColumn(canvasElement);
		const total = fixedWidths.reduce((sum, width) => sum + width, 0);
		await expect(Math.abs(share(canvas, "Cafe") - fixedWidths[0] / total)).toBeLessThan(0.01);
	},
};

/**
 * A reader moving through the table hears which column a number is in: the
 * header cells are column headers, and each value sits in its column's cell.
 */
export const ReadByColumn: Story = {
	play: async ({ canvas }) => {
		const table = canvas.getByRole("table");
		await expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
		const trays = canvas.getByRole("columnheader", { name: "Trays" });
		await expect(trays).toHaveAttribute("scope", "col");
		const larkspur = within(table).getByRole("row", { name: /Larkspur/ });
		const cells = within(larkspur).getAllByRole("cell");
		const column = within(trays.closest("tr") as HTMLElement)
			.getAllByRole("columnheader")
			.indexOf(trays);
		await expect(cells[column]).toHaveTextContent("4");
	},
};
