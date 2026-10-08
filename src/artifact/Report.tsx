import type { ReactNode } from "react";
import { GradeChip, type WriteupGrade } from "./GradeChip";
import { SignOff, type WriteupPerson } from "./SignOff";

/**
 * The monthly page: what an Operate client gets each month, as one printed
 * letter sheet and its hosted twin. Its shape is the practice's
 * FOOTPRINT.md, under What the Owner Gets: the title and the period, then
 * the leads block answering the four questions the Statement of Work
 * promises, in that order, each a figure and one plain sentence; then the
 * seven grades with what moved since last month and since the baseline; then
 * the sign off. It wears the writeup's grade chip and sign off, and the
 * artifact shell's header on screen; print drops the header and the credit
 * band, so the sheet is the document alone.
 */

export interface ReportLead {
	/** The figure, e.g. "31 leads" or "$1,240". */
	figure: ReactNode;
	/** One plain sentence on what the figure means to the owner. */
	sentence: ReactNode;
}

/** The four questions, answered in this order on every monthly page. */
export interface ReportLeads {
	cameIn: ReportLead;
	fromWhere: ReportLead;
	cost: ReportLead;
	closed: ReportLead;
}

export interface ReportGradeRow {
	/** The tier, e.g. "Health". */
	tier: string;
	/** The section's trade name, e.g. "Local SEO". */
	section: string;
	/** The grade this month: the one judgement, in full color. */
	now: WriteupGrade;
	/** The grade last month; omit on the first month. */
	lastMonth?: WriteupGrade;
	/** The grade in the baseline snapshot, the first taken on private sources. */
	baseline?: WriteupGrade;
	/** One line on what moved, in the owner's words. */
	moved: string;
}

export interface ReportProps {
	title: string;
	/** The period as printed, e.g. "September 2026". */
	period: string;
	leads: ReportLeads;
	/** The seven sections, in the footprint's order. */
	grades: ReportGradeRow[];
	/** The sign off, the same lockup the writeup closes on. */
	close: { signOff: string; person: WriteupPerson };
}

/**
 * The questions are the monthly page's contract with the Statement of Work,
 * the same on every client's page, so they live here rather than in content.
 */
const QUESTIONS: { key: keyof ReportLeads; label: string }[] = [
	{ key: "cameIn", label: "What Came In" },
	{ key: "fromWhere", label: "From Where" },
	{ key: "cost", label: "What It Cost" },
	{ key: "closed", label: "What It Closed" },
];

function Earlier({ grade, label }: { grade?: WriteupGrade; label: string }) {
	return (
		<td className="rp-earlier" data-label={label}>
			{grade && <GradeChip grade={grade} />}
		</td>
	);
}

export function Report({ title, period, leads, grades, close }: ReportProps) {
	let lastTier = "";
	return (
		<div className="rp">
			<article className="rp-sheet">
				<header className="rp-head">
					<div className="rp-period">{period}</div>
					<h1>{title}</h1>
				</header>
				<div className="rp-leads">
					{QUESTIONS.map(({ key, label }) => (
						<section className="rp-lead" key={key}>
							<h2 className="rp-q">{label}</h2>
							<div className="rp-figure">{leads[key].figure}</div>
							<p>{leads[key].sentence}</p>
						</section>
					))}
				</div>
				<table className="rp-grades">
					<thead>
						<tr>
							<th scope="col">Tier</th>
							<th scope="col">Section</th>
							<th scope="col">Now</th>
							<th scope="col">Last Month</th>
							<th scope="col">Baseline</th>
							<th scope="col">What Moved</th>
						</tr>
					</thead>
					<tbody>
						{grades.map((row) => {
							const tier = row.tier === lastTier ? "" : row.tier;
							lastTier = row.tier;
							return (
								<tr key={row.section} className={tier ? "is-tier-start" : undefined}>
									<td className="rp-tier">{tier}</td>
									<td className="rp-section">{row.section}</td>
									<td className="rp-now" data-label="Now">
										<GradeChip grade={row.now} />
									</td>
									<Earlier grade={row.lastMonth} label="Last Month" />
									<Earlier grade={row.baseline} label="Baseline" />
									<td className="rp-moved">{row.moved}</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				<footer className="rp-close">
					<SignOff signOff={close.signOff} person={close.person} />
				</footer>
			</article>
		</div>
	);
}
