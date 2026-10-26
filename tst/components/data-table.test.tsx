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

	it("marks a column that hugs its content", () => {
		const { container } = render(
			<DataTable
				columns={[{ label: "Search" }, { label: "", fit: true }]}
				rows={[{ cells: ["a", "b"] }]}
			/>,
		);
		expect(container.querySelectorAll("[data-fit]")).toHaveLength(2);
		expect(container.querySelector("th[scope=row]")).not.toHaveAttribute("data-fit");
	});

	it("stripes every other row by default, and not when told", () => {
		const { container, rerender } = render(<DataTable columns={columns} rows={rows} />);
		expect(container.querySelector(".data-table")).toHaveClass("is-striped");
		rerender(<DataTable columns={columns} rows={rows} striped={false} />);
		expect(container.querySelector(".data-table")).not.toHaveClass("is-striped");
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

	it("draws an empty cell as a gray rule a screen reader hears as None", () => {
		const { container } = render(
			<DataTable
				columns={[{ label: "Market" }, { label: "Change" }]}
				rows={[{ cells: ["Denver", null] }, { cells: ["Boulder", undefined] }]}
			/>,
		);
		const rules = container.querySelectorAll("td .data-table-empty");
		expect(rules).toHaveLength(2);
		for (const rule of rules) expect(rule).toHaveAttribute("aria-hidden", "true");
		expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["None", "None"]);
	});

	it("reads a typed dash as content, not as an empty cell", () => {
		const { container } = render(
			<DataTable
				columns={[{ label: "Market" }, { label: "Change" }]}
				rows={[{ cells: ["Denver", "\u2013"] }]}
			/>,
		);
		expect(container.querySelector(".data-table-empty")).toBeNull();
		expect(screen.getByRole("cell")).toHaveTextContent("\u2013");
	});

	it("draws a cell left out of a short row as empty", () => {
		const { container } = render(
			<DataTable
				columns={[{ label: "Market" }, { label: "Change" }]}
				rows={[{ cells: ["Denver"] }]}
			/>,
		);
		expect(container.querySelector("td .data-table-empty")).not.toBeNull();
		expect(screen.getByRole("cell")).toHaveAttribute("data-label", "Change");
	});

	it("lets a column say what its empty cell means", () => {
		render(
			<DataTable
				columns={[{ label: "Market" }, { label: "Grade", emptyLabel: "Not read" }]}
				rows={[{ cells: ["Denver", null] }]}
			/>,
		);
		expect(screen.getByRole("cell")).toHaveTextContent("Not read");
	});

	it("never treats the first cell, which names the row, as empty", () => {
		const { container } = render(
			<DataTable
				columns={[{ label: "Market" }, { label: "Grade" }]}
				rows={[{ cells: [null, "B"] }]}
			/>,
		);
		expect(container.querySelector(".data-table-empty")).toBeNull();
	});

	it("sorts empty cells last in both directions", () => {
		render(
			<DataTable
				columns={[{ label: "Search" }, { label: "Clicks", sortable: true }]}
				rows={[
					{ cells: ["none first", null] },
					{ cells: ["low", "2"] },
					{ cells: ["none second", undefined] },
					{ cells: ["high", "9"] },
				]}
			/>,
		);
		const clicks = screen.getByRole("button", { name: /Clicks/ });
		fireEvent.click(clicks);
		expect(names()).toEqual(["low", "high", "none first", "none second"]);
		fireEvent.click(clicks);
		expect(names()).toEqual(["high", "low", "none first", "none second"]);
	});

	it("opens with empty cells last among value cells, and keeps them last from the dropdown", () => {
		render(
			<DataTable
				columns={[{ label: "Search" }, { label: "Rank", sortable: true }]}
				rows={[
					{ cells: ["none", null] },
					{ cells: ["first", { display: <em>1st</em>, sort: 1 }] },
					{ cells: ["third", { display: <em>3rd</em>, sort: 3 }] },
				]}
				defaultSort={{ column: 1, direction: "desc" }}
			/>,
		);
		expect(names()).toEqual(["third", "first", "none"]);
		fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "1:asc" } });
		expect(names()).toEqual(["first", "third", "none"]);
	});

	it("shows no sort control when no column sorts", () => {
		render(<DataTable columns={[{ label: "A" }, { label: "B" }]} rows={[{ cells: ["a", "b"] }]} />);
		expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
	});
});
