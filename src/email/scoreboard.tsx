import { type CSSProperties, Fragment, type ReactNode } from "react";
import { atelicPalette, type Palette } from "../tokens";
import {
	type RecordAsideTone,
	type RecordBadgeTone,
	type RecordStackItem,
	type RecordTimeline,
	recordBadges,
	recordTimelineSummary,
} from "./text";
import { accentInk, eyebrowStyle, tableReset, useEmailTheme, wrapLong } from "./theme";

/*
 * The scoreboard pieces, ported one to one from the scoreboard section of
 * homebase `runners/lib/email.jq`. The accent marks a shortfall and nothing
 * else a row says; where the mark is words it is set in the accent's ink
 * (`accentInk`), since the bright accent fails as small words.
 */

export type BarProps = {
	logged: number;
	target: number;
	/**
	 * What a screen reader hears for the bar, which has no words of its own.
	 * Defaults to "<logged> of <target>". `false` draws it as decoration,
	 * for a bar beside a count that already says it (as in `TargetRow`).
	 */
	label?: string | false;
};

/**
 * A segmented bar, one segment per unit of the target, filled up to what was
 * logged. Wider segments for small targets so three reads as three.
 */
export function Bar({ logged, target, label }: BarProps) {
	const { palette } = useEmailTheme();
	const w = target <= 3 ? "18" : "10";
	const filled = Math.min(logged, target);
	const name = label === false ? null : (label ?? `${logged} of ${target}`);
	return (
		<table {...tableReset} {...(name === null ? {} : { role: "img", "aria-label": name })}>
			<tbody>
				<tr>
					{Array.from({ length: target }, (_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: a segment's position is its identity
						<Fragment key={i}>
							{i > 0 ? (
								<td width="3" style={{ fontSize: "0" }}>
									{"\u00a0"}
								</td>
							) : null}
							<td
								width={w}
								height="6"
								style={{
									background: i < filled ? palette.ink : palette.line,
									fontSize: "0",
									lineHeight: "0",
								}}
							>
								{"\u00a0"}
							</td>
						</Fragment>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export type GroupRowProps = { text: string; first: boolean };

/** A small eyebrow row spanning the scoreboard: a group's name. */
export function GroupRow({ text, first }: GroupRowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				colSpan={4}
				style={{
					padding: `${first ? "0" : "18px"} 0 6px`,
					...eyebrowStyle(fonts),
					color: accentInk(palette),
					borderBottom: `1px solid ${palette.line}`,
				}}
			>
				{text}
			</td>
		</tr>
	);
}

export type TargetRowProps = {
	text: string;
	logged: number;
	/** Null is a count with nothing to measure it against. */
	target: number | null;
	note: string;
	last: boolean;
};

/** One target: label, logged over target (accent when short), the bar, a note. */
export function TargetRow({ text, logged, target, note, last }: TargetRowProps) {
	const { palette, fonts } = useEmailTheme();
	const rule = last ? {} : { borderBottom: `1px solid ${palette.hair}` };
	const short = target !== null && logged < target;
	return (
		<tr>
			<td style={{ padding: "10px 0", ...rule, fontWeight: "500" }}>{text}</td>
			<td
				width="52"
				align="right"
				style={{
					padding: "10px 0",
					...rule,
					fontFamily: fonts.mono,
					fontSize: "13px",
					color: short ? accentInk(palette) : palette.ink,
					whiteSpace: "nowrap",
				}}
			>
				{String(logged)}
				{target === null ? null : ` / ${target}`}
			</td>
			<td width="84" style={{ padding: "10px 0 10px 16px", ...rule }}>
				{target === null || target === 0 ? null : (
					<Bar logged={logged} target={target} label={false} />
				)}
			</td>
			<td
				align="right"
				style={{ padding: "10px 0", ...rule, fontSize: "13px", color: palette.faint }}
			>
				{note}
			</td>
		</tr>
	);
}

export type ScoreboardProps = { children?: ReactNode };

/** The card row the GroupRow and TargetRow rows sit in. */
export function Scoreboard({ children }: ScoreboardProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "22px 26px 0" }}>
				<table
					{...tableReset}
					width="100%"
					style={{ fontFamily: fonts.sans, fontSize: "14px", color: palette.ink }}
				>
					<tbody>{children}</tbody>
				</table>
			</td>
		</tr>
	);
}

export type ReadBlockProps = { text: string; divider: boolean };

/** A model written read at the top of a section card. */
export function ReadBlock({ text, divider }: ReadBlockProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: "22px 24px 20px",
					fontFamily: fonts.sans,
					...wrapLong,
					...(divider ? { borderBottom: `1px solid ${palette.line}` } : {}),
				}}
			>
				<span style={{ ...eyebrowStyle(fonts), color: accentInk(palette) }}>The Read</span>
				<div
					style={{
						fontSize: "15px",
						lineHeight: "1.6",
						color: palette.ink,
						marginTop: "6px",
					}}
				>
					{text}
				</div>
			</td>
		</tr>
	);
}

