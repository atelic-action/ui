import { ArrowUpRight } from "lucide-react";
import { newTabProps } from "../lib/newTabProps";
import { GradeChip, gradeLabel, type WriteupGrade } from "./GradeChip";
import { type ArtifactLink, type ArtifactParagraph, isEmpty, Paragraph, Runs } from "./Paragraph";
import { Shot, type WriteupShot } from "./Shot";
import { SignOff, type WriteupPerson } from "./SignOff";

/**
 * The read: what a customer gets at the end of an engagement's first week,
 * before anything changes. Where the writeup says what letter each section
 * earned, the read says why, and what changes. Its shape is the practice's
 * FOOTPRINT.md, under What the Owner Gets: a title and a dated lede; the gist
 * table (every section, its grade, and one line); then the tiers, each
 * section a question in three beats (what we found, why, what changes) with
 * any proof pictures and the tools it was read from; then the plan, in order;
 * then one closing line and the sign off.
 *
 * It is the writeup's sibling, not a variant: it wears the writeup's column,
 * head, grade chip and key, tier heading, section card, screen, sources, and
 * close (the `.op` classes), and adds only what is its own (the `.rd`
 * classes). The gist table is drawn from the tiers, so a tier added later
 * (Conversion, once the analytics access lands) is one more entry in `tiers`
 * and appears in the table and the body alike, with no change to the props.
 * Every prop is plain data, so a routine can write a read as JSON; the one
 * exception is the sign off person's `role`, which takes a node and is
 * equally happy with a string.
 */

/** A link inside running text: the words the reader clicks and where they go. */
export type ReadLink = ArtifactLink;

/** A paragraph: a plain string, or runs of text and links in order. */
export type ReadParagraph = ArtifactParagraph;

/** A place a reading came from: the tool, opened in a new tab when it has an address. */
export interface ReadSource {
	label: string;
	href?: string;
}

/** One section of a tier: a question in three beats. */
export interface ReadSection {
	/** The anchor the gist table links to, e.g. "technical-seo". */
	id: string;
	/** The section's trade name, e.g. "Technical SEO": the gist table's Section column, and the line over the question. */
	name: string;
	/** The question the section answers, in the owner's words, e.g. "Can Google read the site?". The section's heading. */
	question: string;
	/** The baseline's grade. Omit for a section not yet graded; the table shows a quiet dash. */
	grade?: WriteupGrade;
	/** The one line in the gist table. */
	gist: ReadParagraph;
	/** What we found: one paragraph or more. */
	found: ReadParagraph[];
	/** A few concrete examples of what was found, as a short list under it. */
	examples?: ReadParagraph[];
	/** Proof pictures, each over its caption, e.g. a search result capture per market. */
	shots?: WriteupShot[];
	/** Why, in one sentence, set apart. */
	why: ReadParagraph;
	/** What changes: one paragraph or more. */
	changes: ReadParagraph[];
	/** The tools the readings came from, linked, so the owner can open them. */
	sources?: ReadSource[];
}

/** A tier, e.g. Health: its heading, the question it answers, and its sections in order. */
export interface ReadTier {
	/** The anchor a header stop points at, e.g. "health". */
	id?: string;
	/** The tier's name, e.g. "Health". */
	title: string;
	/** The question the tier answers, in the owner's words. */
	lead?: string;
	sections: ReadSection[];
}

/** One step of the plan: a bold title and a sentence or two. */
export interface ReadStep {
	title: string;
	body?: ReadParagraph;
	/** Whose step it is when it is not the practice's, e.g. "Yours" or a name; set beside the title. */
	who?: string;
}

/** The plan: the steps in order, numbered. */
export interface ReadPlan {
	/** The anchor a header stop points at, e.g. "plan". */
	id?: string;
	/** The heading; defaults to the `plan` label. */
	title?: string;
	/** A line over the steps. */
	lead?: ReadParagraph;
	steps: ReadStep[];
}

/** The close: one line, then the sign off. */
export interface ReadClose {
	/** One sentence, e.g. what follows and when. */
	line: ReadParagraph;
	signOff?: string;
	person?: WriteupPerson;
}

