import { ArrowUpRight, ChevronRight, CircleAlert, CircleCheck, CircleX, Star } from "lucide-react";
import type { ReactNode } from "react";
import {
	Callout,
	Checklist,
	type ChecklistItem,
	Collapsible,
	ColumnChart,
	type ColumnChartGroup,
	DataTable,
	StackedBar,
	type StackedBarSegment,
	type StatItem,
	StatRow,
	type ThresholdReading,
	ThresholdScale,
	type ThresholdZone,
	type Tone,
} from "../components";
import { newTabProps } from "../lib/newTabProps";
import { GradeChip, gradeLabel, type WriteupGrade } from "./GradeChip";
import { SignOff, type WriteupPerson } from "./SignOff";

export type { WriteupGrade } from "./GradeChip";
export type { WriteupPerson } from "./SignOff";

/**
 * The writeup: the graded document an owner gets. It is a web page first: an
 * overview that links into every section, then the three tiers, each section
 * a card of small blocks and a line of sources that open the tools the
 * reading came from. Print is the same page with the chrome dropped and the
 * type brought down, flowing across letter pages; nothing is clipped.
 *
 * Every block is a component from @atelic-action/ui (the checklist, the
 * sortable table, the charts, the stat row, the callout, the collapsible);
 * this file owns only the document: the overview, the tiers, the section
 * card, the markets table, and the close. Its skeleton is the practice's
 * FOOTPRINT.md, and what it says follows the pitch surface rules
 * (Brand/voice.md): the trade's term linked to its definition, or plain
 * words, and no term an owner would have to look up.
 */

/** How a mark, a bar segment, or a zone reads; the shared package's tones. */
export type WriteupTone = Tone;

export interface WriteupShot {
	/** The crop shown on the page. */
	src: string;
	alt: string;
	/** The full screenshot the crop opens in a new tab; omit to render the crop alone. */
	href?: string;
	caption: string;
}

export interface WriteupBullet {
	/** The point, in a full sentence. The icon sits beside it. */
	lead: string;
	/** The one explainer that says why it matters. */
	body?: ReactNode;
	/** A win the owner already has: marked good. Everything else reads as needing work. */
	win?: boolean;
	/** Overrides the tone, e.g. "info" for something not yet read. */
	tone?: WriteupTone;
	/** Sets the finding apart on a tinted ground, for something missing or owed. */
	box?: boolean;
}

/** A place a reading came from: the tool, opened in a new tab when it has an address. */
export interface WriteupSource {
	label: string;
	href?: string;
}

/** A yes or no cell: the icon alone, with the text read to a screen reader. A figure a reader needs (a rank, a count) is a column of its own. */
export interface WriteupMark {
	mark: "good" | "warn" | "bad" | "none";
	/** What the mark means, e.g. "Loads" or "Page Not Found"; always read to a screen reader. */
	text: string;
	/** Show the text beside the icon. The rare exception: a mark is the icon alone unless this is true. */
	show?: boolean;
	/** What the cell sorts by; without it a mark sorts good, warning, bad, none. */
	sort?: number | string;
}

/** A cell whose display is not what it sorts by, e.g. "4.8" beside a star. */
export interface WriteupSorted {
	display: ReactNode;
	sort: number | string;
}

export type WriteupCell = ReactNode | WriteupMark | WriteupSorted;

function isMark(cell: WriteupCell): cell is WriteupMark {
	return typeof cell === "object" && cell !== null && "mark" in cell;
}

interface BlockBase {
	title?: string;
	lead?: ReactNode;
	note?: ReactNode;
}

/** A short list of pass or fail checks, the basics a section rests on. */
export interface WriteupChecks extends BlockBase {
	kind: "checks";
	items: ChecklistItem[];
}

/** A table: the first column names the row, the rest are short facts or marks. */
export interface WriteupTable extends BlockBase {
	kind: "table";
	columns: Array<{
		label: string;
		align?: "left" | "center" | "right";
		/** Lets the reader sort by this column. */
		sortable?: boolean;
		/** The direction a first click sorts in. */
		firstSort?: "asc" | "desc";
	}>;
	rows: Array<{ cells: WriteupCell[]; tone?: WriteupTone }>;
	/** The sort the table opens in. */
	sort?: { column: number; direction: "asc" | "desc" };
}

/** One stacked bar: the parts of a whole, with a key. */
export interface WriteupBar extends BlockBase {
	kind: "bar";
	segments: StackedBarSegment[];
}

/** A scale with zones and one line per reading. */
export interface WriteupScale extends BlockBase {
	kind: "scale";
	max: number;
	zones: ThresholdZone[];
	ticks: Array<{ at: number; label: string }>;
	readings: ThresholdReading[];
}

