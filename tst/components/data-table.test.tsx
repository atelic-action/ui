import { fireEvent, render, screen, within } from "@testing-library/react";
import { DataTable } from "../../src/components";

const columns = [
	{ label: "Search" },
	{ label: "Times shown", align: "right" as const, sortable: true, firstSort: "desc" as const },
	{ label: "Clicks", align: "right" as const, sortable: true, firstSort: "desc" as const },
	{ label: "Result" },
];
const rows = [
	{ cells: ["velux skylight", "19,986", "9", { display: <em>Fine</em>, sort: 2 }] },
	{ cells: ["skylight repair", "7,706", "2", { display: <em>Poor</em>, sort: 1 }] },
	{ cells: ["velux skylight sizes", "10,694", "26", { display: <em>Good</em>, sort: 3 }] },
];
const names = () =>
	screen
		.getAllByRole("row")
		.slice(1)
		.map((row) => within(row).getByRole("rowheader").textContent);

describe("DataTable", () => {
	it("renders the rows as listed when no sort is given", () => {
		render(<DataTable columns={columns} rows={rows} />);
		expect(names()).toEqual(["velux skylight", "skylight repair", "velux skylight sizes"]);
	});

	it("opens in the default sort, reading formatted numbers as numbers", () => {
		render(
			<DataTable columns={columns} rows={rows} defaultSort={{ column: 1, direction: "desc" }} />,
		);
		expect(names()).toEqual(["velux skylight", "velux skylight sizes", "skylight repair"]);
		expect(screen.getByRole("columnheader", { name: /Times shown/ })).toHaveAttribute(
			"aria-sort",
			"descending",
		);
	});

	it("sorts by a heading on click, first in the column's own direction, then the other way", () => {
		render(<DataTable columns={columns} rows={rows} />);
		const clicks = screen.getByRole("button", { name: /Clicks/ });
		fireEvent.click(clicks);
		expect(names()).toEqual(["velux skylight sizes", "velux skylight", "skylight repair"]);
		fireEvent.click(clicks);
		expect(names()).toEqual(["skylight repair", "velux skylight", "velux skylight sizes"]);
		expect(screen.getByRole("columnheader", { name: /Clicks/ })).toHaveAttribute(
			"aria-sort",
			"ascending",
		);
	});

	it("leaves a column that is not sortable as plain text", () => {
		render(<DataTable columns={columns} rows={rows} />);
		expect(screen.queryByRole("button", { name: /Search/ })).not.toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Search" })).not.toHaveAttribute("aria-sort");
	});

	it("sorts from the dropdown, the phone's control", () => {
		render(<DataTable columns={columns} rows={rows} sortLabel="Sort by" />);
		fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "1:asc" } });
		expect(names()).toEqual(["skylight repair", "velux skylight sizes", "velux skylight"]);
	});

	it("carries each cell's column label for the stacked phone row, and a row's tone", () => {
		render(<DataTable columns={columns} rows={[{ cells: ["a", "1", "2", "x"], tone: "bad" }]} />);
		const row = screen.getAllByRole("row")[1] as HTMLElement;
		expect(row).toHaveAttribute("data-tone", "bad");
		expect(within(row).getByText("1")).toHaveAttribute("data-label", "Times shown");
	});

	it("shows no sort control when no column sorts", () => {
		render(<DataTable columns={[{ label: "A" }, { label: "B" }]} rows={[{ cells: ["a", "b"] }]} />);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});
});