/** The fixed words the page sets, each overridable. */
export interface ReadLabels {
	/** The gist table's first column. */
	section: string;
	/** The gist table's second column. */
	grade: string;
	/** The gist table's third column. */
	gist: string;
	/** What a screen reader hears for a section with no grade. */
	notGraded: string;
	found: string;
	why: string;
	changes: string;
	/** The label over a section's tools. */
	sources: string;
	/** The plan's heading when it names none. */
	plan: string;
}

export const readLabels: ReadLabels = {
	section: "Section",
	grade: "Grade",
	gist: "The Gist",
	notGraded: "Not graded yet",
	found: "What We Found",
	why: "Why",
	changes: "What Changes",
	sources: "Sources",
	plan: "The Plan",
};

export interface ReadProps {
	title: string;
	/** The business, set in the dateline. */
	preparedFor: string;
	/** The ISO date, e.g. "2026-10-16". */
	date: string;
	/** Two or three sentences under the title. */
	lede: ReadParagraph;
	/** The heading over the gist table, e.g. "At a Glance". */
	gistTitle?: string;
	/** The key: what each letter means, in a few words each. */
	gradeKey?: Array<{ grade: WriteupGrade; label: string }>;
	/** The tiers in order. Each section appears in the gist table and in the body. */
	tiers: ReadTier[];
	plan: ReadPlan;
	close: ReadClose;
	labels?: Partial<ReadLabels>;
}

function Sources({ sources, label }: { sources: ReadSource[]; label: string }) {
	return (
		<footer className="op-sources">
			<span className="op-sources-label">{label}</span>
			<ul>
				{sources.map((source) => (
					<li key={source.label}>
						{source.href ? (
							<a href={source.href} {...newTabProps(source.href, true)}>
								{source.label}
								<ArrowUpRight size={12} aria-hidden="true" />
							</a>
						) : (
							source.label
						)}
					</li>
				))}
			</ul>
		</footer>
	);
}

