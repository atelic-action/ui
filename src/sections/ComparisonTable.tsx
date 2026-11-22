import type { ReactNode } from "react";
import { useScrollsSideways } from "../lib/useScrollsSideways";
import { useWithBase } from "../routing/BasePathProvider";

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
	/** Links the label, e.g. to the glossary entry that explains the thing graded. A root path takes the base path. */
	stageHref?: string;
	before: ComparisonState;
	after: ComparisonState;
}

export interface ComparisonTableProps {
	rows: ComparisonRow[];
	/** Column headers. Defaults suit a before and after. */
	columns?: { stage?: string; before?: string; after?: string };
	/** Small print under the table, e.g. what the grades mean. */
	footnote?: ReactNode;
	/**
	 * What a screen reader calls the table's box while the table is wider
	 * than the page and scrolls inside it, as on a phone; defaults to
	 * "Comparison". Name what the table compares ("The site, before and after").
	 */
	ariaLabel?: string;
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

export function ComparisonTable({
	rows,
	columns,
	footnote,
	ariaLabel = "Comparison",
	className,
}: ComparisonTableProps) {
	const withBase = useWithBase();
	// The box scrolls sideways on a phone, where the table keeps its shape
	// (Component Rules 6), so while it scrolls it is a named region a
	// keyboard can reach and scroll, as DataTable's is.
	const scrolls = useScrollsSideways();
	const heads = {
		stage: columns?.stage ?? "Area",
		before: columns?.before ?? "Before",
		after: columns?.after ?? "After",
	};

	return (
		<div className={["comparison", className].filter(Boolean).join(" ")}>
			<div
				ref={scrolls.ref}
				className="cmp-scroll"
				{...(scrolls.active ? { tabIndex: 0, role: "region", "aria-label": ariaLabel } : {})}
			>
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
								<th scope="row">
									{row.stageHref ? (
										<a className="cmp-stage-link" href={withBase(row.stageHref)}>
											{row.stage}
										</a>
									) : (
										row.stage
									)}
								</th>
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