/** A few numbers worth reading first, each with its period and its comparisons. */
export interface WriteupStats extends BlockBase {
	kind: "stats";
	items: StatItem[];
}

/** A column chart: a bar a period, the periods in labeled groups. */
export interface WriteupColumns extends BlockBase {
	kind: "columns";
	groups: ColumnChartGroup[];
	legend?: Array<{ label: string; tone: WriteupTone }>;
}

/** Findings, each an icon beside its point with the explainer under it, and the owner's screen beside them. */
export interface WriteupFindings {
	kind: "findings";
	items: WriteupBullet[];
	shot?: WriteupShot;
	shot2?: WriteupShot;
}

/** The owner's own screens, side by side at one size. */
export interface WriteupShots {
	kind: "shots";
	title?: string;
	shots: WriteupShot[];
}

/** Blocks that can sit inside a collapsible. */
export type WriteupInnerBlock =
	| WriteupChecks
	| WriteupTable
	| WriteupBar
	| WriteupScale
	| WriteupFindings
	| WriteupStats
	| WriteupColumns
	| WriteupShots;

/**
 * A collapsible: the label says what is inside and the summary says what it
 * shows, so the detail needs no explaining once open.
 */
export interface WriteupMore {
	kind: "more";
	label: string;
	summary?: ReactNode;
	blocks: WriteupInnerBlock[];
}

export type WriteupTopicBlock = WriteupInnerBlock | WriteupMore;

export interface WriteupTopic {
	kind: "topic";
	id: string;
	/** The discipline's trade name, e.g. "Local SEO" or "Core Web Vitals". */
	title: string;
	/** Where the name is defined, e.g. the practice's glossary; the title links there. */
	href?: string;
	/** What a screen reader calls the title's link icon; defaults to "Opens in a new tab". */
	hrefLabel?: string;
	/** One line in the owner's words: what this is, as a person would say it. */
	oneLiner: string;
	/** The section's grade, beside the heading. */
	grade?: WriteupGrade;
	/** Why it earned that letter: the rule it met, in a sentence. */
	why?: ReactNode;
	/** The section's blocks, in order. */
	blocks?: WriteupTopicBlock[];
	/** Findings without blocks: rendered as one findings block with the shots beside it. */
	bullets?: WriteupBullet[];
	shot?: WriteupShot;
	shot2?: WriteupShot;
	shotBrief?: string;
	/** The topic carries no picture by design. */
	noShot?: boolean;
	/** The tools the readings came from, linked. */
	sources?: WriteupSource[];
	/** The label over the sources, e.g. "Where this comes from". */
	sourcesLabel?: string;
}

export interface WriteupPart {
	kind: "part";
	/** The anchor a header stop points at, e.g. "health". */
	id?: string;
	/** The tier's name, e.g. "Health". */
	title: string;
	/** The question the tier answers, in the owner's words. */
	lead: string;
}

export interface WriteupSummaryRow {
	/** The tier, e.g. "Health". */
	tier: string;
	/** The section's trade name, matching a topic title. */
	section: string;
	/** The topic's anchor, e.g. "#technical-seo"; the row links to it. */
	href?: string;
	grade: WriteupGrade;
	/** The grade in the earlier snapshot, on a later writeup: what moved. */
	before?: WriteupGrade;
	/** The read behind the grade, in the owner's words. */
	read: ReactNode;
}

/** The overview the writeup opens on: every section, its grade, and one plain read. */
export interface WriteupSummary {
	kind: "summary";
	id?: string;
	title?: string;
	rows: WriteupSummaryRow[];
	/** What each letter means, in a few words each. */
	legend?: Array<{ grade: WriteupGrade; label: string }>;
	/** What a screen reader calls the earlier letter, e.g. "June 2026"; defaults to "Before". */
	beforeLabel?: string;
}

/** The paid facts line: what is rented, never graded (FOOTPRINT.md, Paid). */
export interface WriteupRented {
	kind: "rented";
	label?: string;
	text: ReactNode;
}

export interface WriteupMarketRow {
	market: string;
	place?: string;
	/** One grade per column, in column order; null draws a quiet dash for a column not read. */
	grades: Array<WriteupGrade | null>;
	read: ReactNode;
}

/** The markets table: one row per market, one letter per column, the read beside it. */
export interface WriteupMarkets {
	kind: "markets";
	title: string;
	lead?: string;
	columns: string[];
	rows: WriteupMarketRow[];
}

export type WriteupBlock =
	| WriteupPart
	| WriteupTopic
	| WriteupSummary
	| WriteupRented
	| WriteupMarkets;

