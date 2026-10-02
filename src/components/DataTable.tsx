import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { type ReactNode, useId, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export interface DataTableColumn {
	label: string;
	align?: "left" | "center" | "right";
	/**
	 * Lets a reader sort by this column. Needs every cell in it to carry a
	 * sort value, or to be a plain string or number.
	 */
	sortable?: boolean;
	/** The direction a first click sorts in; numbers usually read best largest first. */
	firstSort?: SortDirection;
}

/** A cell whose display is not what it sorts by, e.g. an icon over a number. */
export interface DataTableValueCell {
	display: ReactNode;
	sort: number | string;
}

export type DataTableCell = ReactNode | DataTableValueCell;

export interface DataTableRow {
	/** One cell per column; the first names the row. */
	cells: DataTableCell[];
	/** How the row reads, e.g. "bad"; set as data-tone for the site to color. */
	tone?: string;
}

export interface DataTableProps {
	columns: DataTableColumn[];
	rows: DataTableRow[];
	/** The sort the table opens in. */
	defaultSort?: { column: number; direction: SortDirection };
	/** The label on the phone's sort control. */
	sortLabel?: string;
	className?: string;
}

function isValueCell(cell: DataTableCell): cell is DataTableValueCell {
	return typeof cell === "object" && cell !== null && "sort" in cell && "display" in cell;
}

function sortValue(cell: DataTableCell): number | string {
	if (isValueCell(cell)) return cell.sort;
	if (typeof cell === "number") return cell;
	if (typeof cell === "string") {
		const number = Number(cell.replace(/[$,%\s]/g, ""));
		return cell.trim() !== "" && Number.isFinite(number) ? number : cell.toLowerCase();
	}
	return "";
}

function compare(a: number | string, b: number | string): number {
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b), "en", { numeric: true });
}

/**
 * A table whose first column names each row. A reader sorts it by any
 * sortable column: a click on the heading on a wide screen, a dropdown on a
 * phone, where each row stacks and every fact wears its column's label so
 * nothing scrolls sideways. It renders sorted by `defaultSort` on the server
 * and sorts in place once the page is live.
 */
export function DataTable({
	columns,
	rows,
	defaultSort,
	sortLabel = "Sort by",
	className,
}: DataTableProps) {
	const [sort, setSort] = useState(defaultSort ?? null);
	const selectId = useId();
	const anySortable = columns.some((column) => column.sortable);

	const sorted = useMemo(() => {
		// Each row keeps its place in the source, which is its key: a sort moves
		// a row's elements rather than rewriting every row in place.
		const indexed = rows.map((row, index) => ({ row, index }));
		if (!sort) return indexed;
		const direction = sort.direction === "asc" ? 1 : -1;
		return indexed.sort((a, b) => {
			const order = compare(
				sortValue(a.row.cells[sort.column]),
				sortValue(b.row.cells[sort.column]),
			);
			return order === 0 ? a.index - b.index : order * direction;
		});
	}, [rows, sort]);

	const sortBy = (column: number) => {
		setSort((current) => {
			if (current && current.column === column) {
				return { column, direction: current.direction === "asc" ? "desc" : "asc" };
			}
			return { column, direction: columns[column]?.firstSort ?? "asc" };
		});
	};

	return (
		<div className={["data-table", className].filter(Boolean).join(" ")}>
			{anySortable && (
				<div className="data-table-sort">
					<label htmlFor={selectId}>{sortLabel}</label>
					<select
						id={selectId}
						value={sort ? `${sort.column}:${sort.direction}` : ""}
						onChange={(event) => {
							const [column, direction] = event.target.value.split(":");
							if (column === undefined || column === "") return;
							setSort({ column: Number(column), direction: direction as SortDirection });
						}}
					>
						{!sort && <option value="">As listed</option>}
						{columns.flatMap((column, index) =>
							column.sortable
								? (["desc", "asc"] as const).map((direction) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: columns are fixed, and the index is the option's value
										<option key={`${index}:${direction}`} value={`${index}:${direction}`}>
											{`${column.label}, ${direction === "desc" ? "high to low" : "low to high"}`}
										</option>
									))
								: [],
						)}
					</select>
				</div>
			)}
			<table>
				<thead>
					<tr>
						{columns.map((column, index) => {
							const active = sort?.column === index;
							const Icon = !active ? ArrowUpDown : sort?.direction === "asc" ? ArrowUp : ArrowDown;
							return (
								<th
									scope="col"
									key={column.label}
									data-align={column.align ?? "left"}
									aria-sort={
										column.sortable
											? active
												? sort?.direction === "asc"
													? "ascending"
													: "descending"
												: "none"
											: undefined
									}
								>
									{column.sortable ? (
										<button
											type="button"
											onClick={() => sortBy(index)}
											data-active={active || undefined}
										>
											{column.label}
											<Icon size={12} aria-hidden="true" />
										</button>
									) : (
										column.label
									)}
								</th>
							);
						})}
					</tr>
				</thead>
				<tbody>
					{sorted.map(({ row, index }) => (
						<tr key={index} data-tone={row.tone}>
							{row.cells.map((cell, c) => {
								const align = columns[c]?.align ?? "left";
								const body = isValueCell(cell) ? cell.display : cell;
								return c === 0 ? (
									// biome-ignore lint/suspicious/noArrayIndexKey: cells sit in column order
									<th scope="row" key={c} data-align={align}>
										{body}
									</th>
								) : (
									// biome-ignore lint/suspicious/noArrayIndexKey: cells sit in column order
									<td key={c} data-align={align} data-label={columns[c]?.label}>
										{body}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