export type SubEyebrowProps = { text: string };

/** A faint eyebrow inside a card, over a block. */
export function SubEyebrow({ text }: SubEyebrowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "18px 24px 6px", ...eyebrowStyle(fonts), color: palette.faint }}>
				{text}
			</td>
		</tr>
	);
}

export type BadgeProps = {
	letter: string;
	/**
	 * What the letter stands for ("Social"), read by a screen reader in the
	 * letter's place and shown as a tooltip. Without it a reader hears the
	 * letter alone.
	 */
	label?: string;
};

/**
 * A single letter in a hairline box after the word it tags (S for social),
 * letter and box in the accent's ink: the bright accent fails as words.
 */
export function Badge({ letter, label }: BadgeProps) {
	const { palette, fonts } = useEmailTheme();
	const ink = accentInk(palette);
	return (
		<span
			{...(label ? { role: "img", "aria-label": label, title: label } : {})}
			style={{
				display: "inline-block",
				fontFamily: fonts.mono,
				fontSize: "9px",
				lineHeight: "12px",
				width: "12px",
				textAlign: "center",
				border: `1px solid ${ink}`,
				borderRadius: "3px",
				color: ink,
				verticalAlign: "1px",
				marginLeft: "3px",
			}}
		>
			{letter}
		</span>
	);
}

export type DayEntry = {
	name: string;
	strong?: boolean;
	badge?: string;
	/** What the badge's letter stands for; see `Badge`'s `label`. */
	badgeLabel?: string;
};
export type Day = { label: string; entries: DayEntry[] };
export type DayStripProps = { days: Day[]; last: boolean };

/** Monday to Sunday, entries top aligned. */
export function DayStrip({ days, last }: DayStripProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: "0 24px 18px",
					...(last ? {} : { borderBottom: `1px solid ${palette.line}` }),
				}}
			>
				<table
					{...tableReset}
					width="100%"
					style={{
						fontFamily: fonts.sans,
						fontSize: "12px",
						lineHeight: "1.5",
						color: palette.dim,
						textAlign: "center",
					}}
				>
					<tbody>
						<tr style={{ fontFamily: fonts.mono, fontSize: "11px", color: palette.faint }}>
							{days.map((day, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: a day's position is its identity
								<td key={i} style={{ padding: "6px 2px" }}>
									{day.label}
								</td>
							))}
						</tr>
						<tr>
							{days.map((day, i) => (
								<td
									// biome-ignore lint/suspicious/noArrayIndexKey: a day's position is its identity
									key={i}
									width="14%"
									style={{
										padding: "8px 2px",
										borderTop: `2px solid ${palette.ink}`,
										verticalAlign: "top",
										...wrapLong,
									}}
								>
									{day.entries.map((entry, e) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: an entry's position is its identity
										<Fragment key={e}>
											{e > 0 ? <br /> : null}
											{entry.strong ? (
												<b style={{ color: palette.ink, fontWeight: "600" }}>
													{entry.name}
													{entry.badge ? (
														<Badge letter={entry.badge} label={entry.badgeLabel} />
													) : null}
												</b>
											) : (
												<>
													{entry.name}
													{entry.badge ? (
														<Badge letter={entry.badge} label={entry.badgeLabel} />
													) : null}
												</>
											)}
										</Fragment>
									))}
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
	);
}

type RecordBadgeProps = { text: string; tone?: RecordBadgeTone };

/**
 * The pill on a record's title line. Faint is the stage word as it always
 * was, dim text in a hairline box; ink and accent are the Company Cards
 * pills (2026-09-29), bold, drawn in their own color on a heavier border:
 * the next touch in ink, New in the accent's ink.
 */