export interface WriteupSheet {
	id: string;
	blocks: WriteupBlock[];
}

export interface WriteupProps {
	/** The sender's wordmark text, e.g. "atelic"; drawn with the orange run. Print only. */
	sender: { name: string; href?: string };
	/** The recipient's logo, lockup right of the sender. Print only. */
	recipient: { logoSrc: string; logoAlt: string };
	preparedFor: string;
	date: string;
	title: string;
	/** One or two sentences under the title: what this is and where it was read from. */
	intro?: ReactNode;
	/** Groups of blocks. They run together on screen and in print. */
	sheets: WriteupSheet[];
	close: {
		signOff: string;
		person: WriteupPerson;
		/** The pointer to the hosted page, on the printed copy only. */
		twin?: { line: string; domain: string; qrSrc: string };
	};
}

const toneIcon = {
	good: CircleCheck,
	bad: CircleX,
	warn: CircleAlert,
} as const;

function Mark({ cell }: { cell: WriteupMark }) {
	if (cell.mark === "none") {
		return (
			<span className="op-mark-cell" data-tone="muted">
				<span className="op-dash" aria-hidden="true" />
				<span className="op-sr-only">{cell.text}</span>
			</span>
		);
	}
	const Icon = toneIcon[cell.mark];
	const visible = cell.show === true;
	return (
		<span className="op-mark-cell" data-tone={cell.mark}>
			<Icon size={17} aria-hidden="true" />
			<span className={visible ? undefined : "op-sr-only"}>{cell.text}</span>
		</span>
	);
}

/** A star rating as a table cell: the figure beside a star, sorted by the figure. */
export function ratingCell(rating: number, tone?: WriteupTone): WriteupSorted {
	return {
		sort: rating,
		display: (
			<span className="op-rating" data-tone={tone}>
				<Star size={14} aria-hidden="true" />
				{rating.toFixed(1)}
			</span>
		),
	};
}

const markRank = { good: 3, warn: 2, bad: 1, none: 0 } as const;

/** A block's own heading, its one line lead, the block, and a closing note. */
function Block({
	className,
	block,
	children,
}: {
	className: string;
	block: BlockBase;
	children: ReactNode;
}) {
	return (
		<div className={`op-block ${className}`}>
			{(block.title || block.lead) && (
				<div className="op-block-head">
					{block.title && <h4>{block.title}</h4>}
					{block.lead && <p>{block.lead}</p>}
				</div>
			)}
			{children}
			{block.note && <p className="op-note">{block.note}</p>}
		</div>
	);
}

function Table({ block }: { block: WriteupTable }) {
	const rows = block.rows.map((row) => ({
		tone: row.tone,
		cells: row.cells.map((cell) =>
			isMark(cell)
				? { display: <Mark cell={cell} />, sort: cell.sort ?? markRank[cell.mark] }
				: cell,
		),
	}));
	return (
		<Block className="op-table" block={block}>
			<DataTable columns={block.columns} rows={rows} defaultSort={block.sort} />
		</Block>
	);
}

function Shot({ shot }: { shot: WriteupShot }) {
	return (
		<figure className="op-shot">
			{shot.href ? (
				<a href={shot.href} {...newTabProps(shot.href, true)}>
					<img src={shot.src} alt={shot.alt} loading="lazy" />
				</a>
			) : (
				<span className="op-shot-frame">
					<img src={shot.src} alt={shot.alt} loading="lazy" />
				</span>
			)}
			<figcaption>{shot.caption}</figcaption>
		</figure>
	);
}

function Findings({ block, brief }: { block: WriteupFindings; brief?: string }) {
	const hasShots = Boolean(block.shot || brief);
	return (
		<div className={`op-block op-findings${hasShots ? " has-shots" : ""}`}>
			<div className="op-findings-list">
				{block.items.map((item) => (
					<Callout
						key={item.lead}
						tone={item.tone ?? (item.win ? "good" : "warn")}
						title={item.lead}
						variant={item.box ? "box" : "plain"}
					>
						{item.body}
					</Callout>
				))}
			</div>
			{hasShots && (
				<div className="op-shots">
					{block.shot ? (
						<>
							<Shot shot={block.shot} />
							{block.shot2 && <Shot shot={block.shot2} />}
						</>
					) : (
						<figure className="op-shot">
							<span className="op-shot-brief">{brief}</span>
						</figure>
					)}
				</div>
			)}
		</div>
	);
}

