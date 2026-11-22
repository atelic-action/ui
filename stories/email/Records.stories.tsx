import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Card, Records, type RecordsColumn, Row } from "../../src/email";
import { knownBug } from "../support/known-issues";
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

/** The header cells' words, in order. */
function headers(canvasElement: HTMLElement) {
	const table = canvasElement.querySelector("[data-story-column] td td table") as HTMLElement;
	return Array.from(table.querySelector("tr")?.children ?? []).map((cell) => cell.textContent);
}

/**
 * A table of numbers with a header row; a column every row leaves empty is
 * dropped unless it says keep. A hot cell wears the accent, which fails
 * contrast as words, so the stories with one are marked. Its header row is
 * plain cells, not `th`, so a screen reader cannot tie a number to its
 * column.
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

/** Four columns, the numbers right aligned. */
export const Default: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	play: async ({ canvas, canvasElement }) => {
		await expect(headers(canvasElement)).toEqual(["Cafe", "Trays", "Drop", "Change"]);
		const trays = canvas.getByText("Trays").getBoundingClientRect();
		const four = canvas.getByText("4").getBoundingClientRect();
		await expect(Math.abs(four.right - trays.right)).toBeLessThan(2);
		await fitsTheColumn(canvasElement);
	},
};

/** A column every row leaves empty drops away. */
export const DropsAnEmptyColumn: Story = {
	args: { rows: rows.map((row) => [row[0], row[1], row[2], { value: "" }]) },
	play: async ({ canvasElement }) => {
		await expect(headers(canvasElement)).toEqual(["Cafe", "Trays", "Drop"]);
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
	play: async ({ canvasElement }) => {
		await expect(headers(canvasElement)).toEqual(["Cafe", "Trays", "Drop", "Change"]);
	},
};

/** Fixed widths, so sibling tables share a grid. */
export const FixedWidths: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	args: { columns: columns.map((column, i) => ({ ...column, width: [200, 60, 60, 120][i] })) },
	play: async ({ canvas }) => {
		// The fixed layout shares spare room out in proportion to the widths given.
		const cafe = canvas.getByText("Cafe").getBoundingClientRect().width;
		const trays = canvas.getByText("Trays").getBoundingClientRect().width;
		await expect(Math.round((cafe / trays) * 10) / 10).toBeCloseTo(200 / 60, 0);
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
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await fitsTheColumn(canvasElement);
	},
};

/**
 * On a phone, fixed widths that add up wider than the card hold it open:
 * the email runs off a phone's screen. Any caller that fixes widths for a
 * desktop column breaks the phone.
 */
export const FixedWidthsPhone: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	args: { columns: columns.map((column, i) => ({ ...column, width: [200, 60, 60, 120][i] })) },
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await knownBug("records-fixed-widths-overflow", async () => {
			await fitsTheColumn(canvasElement);
		});
	},
};

/** The header should name each column for a screen reader; it is plain cells. */
export const HeaderCellsAreHeaders: Story = {
	tags: ["known-issue"],
	parameters: { a11y: { test: "todo" } },
	play: async ({ canvas }) => {
		await knownBug("records-header-not-th", async () => {
			await expect(canvas.getByRole("columnheader", { name: "Trays" })).toBeInTheDocument();
		});
	},
};
