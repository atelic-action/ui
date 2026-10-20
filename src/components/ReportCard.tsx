import { ChevronRight } from "lucide-react";
import { Fragment, type ReactNode, useId } from "react";
import { GradeChip, gradeLabel, type WriteupGrade } from "../artifact/GradeChip";

export interface ReportCardRow {
	/** The row's name, e.g. a section's trade name. */
	name: ReactNode;
	/** Where the row leads, e.g. "#technical-seo"; the whole row is the link when set. */
	href?: string;
	/** The grade; a dash, read as not graded, when left out. */
	grade?: WriteupGrade;
	/** The earlier grade, faded beside the grade: what moved. */
	before?: WriteupGrade;
	/** The line behind the grade, in the owner's words. */
	line?: ReactNode;
}

export interface ReportCardGroup {
	/** The label over the group's rows, e.g. "Health". */
	title: string;
	rows: ReportCardRow[];
}

/** The words a screen reader hears around the letters. */
export interface ReportCardLabels {
	/** Before a grade; "Grade". */
	grade: string;
	/** Before the earlier grade; "Before". */
	before: string;
	/** For a row with no grade; "Not graded yet". */
	notGraded: string;
}

export const reportCardLabels: ReportCardLabels = {
	grade: "Grade",
	before: "Before",
	notGraded: "Not graded yet",
};

export interface ReportCardProps {
	id?: string;
	/** The heading over the card, e.g. "At a Glance". */
	title?: ReactNode;
	/** What a screen reader calls the card when it has no title. */
	label?: string;
	/** What each letter means, in a few words each, right of the title. */
	legend?: Array<{ grade: WriteupGrade; label: string }>;
	/** Where the legend sits: beside the title, or under the card so nothing sits between a heading and the rows. */
	legendAt?: "head" | "foot";
	groups: ReportCardGroup[];
	labels?: Partial<ReportCardLabels>;
	className?: string;
}

/**
 * A report card: a name, a grade, and one line on it per row, in labeled
 * groups, each row's parts centered on it. A group's label
 * is not a heading: the card sits inside a document whose outline the
 * sections already carry. A row with an
 * href is a link from edge to edge, with a chevron at its end; a link inside
 * the line still goes where it points. The grade is the chip every document
 * wears, and the earlier grade, when there is one, sits faded beside it.
 */
export function ReportCard({
	id,
	title,
	label,
	legend,
	legendAt = "head",
	groups,
	labels: overrides,
	className,
}: ReportCardProps) {
	// An override left undefined keeps the default, so a caller can pass what it has.
	const titleId = useId();
	const labels = { ...reportCardLabels };
	for (const key of Object.keys(labels) as Array<keyof ReportCardLabels>) {
		const word = overrides?.[key];
		if (word !== undefined) labels[key] = word;
	}
	const shown = groups.filter((group) => group.rows.length > 0);
	const hasLegend = legend !== undefined && legend.length > 0;
	const key = hasLegend && (
		<ul className={legendAt === "foot" ? "rc-legend rc-legend-foot" : "rc-legend"}>
			{legend.map((entry) => (
				<li key={entry.grade}>
					<GradeChip grade={entry.grade} />
					<span>{entry.label}</span>
				</li>
			))}
		</ul>
	);
	return (
		<section
			className={["report-card", className].filter(Boolean).join(" ")}
			id={id}
			aria-labelledby={title ? titleId : undefined}
			aria-label={title ? undefined : label}
		>
			{(title || (hasLegend && legendAt === "head")) && (
				<div className="rc-head">
					{title && (
						<h2 className="rc-title" id={titleId}>
							{title}
						</h2>
					)}
					{legendAt === "head" && key}
				</div>
			)}
			<div className="rc-card">
				{shown.map((group, g) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: two groups may share a title
					<Fragment key={`${g}-${group.title}`}>
						<div className="rc-group">{group.title}</div>
						{group.rows.map((row, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: rows are static content in a fixed order
							<div className="rc-row" key={i}>
								<span className="rc-grade">
									{row.before && (
										<span className="rc-before">
											<span className="rc-sr">{`${labels.before}: ${gradeLabel[row.before]}. `}</span>
											<span aria-hidden="true">
												<GradeChip grade={row.before} />
											</span>
										</span>
									)}
									{row.grade ? (
										<>
											<span className="rc-sr">{`${labels.grade} ${gradeLabel[row.grade]}: `}</span>
											<span aria-hidden="true">
												<GradeChip grade={row.grade} />
											</span>
										</>
									) : (
										<>
											<span className="rc-sr">{labels.notGraded}</span>
											<span className="rc-dash" aria-hidden="true" />
										</>
									)}
								</span>
								<b className="rc-name">{row.href ? <a href={row.href}>{row.name}</a> : row.name}</b>
								{row.line != null && <span className="rc-line">{row.line}</span>}
								{row.href && <ChevronRight className="rc-go" size={18} aria-hidden="true" />}
							</div>
						))}
					</Fragment>
				))}
			</div>
			{legendAt === "foot" && key}
		</section>
	);
}