function Shots({ block }: { block: WriteupShots }) {
	return (
		<Block className="op-shots-block" block={block}>
			<div className="op-shots-row" data-count={Math.min(block.shots.length, 3)}>
				{block.shots.map((shot) => (
					<Shot shot={shot} key={shot.src} />
				))}
			</div>
		</Block>
	);
}

function More({ block }: { block: WriteupMore }) {
	return (
		<Collapsible className="op-block op-more" label={block.label} summary={block.summary}>
			<div className="op-more-body">
				{block.blocks.map((inner, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: blocks are static content in a fixed order
					<TopicBlock block={inner} key={i} />
				))}
			</div>
		</Collapsible>
	);
}

function TopicBlock({ block }: { block: WriteupTopicBlock }) {
	switch (block.kind) {
		case "checks":
			return (
				<Block className="op-checks" block={block}>
					<Checklist items={block.items} />
				</Block>
			);
		case "table":
			return <Table block={block} />;
		case "bar":
			return (
				<Block className="op-bar" block={block}>
					<StackedBar segments={block.segments} />
				</Block>
			);
		case "scale":
			return (
				<Block className="op-scale" block={block}>
					<ThresholdScale
						max={block.max}
						zones={block.zones}
						ticks={block.ticks}
						readings={block.readings}
					/>
				</Block>
			);
		case "stats":
			return (
				<Block className="op-stats" block={block}>
					<StatRow stats={block.items} />
				</Block>
			);
		case "columns":
			return (
				<Block className="op-columns" block={block}>
					<ColumnChart groups={block.groups} legend={block.legend} />
				</Block>
			);
		case "shots":
			return <Shots block={block} />;
		case "more":
			return <More block={block} />;
		default:
			return <Findings block={block} />;
	}
}

