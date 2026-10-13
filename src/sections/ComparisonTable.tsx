import type { ReactNode } from "react";

/**
 * A graded before and after: one row per graded item, each side carrying a grade and
 * the points behind it. Built for case studies, where the reader's question is
 * "what actually changed", and the answer has to survive being scanned.
 *
 * The grade sits beside its points rather than above them, and an "after"
 * grade takes the primary color only when it differs from its "before", so
 * running an eye down the last column finds every change without reading.
 *
 * Row labels, grades and copy all arrive as props: the component knows
 * nothing about clients or scoring scales.
 */

export interface ComparisonState {
	/**
	 * A grade for this side. A single character renders as a large letter;
	 * anything longer renders as a small mono note, which is how an ungraded
	 * state ("not measured") says so without being handed a letter it did not
	 * earn.
	 */
	grade: string;
	/** What was true. One point renders as prose, several as a list. */
	points: ReactNode[];
}

export interface ComparisonRow {
	id: string;
	/** The row label, e.g. the thing being graded. */
	stage: string;
	before: ComparisonState;
	after: ComparisonState;
}

export interface ComparisonTableProps {
	rows: ComparisonRow[];
	/** Column headers. Defaults suit a before and after. */
	columns?: { stage?: string; before?: string; after?: string };
	/** Small print under the table, e.g. what the grades mean. */
	footnote?: ReactNode;
	className?: string;
}

function Cell({ state, highlight }: { state: ComparisonState; highlight: boolean }) {
	const isLetter = state.grade.length === 1;
	return (
		<div className="cmp-cell">
			<span
				className={["cmp-grade", isLetter ? "is-letter" : "is-note", highlight ? "is-moved" : ""]
					.filter(Boolean)
					.join(" ")}
			>
				{state.grade}
			</span>
			<div className="cmp-points">
				{state.points.length === 1 ? (
					state.points[0]
				) : (
					<ul>
						{state.points.map((point, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: a row's points are static and never reorder.
							<li key={i}>{point}</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export function ComparisonTable({ rows, columns, footnote, className }: ComparisonTableProps) {
	const heads = {
		stage: columns?.stage ?? "Area",
		before: columns?.before ?? "Before",
		after: columns?.after ?? "After",
	};

	return (
		<div className={["comparison", className].filter(Boolean).join(" ")}>
			<div className="cmp-scroll">
				<table className="cmp-table">
					<colgroup>
						<col className="cmp-col-stage" />
						<col className="cmp-col-half" />
						<col className="cmp-col-half" />
					</colgroup>
					<thead>
						<tr>
							<th>{heads.stage}</th>
							<th>{heads.before}</th>
							<th>{heads.after}</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<th scope="row">{row.stage}</th>
								<td>
									<Cell state={row.before} highlight={false} />
								</td>
								<td className="is-after">
									<Cell state={row.after} highlight={row.before.grade !== row.after.grade} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{footnote && <p className="cmp-footnote">{footnote}</p>}
		</div>
	);
}