function Gist({
	tiers,
	title,
	gradeKey,
	labels,
}: {
	tiers: ReadTier[];
	title?: string;
	gradeKey?: ReadProps["gradeKey"];
	labels: ReadLabels;
}) {
	return (
		<section className="rd-gist" aria-label={title ? undefined : labels.gist}>
			{(title || gradeKey) && (
				<div className="op-ov-head">
					{title && <h2 className="op-ov-title">{title}</h2>}
					{gradeKey && (
						<ul className="op-legend">
							{gradeKey.map((entry) => (
								<li key={entry.grade}>
									<GradeChip grade={entry.grade} />
									<span>{entry.label}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
			<div className="rd-gist-card">
				<table className="rd-gist-table">
					<thead>
						<tr>
							<th scope="col" className="rd-gist-section">
								{labels.section}
							</th>
							<th scope="col" className="rd-gist-grade">
								{labels.grade}
							</th>
							<th scope="col" className="rd-gist-read">
								{labels.gist}
							</th>
						</tr>
					</thead>
					{tiers.map((tier) => (
						<tbody key={tier.title}>
							<tr className="rd-gist-tier">
								<th scope="rowgroup" colSpan={3}>
									{tier.title}
								</th>
							</tr>
							{tier.sections.map((section) => (
								<tr key={section.id}>
									<th scope="row" className="rd-gist-section">
										<a href={`#${section.id}`}>{section.name}</a>
									</th>
									<td className="rd-gist-grade">
										{section.grade ? (
											<>
												<span className="op-sr-only">{gradeLabel[section.grade]}</span>
												<span aria-hidden="true">
													<GradeChip grade={section.grade} />
												</span>
											</>
										) : (
											<>
												<span className="op-sr-only">{labels.notGraded}</span>
												<span className="op-dash" aria-hidden="true" />
											</>
										)}
									</td>
									<td className="rd-gist-read">
										<Runs paragraph={section.gist} />
									</td>
								</tr>
							))}
						</tbody>
					))}
				</table>
			</div>
		</section>
	);
}

function Section({ section, labels }: { section: ReadSection; labels: ReadLabels }) {
	const found = section.found.filter((paragraph) => !isEmpty(paragraph));
	const changes = section.changes.filter((paragraph) => !isEmpty(paragraph));
	const shots = section.shots ?? [];
	return (
		<section className="op-topic rd-section" id={section.id}>
			<header className="op-topic-head">
				<div>
					<p className="rd-name">{section.name}</p>
					<h3>{section.question}</h3>
				</div>
				{section.grade && (
					<>
						<span className="op-sr-only">{`${labels.grade} ${gradeLabel[section.grade]}`}</span>
						<span className="rd-grade" aria-hidden="true">
							<GradeChip grade={section.grade} />
						</span>
					</>
				)}
			</header>
			<div className="rd-beat rd-found">
				<h4>{labels.found}</h4>
				{found.map((paragraph, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are static content in a fixed order
					<Paragraph paragraph={paragraph} key={i} />
				))}
				{section.examples && section.examples.length > 0 && (
					<ul className="rd-examples">
						{section.examples.map((example, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: examples are static content in a fixed order
							<li key={i}>
								<Runs paragraph={example} />
							</li>
						))}
					</ul>
				)}
				{shots.length > 0 && (
					<div className="rd-shots" data-count={Math.min(shots.length, 3)}>
						{shots.map((shot) => (
							<Shot shot={shot} key={shot.src} />
						))}
					</div>
				)}
			</div>
			<div className="rd-beat rd-why">
				<h4>{labels.why}</h4>
				<Paragraph paragraph={section.why} />
			</div>
			<div className="rd-beat rd-changes">
				<h4>{labels.changes}</h4>
				{changes.map((paragraph, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are static content in a fixed order
					<Paragraph paragraph={paragraph} key={i} />
				))}
			</div>
			{section.sources && section.sources.length > 0 && (
				<Sources sources={section.sources} label={labels.sources} />
			)}
		</section>
	);
}

function Plan({ plan, labels }: { plan: ReadPlan; labels: ReadLabels }) {
	return (
		<section className="rd-plan" id={plan.id}>
			<h2>{plan.title ?? labels.plan}</h2>
			{plan.lead && !isEmpty(plan.lead) && (
				<Paragraph paragraph={plan.lead} className="rd-plan-lead" />
			)}
			<ol className="rd-steps">
				{plan.steps.map((step) => (
					<li className="rd-step" key={step.title}>
						<p>
							<b className="rd-step-title">{step.title}</b>
							{step.who && (
								<>
									{" "}
									<span className="rd-step-who">{step.who}</span>
								</>
							)}
							{step.body && !isEmpty(step.body) && (
								<>
									{" "}
									<Runs paragraph={step.body} />
								</>
							)}
						</p>
					</li>
				))}
			</ol>
		</section>
	);
}

export function Read({
	title,
	preparedFor,
	date,
	lede,
	gistTitle,
	gradeKey,
	tiers,
	plan,
	close,
	labels: overrides,
}: ReadProps) {
	const labels = { ...readLabels, ...overrides };
	const shownTiers = tiers.filter((tier) => tier.sections.length > 0);
	return (
		<div className="op rd">
			<article className="op-doc rd-doc">
				<header className="op-head">
					<p className="op-meta">
						Prepared for <b>{preparedFor}</b>
						<span className="op-meta-sep" aria-hidden="true">
							{" · "}
						</span>
						<span className="op-meta-date">{date}</span>
					</p>
					<h1>{title}</h1>
					{!isEmpty(lede) && <Paragraph paragraph={lede} className="op-intro rd-lede" />}
				</header>
				{shownTiers.length > 0 && (
					<Gist tiers={shownTiers} title={gistTitle} gradeKey={gradeKey} labels={labels} />
				)}
				{shownTiers.map((tier) => (
					<div className="rd-tier" key={tier.title}>
						<div className="op-part" id={tier.id}>
							<h2>{tier.title}</h2>
							{tier.lead && <p>{tier.lead}</p>}
						</div>
						{tier.sections.map((section) => (
							<Section section={section} labels={labels} key={section.id} />
						))}
					</div>
				))}
				{plan.steps.length > 0 && <Plan plan={plan} labels={labels} />}
				{!isEmpty(close.line) && <Paragraph paragraph={close.line} className="rd-closing" />}
				{close.signOff && close.person && (
					<footer className="op-close rd-close">
						<SignOff signOff={close.signOff} person={close.person} />
					</footer>
				)}
			</article>
		</div>
	);
}