function Topic({ topic }: { topic: WriteupTopic }) {
	const legacy: WriteupFindings | null = topic.bullets
		? { kind: "findings", items: topic.bullets, shot: topic.shot, shot2: topic.shot2 }
		: null;
	const brief = topic.noShot || topic.shot ? undefined : (topic.shotBrief ?? "Screenshot");
	return (
		<section className="op-topic" id={topic.id}>
			<header className="op-topic-head">
				<div>
					<h3>
						{topic.href ? (
							<a href={topic.href} {...newTabProps(topic.href, true)}>
								{topic.title}
								<ArrowUpRight
									size={16}
									role="img"
									aria-label={topic.hrefLabel ?? "Opens in a new tab"}
								/>
							</a>
						) : (
							topic.title
						)}
					</h3>
					<p className="op-def">{topic.oneLiner}</p>
					{topic.grade && topic.why && (
						<p className="op-why">
							<b>{`Why ${gradeLabel[topic.grade]}:`}</b> {topic.why}
						</p>
					)}
				</div>
				{topic.grade && <GradeChip grade={topic.grade} />}
			</header>
			<div className="op-blocks">
				{topic.blocks?.map((block, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: blocks are static content in a fixed order
					<TopicBlock block={block} key={i} />
				))}
				{legacy && <Findings block={legacy} brief={brief} />}
			</div>
			{topic.sources && topic.sources.length > 0 && (
				<footer className="op-sources">
					<span className="op-sources-label">{topic.sourcesLabel ?? "Sources"}</span>
					<ul>
						{topic.sources.map((source) => (
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
			)}
		</section>
	);
}

function Summary({ summary }: { summary: WriteupSummary }) {
	const tiers: Array<{ tier: string; rows: WriteupSummaryRow[] }> = [];
	for (const row of summary.rows) {
		const last = tiers[tiers.length - 1];
		if (last && last.tier === row.tier) last.rows.push(row);
		else tiers.push({ tier: row.tier, rows: [row] });
	}
	const beforeLabel = summary.beforeLabel ?? "Before";
	return (
		<section className="op-ov" id={summary.id}>
			<div className="op-ov-head">
				{summary.title && <h2 className="op-ov-title">{summary.title}</h2>}
				{summary.legend && (
					<ul className="op-legend">
						{summary.legend.map((entry) => (
							<li key={entry.grade}>
								<GradeChip grade={entry.grade} />
								<span>{entry.label}</span>
							</li>
						))}
					</ul>
				)}
			</div>
			<div className="op-ov-card">
				{tiers.map(({ tier, rows }) => (
					<div className="op-ov-tier" key={tier}>
						<div className="op-ov-tier-label">{tier}</div>
						<ul>
							{rows.map((row) => (
								<li className="op-ov-row" key={row.section}>
									<span className="op-ov-grade">
										{row.before && (
											<span className="op-ov-before">
												<span className="op-sr-only">{`${beforeLabel}: ${gradeLabel[row.before]}. `}</span>
												<span aria-hidden="true">
													<GradeChip grade={row.before} />
												</span>
											</span>
										)}
										<span className="op-sr-only">{`Grade ${gradeLabel[row.grade]}: `}</span>
										<span aria-hidden="true">
											<GradeChip grade={row.grade} />
										</span>
									</span>
									<b className="op-ov-name">
										{row.href ? <a href={row.href}>{row.section}</a> : row.section}
									</b>
									<span className="op-ov-read">{row.read}</span>
									{row.href && <ChevronRight className="op-ov-go" size={18} aria-hidden="true" />}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</section>
	);
}

function Markets({ markets }: { markets: WriteupMarkets }) {
	return (
		<section className="op-topic op-markets">
			<header className="op-topic-head">
				<div>
					<h3>{markets.title}</h3>
					{markets.lead && <p className="op-def">{markets.lead}</p>}
				</div>
			</header>
			<table className="op-markets-table">
				<thead>
					<tr>
						<th scope="col" className="op-markets-market">
							<span className="op-sr-only">Market</span>
						</th>
						{markets.columns.map((column) => (
							<th scope="col" className="op-markets-col" key={column}>
								{column}
							</th>
						))}
						<th scope="col" className="op-markets-read">
							<span className="op-sr-only">Read</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{markets.rows.map((row) => (
						<tr key={row.market}>
							<th scope="row" className="op-markets-market">
								{row.market}
								{row.place && <span className="op-markets-place">{row.place}</span>}
							</th>
							{markets.columns.map((column, i) => {
								const grade = row.grades[i] ?? null;
								return (
									<td className="op-markets-grade" key={column}>
										<span className="op-markets-label" aria-hidden="true">
											{column}
										</span>
										{grade ? (
											<>
												<span className="op-sr-only">{`${column}, grade ${gradeLabel[grade]}`}</span>
												<span aria-hidden="true">
													<GradeChip grade={grade} />
												</span>
											</>
										) : (
											<>
												<span className="op-sr-only">{`${column}, not read`}</span>
												<span className="op-dash" aria-hidden="true" />
											</>
										)}
									</td>
								);
							})}
							<td className="op-markets-read">{row.read}</td>
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
}

function Rented({ rented }: { rented: WriteupRented }) {
	return (
		<p className="op-rented">
			<span className="op-rented-label">{rented.label ?? "Rented"}</span>
			<span className="op-rented-text">{rented.text}</span>
		</p>
	);
}

function Part({ part }: { part: WriteupPart }) {
	return (
		<div className="op-part" id={part.id}>
			<h2>{part.title}</h2>
			<p>{part.lead}</p>
		</div>
	);
}

export function Writeup({
	sender,
	recipient,
	preparedFor,
	date,
	title,
	intro,
	sheets,
	close,
}: WriteupProps) {
	return (
		<div className="op">
			<div className="op-doc">
				<header className="op-head">
					<div className="op-top">
						<span className="op-mark">
							{sender.href ? <a href={sender.href}>{sender.name}</a> : sender.name}
							<span className="op-run" aria-hidden="true" />
						</span>
						<span className="op-x" aria-hidden="true">
							×
						</span>
						<img className="op-recipient" src={recipient.logoSrc} alt={recipient.logoAlt} />
					</div>
					<p className="op-meta">
						Prepared for <b>{preparedFor}</b>
						<span className="op-meta-sep" aria-hidden="true">
							{" · "}
						</span>
						<span className="op-meta-date">{date}</span>
					</p>
					<h1>{title}</h1>
					{intro && <p className="op-intro">{intro}</p>}
				</header>
				{sheets.map((sheet) => (
					<div className="op-sheet" id={sheet.id} key={sheet.id}>
						{sheet.blocks.map((block) =>
							block.kind === "part" ? (
								<Part key={block.title} part={block} />
							) : block.kind === "summary" ? (
								<Summary key="summary" summary={block} />
							) : block.kind === "rented" ? (
								<Rented key="rented" rented={block} />
							) : block.kind === "markets" ? (
								<Markets key={`markets-${block.title}`} markets={block} />
							) : (
								<Topic key={block.id} topic={block} />
							),
						)}
					</div>
				))}
				<footer className="op-close">
					<SignOff signOff={close.signOff} person={close.person} />
					{close.twin && (
						<div className="op-twin">
							<div className="op-twin-text">
								{close.twin.line}
								<b>{close.twin.domain}</b>
							</div>
							<img
								className="op-qr"
								src={close.twin.qrSrc}
								alt={`QR code for ${close.twin.domain}`}
							/>
						</div>
					)}
				</footer>
			</div>
		</div>
	);
}
