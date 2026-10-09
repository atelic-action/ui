import { Callout } from "../components";
import { newTabProps } from "../lib/newTabProps";
import { Shot, type WriteupShot } from "./Shot";
import { SignOff, type WriteupPerson } from "./SignOff";

/**
 * The note: the first touch, for a business whose site publishes no email
 * address, written as a short page and left at `<short>.atelic.me/notes`. It
 * is the first touch email set as a document, so it carries no grades, no
 * sections, and no tables: a title, the opener, what the customer sees and
 * what sits under the hood, where the work would start, and the close. It
 * reads on a phone first and prints to one letter sheet.
 *
 * It is the writeup's sibling, not a variant of it: a site wraps it in
 * ArtifactShell exactly as it wraps the writeup, and it reuses the writeup's
 * pieces where they fit (the Callout a finding is set in, the owner's screen,
 * the sign off). Every prop is plain data, so a routine can write a note as
 * JSON; the one exception is the sign off person's `role`, which takes a node
 * and is equally happy with a string.
 */

/** A link inside running text: the words the reader clicks and where they go. */
export interface NoteLink {
	text: string;
	href: string;
}

/** A paragraph: a plain string, or runs of text and links in order. */
export type NoteParagraph = string | Array<string | NoteLink>;

/** One defect and what it costs, with the owner's screen under it when there is one. */
export interface NoteFinding {
	/** The defect, in a full sentence. */
	lead: string;
	/** The consequence: what it costs the business. */
	body: string;
	/**
	 * Where the defect can be seen for oneself. The lead links there: in a new
	 * tab for an http(s) link, in place otherwise.
	 */
	href?: string;
	/** The owner's own screen, rendered under the finding. */
	shot?: WriteupShot;
}

/** One side of the read, e.g. "What your customer sees", with one or two findings. */
export interface NoteLane {
	heading: string;
	findings: NoteFinding[];
}

/** One place the work would start. */
export interface NoteStep {
	/** The step, set in bold. */
	lead: string;
	/** What it does, after the lead. */
	body?: string;
}

/** Where the work would start: the line that introduces it, then the steps. */
export interface NoteStart {
	/** The line over the steps, e.g. "I would start by:". */
	lead: string;
	items: NoteStep[];
}

/** The close: who is writing and the offer, then the sign off. */
export interface NoteClose {
	/** The sender paragraph, then the offer line with its scheduling link and the exit sentence. */
	paragraphs: NoteParagraph[];
	signOff: string;
	person: WriteupPerson;
}

export interface NoteProps {
	title: string;
	/** The business, set in the dateline: "Prepared for <business>, <date>". */
	preparedFor: string;
	/** The ISO date, e.g. "2026-10-09". */
	date: string;
	/** The street sighting and a kudos, then the gap sentence. */
	opener: NoteParagraph;
	/** "What your customer sees" and "What I see under the hood", in that order. */
	lanes: NoteLane[];
	start: NoteStart;
	close: NoteClose;
}

/** A link opens in a new tab when it leaves the page, and in place when it is an anchor or a mail link. */
function NoteAnchor({ href, children }: { href: string; children: string }) {
	return (
		<a href={href} {...newTabProps(href, /^https?:/i.test(href))}>
			{children}
		</a>
	);
}

/** A paragraph with nothing to read: a blank string, or runs that are all blank strings. A link always counts. */
function isEmpty(paragraph: NoteParagraph): boolean {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return runs.every((run) => typeof run === "string" && run.trim() === "");
}

function Paragraph({ paragraph, className }: { paragraph: NoteParagraph; className?: string }) {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return (
		<p className={className}>
			{runs.map((run, i) =>
				typeof run === "string" ? (
					run
				) : (
					// biome-ignore lint/suspicious/noArrayIndexKey: runs are static content in a fixed order
					<NoteAnchor href={run.href} key={i}>
						{run.text}
					</NoteAnchor>
				),
			)}
		</p>
	);
}

function Finding({ finding }: { finding: NoteFinding }) {
	return (
		<li className={finding.shot ? "nt-finding has-shot" : "nt-finding"}>
			<Callout
				tone="warn"
				title={
					finding.href ? <NoteAnchor href={finding.href}>{finding.lead}</NoteAnchor> : finding.lead
				}
			>
				{finding.body}
			</Callout>
			{finding.shot && <Shot shot={finding.shot} />}
		</li>
	);
}

export function Note({ title, preparedFor, date, opener, lanes, start, close }: NoteProps) {
	const shownLanes = lanes.filter((lane) => lane.findings.length > 0);
	const paragraphs = close.paragraphs.filter((paragraph) => !isEmpty(paragraph));
	return (
		<div className="nt">
			<article className="nt-doc">
				<header className="nt-head">
					<p className="nt-meta">
						Prepared for <b>{preparedFor}</b>, <span className="nt-meta-date">{date}</span>
					</p>
					<h1>{title}</h1>
				</header>
				{!isEmpty(opener) && <Paragraph paragraph={opener} className="nt-opener" />}
				{shownLanes.length > 0 && (
					<div className="nt-lanes">
						{shownLanes.map((lane) => (
							<section className="nt-lane" key={lane.heading}>
								<h2>{lane.heading}</h2>
								<ul className="nt-findings">
									{lane.findings.map((finding) => (
										<Finding finding={finding} key={finding.lead} />
									))}
								</ul>
							</section>
						))}
					</div>
				)}
				{start.items.length > 0 && (
					<section className="nt-start">
						<p className="nt-start-lead">{start.lead}</p>
						<ul>
							{start.items.map((step) => (
								<li key={step.lead}>
									<b>{step.lead}</b>
									{step.body && <> {step.body}</>}
								</li>
							))}
						</ul>
					</section>
				)}
				<footer className="nt-close">
					{paragraphs.map((paragraph, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: paragraphs are static content in a fixed order
						<Paragraph paragraph={paragraph} key={i} />
					))}
					<SignOff signOff={close.signOff} person={close.person} />
				</footer>
			</article>
		</div>
	);
}