function RecordBadge({ text, tone = "faint" }: RecordBadgeProps) {
	const { palette, fonts } = useEmailTheme();
	const color = tone === "ink" ? palette.ink : tone === "accent" ? accentInk(palette) : palette.dim;
	return (
		<span
			style={{
				display: "inline-block",
				fontFamily: fonts.mono,
				fontSize: "10px",
				lineHeight: "14px",
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				fontWeight: tone === "faint" ? "normal" : "bold",
				padding: "0 6px",
				border: tone === "faint" ? `1px solid ${palette.line}` : `1.5px solid ${color}`,
				borderRadius: "3px",
				color,
			}}
		>
			{text}
		</span>
	);
}

export type { RecordStackItem };

/** The default for a palette written before `warm` existed: the cooling tone between `up` and the accent. */
const WARM = "#966319";

function asideColor(tone: RecordAsideTone | undefined, palette: Palette): string {
	if (tone === "up") return palette.up ?? atelicPalette.up ?? palette.ink;
	if (tone === "warm") return palette.warm ?? WARM;
	if (tone === "accent") return accentInk(palette);
	return palette.faint;
}

export type RecordTimelineStripProps = {
	timeline: RecordTimeline;
	/**
	 * What a screen reader hears for the drawn strip. Defaults to
	 * `recordTimelineSummary` of the timeline ("Last 30 days: 2 sends, the
	 * latest 3 days ago; 1 open, today").
	 */
	label?: string;
};

/**
 * A record's recent days on one line, today at the right edge: an ink square
 * on each day a send went out, an accent dot on each day an open is known,
 * the two stacked when they share a day, all standing on a hairline with a
 * tick for today. One cell per marked day and one per run of empty days
 * between them, so a record with three marks is seven cells rather than
 * thirty: Gmail clips a message past about 100 KB and a stage list carries
 * dozens of records. Nothing is positioned, so it survives every mail client
 * (Company Cards IA, 2026-09-29).
 */
export function RecordTimelineStrip({ timeline, label }: RecordTimelineStripProps) {
	const { palette, fonts } = useEmailTheme();
	const days = Math.max(1, Math.round(timeline.days));
	const touch = new Set(timeline.touches.map((d) => Math.round(d)));
	const open = new Set(timeline.opens.map((d) => Math.round(d)));
	const cells: { ago: number; span: number; sent: boolean; opened: boolean }[] = [];
	for (let ago = days - 1; ago >= 0; ago -= 1) {
		const sent = touch.has(ago);
		const opened = open.has(ago);
		const last = cells[cells.length - 1];
		if (!sent && !opened && last && !last.sent && !last.opened) last.span += 1;
		else cells.push({ ago, span: 1, sent, opened });
	}
	const unit = 100 / days;
	// The axis under the strip: how far back it reaches on the left, today on
	// the right (Forni, 2026-09-29, asking whether it was a thirty day strip).
	const axisStyle: CSSProperties = {
		fontFamily: fonts.mono,
		fontSize: "9px",
		lineHeight: "12px",
		color: palette.faint,
		paddingTop: "2px",
	};
	return (
		<table
			{...tableReset}
			role="img"
			aria-label={label ?? recordTimelineSummary(timeline)}
			width="100%"
			style={{
				marginTop: "8px",
				textAlign: "center",
			}}
		>
			<tbody>
				<tr>
					{cells.map((cell, i) => (
						<td
							key={cell.ago}
							valign="bottom"
							colSpan={cell.span}
							width={`${Math.round(unit * cell.span * 100) / 100}%`}
							height="14"
							style={{
								borderBottom: `1px solid ${palette.line}`,
								...(i === cells.length - 1 ? { borderRight: `1.5px solid ${palette.ink}` } : {}),
							}}
						>
							{cell.sent ? (
								<div
									style={{ width: "8px", height: "8px", margin: "0 auto", background: palette.ink }}
								/>
							) : null}
							{cell.opened ? (
								<div
									style={{
										width: "5px",
										height: "5px",
										margin: `${cell.sent ? "2px" : "0"} auto 0`,
										borderRadius: "50%",
										background: palette.accent,
									}}
								/>
							) : null}
						</td>
					))}
				</tr>
				<tr>
					<td colSpan={Math.max(1, Math.ceil(days / 2))} align="left" style={axisStyle}>
						{`${days}d`}
					</td>
					<td
						colSpan={Math.max(1, Math.floor(days / 2))}
						align="right"
						style={{ ...axisStyle, textAlign: "right" }}
					>
						today
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export type RecordStackProps = { records: RecordStackItem[] };

/**
 * One record per row, stacked: the title on its own line with its pills
 * beside it, an optional timeline, a mono meta line with an optional aside
 * set right, an optional note under that, an optional callout last. No
 * column cells and no fixed widths, so a name of any length wraps instead of
 * squashing on a phone. A fixed column table is for numbers alone; names go
 * here. The pills, the timeline and the aside are the Company Cards IA
 * (2026-09-29); a record without them renders as it always did.
 */
export function RecordStack({ records }: RecordStackProps) {
	const { palette, fonts } = useEmailTheme();
	const titleStyle: CSSProperties = {
		fontSize: "15px",
		fontWeight: "600",
		lineHeight: "1.35",
		color: palette.ink,
		wordBreak: "break-word",
	};
	const metaStyle: CSSProperties = {
		fontFamily: fonts.mono,
		fontSize: "12px",
		lineHeight: "1.5",
		color: palette.faint,
	};
	return (
		<table {...tableReset} width="100%" style={{ fontFamily: fonts.sans, color: palette.ink }}>
			<tbody>
				{records.map((record, i) => {
					const last = i === records.length - 1;
					const meta = record.meta.filter((m) => m !== "");
					const badges = recordBadges(record);
					const title = record.url ? (
						<a
							href={record.url}
							style={{
								color: palette.ink,
								textDecoration: "none",
								borderBottom: `1px solid ${palette.accent}`,
							}}
						>
							{record.title}
						</a>
					) : (
						record.title
					);
					const aside = record.aside ? (
						<>
							{record.aside.text}
							{record.aside.strong ? (
								<>
									{" "}
									<b style={{ color: asideColor(record.aside.tone, palette) }}>
										{record.aside.strong}
									</b>
								</>
							) : null}
						</>
					) : null;
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: a record's position is its identity
						<tr key={i}>
							<td
								style={{
									padding: `${i === 0 ? "0" : "12px"} 0 ${last ? "0" : "12px"}`,
									verticalAlign: "top",
									...(last ? {} : { borderBottom: `1px solid ${palette.line}` }),
								}}
							>
								{badges.length > 0 ? (
									<table {...tableReset} width="100%" style={titleStyle}>
										<tbody>
											<tr>
												<td valign="top">{title}</td>
												<td
													align="right"
													valign="top"
													style={{
														textAlign: "right",
														whiteSpace: "nowrap",
														paddingLeft: "12px",
														paddingTop: "2px",
													}}
												>
													{badges.map((badge, j) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: a pill's position is its identity
														<Fragment key={j}>
															{j === 0 ? null : " "}
															<RecordBadge text={badge.text} tone={badge.tone} />
														</Fragment>
													))}
												</td>
											</tr>
										</tbody>
									</table>
								) : (
									<div style={titleStyle}>{title}</div>
								)}
								{record.timeline ? <RecordTimelineStrip timeline={record.timeline} /> : null}
								{meta.length > 0 || aside ? (
									aside ? (
										<table {...tableReset} width="100%" style={{ ...metaStyle, marginTop: "4px" }}>
											<tbody>
												<tr>
													<td>{meta.join(" · ")}</td>
													<td align="right" style={{ whiteSpace: "nowrap", paddingLeft: "12px" }}>
														{aside}
													</td>
												</tr>
											</tbody>
										</table>
									) : (
										<div style={{ ...metaStyle, marginTop: "4px" }}>{meta.join(" · ")}</div>
									)
								) : null}
								{record.note ? (
									<div
										style={{
											fontSize: "13px",
											lineHeight: "1.5",
											color: palette.dim,
											marginTop: "6px",
										}}
									>
										{record.note}
									</div>
								) : null}
								{record.callout ? (
									<div
										style={{
											marginTop: "10px",
											paddingLeft: "10px",
											borderLeft: `2px solid ${palette.accent}`,
											fontFamily: fonts.sans,
											fontSize: "13px",
											lineHeight: "1.5",
											color: palette.ink,
										}}
									>
										<span style={{ ...eyebrowStyle(fonts), color: accentInk(palette) }}>
											{record.callout.eyebrow}
										</span>
										<br />
										{record.callout.text}
									</div>
								) : null}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

export type RecordsColumn = {
	label: string;
	/** Aligns the column right and keeps its cells on one line. */
	right?: boolean;
	/**
	 * Pixels at the desktop column's width. A width on any column fixes the
	 * table's layout so sibling tables share a grid; each is drawn as its
	 * share of the table (see `RECORDS_WIDTH`), so the same grid narrows on
	 * a phone instead of holding the table open past it.
	 */
	width?: number;
	/** Keeps the column even when every row leaves it empty. */
	keep?: boolean;
};

export type RecordsCell = {
	value?: string;
	mono?: boolean;
	muted?: boolean;
	hot?: boolean;
	/** Rendered in place of the value; the one way a cell carries markup. */
	html?: ReactNode;
};

const hasMarkup = (html: ReactNode): boolean => html !== undefined && html !== null && html !== "";

/**
 * The width, in pixels, a records table has inside a card's row on a
 * desktop: the 680 column less the card's two border pixels and the row's
 * 24 pixels a side. A column's pixel width is drawn as its share of this, or
 * of the columns' sum when they ask for more, so at the desktop width every
 * column is the pixels it asked for.
 */
export const RECORDS_WIDTH = 630;

/** A column's pixel width as a percentage of the table, two decimals at most. */
function columnShare(width: number, total: number): string {
	return `${Math.round((width / Math.max(total, RECORDS_WIDTH)) * 10000) / 100}%`;
}

export type RecordsProps = { columns: RecordsColumn[]; rows: RecordsCell[][] };

/**
 * A table with a header row. A column every row leaves empty is dropped unless
 * it says keep, so a table never shows a column of nothing.
 */
export function Records({ columns, rows }: RecordsProps) {
	const { palette, fonts } = useEmailTheme();
	const keep = columns
		.map((_, i) => i)
		.filter(
			(i) =>
				columns[i].keep ||
				rows.some((row) => (row[i]?.value ?? "") !== "" || hasMarkup(row[i]?.html)),
		);
	const fixed = columns.some((c) => c.width !== undefined);
	const total = keep.reduce((sum, i) => sum + (columns[i].width ?? 0), 0);
	// A data table, not a layout one: no presentation role, so the header
	// cells name the column a reader is in.
	const { role: _layout, ...reset } = tableReset;
	return (
		<table
			{...reset}
			width="100%"
			style={{
				...(fixed ? { tableLayout: "fixed" } : {}),
				fontFamily: fonts.sans,
				fontSize: "13px",
				lineHeight: "1.4",
				color: palette.ink,
			}}
		>
			<tbody>
				<tr>
					{keep.map((i) => {
						const c = columns[i];
						const share = c.width !== undefined ? columnShare(c.width, total) : undefined;
						return (
							<th
								key={i}
								scope="col"
								align={c.right ? "right" : "left"}
								{...(share ? { width: share } : {})}
								style={{
									...(share ? { width: share } : {}),
									padding: "0 8px 6px 0",
									fontWeight: "normal",
									fontFamily: fonts.mono,
									fontSize: "10px",
									letterSpacing: "0.1em",
									textTransform: "uppercase",
									color: palette.faint,
									borderBottom: `1px solid ${palette.line}`,
									whiteSpace: "nowrap",
								}}
							>
								{c.label}
							</th>
						);
					})}
				</tr>
				{rows.map((cells, r) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: a row's position is its identity
					<tr key={r}>
						{keep.map((i) => {
							const c = columns[i];
							const cell = cells[i] ?? {};
							const hasHTML = hasMarkup(cell.html);
							return (
								<td
									key={i}
									align={c.right ? "right" : "left"}
									style={{
										padding: "8px 8px 8px 0",
										borderBottom: `1px solid ${r === rows.length - 1 ? palette.line : palette.hair}`,
										...(cell.mono ? { fontFamily: fonts.mono, fontSize: "12px" } : {}),
										color: cell.hot
											? accentInk(palette)
											: cell.muted
												? palette.faint
												: cell.mono
													? palette.dim
													: palette.ink,
										...(c.right ? { whiteSpace: "nowrap" } : wrapLong),
									}}
								>
									{hasHTML ? cell.html : (cell.value ?? "")}
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}
