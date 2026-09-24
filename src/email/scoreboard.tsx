import { type CSSProperties, Fragment, type ReactNode } from "react";
import { atelicPalette, type Palette } from "../tokens";
import type { RecordStackItem } from "./text";
import { eyebrowStyle, tableReset, useEmailTheme } from "./theme";

/*
 * The scoreboard pieces, ported one to one from the scoreboard section of
 * homebase `runners/lib/email.jq`. The accent marks a shortfall and nothing
 * else a row says.
 */

export type BarProps = { logged: number; target: number };

/**
 * A segmented bar, one segment per unit of the target, filled up to what was
 * logged. Wider segments for small targets so three reads as three.
 */
export function Bar({ logged, target }: BarProps) {
	const { palette } = useEmailTheme();
	const w = target <= 3 ? "18" : "10";
	const filled = Math.min(logged, target);
	return (
		<table {...tableReset}>
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
					color: palette.accent,
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
					color: short ? palette.accent : palette.ink,
					whiteSpace: "nowrap",
				}}
			>
				{String(logged)}
				{target === null ? null : ` / ${target}`}
			</td>
			<td width="84" style={{ padding: "10px 0 10px 16px", ...rule }}>
				{target === null || target === 0 ? null : <Bar logged={logged} target={target} />}
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

export type WhatMovedItem = { subject: string; event: string };
export type WhatMovedProps = { items: WhatMovedItem[]; note?: string };

/** The note bar on the cream ground under the scoreboard. */
export function WhatMoved({ items, note }: WhatMovedProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "22px 26px 26px" }}>
				<table
					{...tableReset}
					width="100%"
					style={{ background: palette.ground, borderRadius: "10px" }}
				>
					<tbody>
						<tr>
							<td
								style={{
									padding: "16px 18px",
									fontFamily: fonts.sans,
									fontSize: "14px",
									lineHeight: "1.6",
									color: palette.ink,
								}}
							>
								<span style={{ ...eyebrowStyle(fonts), color: palette.faint }}>What Moved</span>
								<br />
								{items.map((item, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: an item's position is its identity
									<Fragment key={i}>
										<b style={{ fontWeight: "600" }}>{item.subject}</b> {item.event}
										<br />
									</Fragment>
								))}
								{note ? <span style={{ color: palette.dim }}>{note}</span> : null}
							</td>
						</tr>
					</tbody>
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
					...(divider ? { borderBottom: `1px solid ${palette.line}` } : {}),
				}}
			>
				<span style={{ ...eyebrowStyle(fonts), color: palette.accent }}>The Read</span>
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

export type BadgeProps = { letter: string };

/** A single letter in a hairline box after the word it tags (S for social). */
export function Badge({ letter }: BadgeProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<span
			style={{
				display: "inline-block",
				fontFamily: fonts.mono,
				fontSize: "9px",
				lineHeight: "12px",
				width: "12px",
				textAlign: "center",
				border: `1px solid ${palette.accent}`,
				borderRadius: "3px",
				color: palette.accent,
				verticalAlign: "1px",
				marginLeft: "3px",
			}}
		>
			{letter}
		</span>
	);
}

export type DayEntry = { name: string; strong?: boolean; badge?: string };
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
									}}
								>
									{day.entries.map((entry, e) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: an entry's position is its identity
										<Fragment key={e}>
											{e > 0 ? <br /> : null}
											{entry.strong ? (
												<b style={{ color: palette.ink, fontWeight: "600" }}>
													{entry.name}
													{entry.badge ? <Badge letter={entry.badge} /> : null}
												</b>
											) : (
												<>
													{entry.name}
													{entry.badge ? <Badge letter={entry.badge} /> : null}
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

export type StatStripEntry = {
	n: string | number;
	label: string;
	/**
	 * A change beside the number, small under the label: "+3 (12%)". One that
	 * opens on "+" wears the palette's `up`, one that opens on "-" its `down`,
	 * anything else stays muted.
	 */
	delta?: string;
};

/** The color a delta wears, read off its sign. */
export function deltaColor(delta: string, palette: Palette): string {
	if (delta.startsWith("+")) return palette.up ?? atelicPalette.up ?? palette.faint;
	if (delta.startsWith("-") || delta.startsWith("\u2212")) {
		return palette.down ?? atelicPalette.down ?? palette.faint;
	}
	return palette.faint;
}
export type StatStripProps = { stats: StatStripEntry[] };

/**
 * A strip of big numbers over eyebrow labels. Each stat is an inline block
 * cell with a floor on its width inside one centered cell, so six or seven
 * stats flow onto a second row on a phone instead of shrinking to nothing.
 */
export function StatStrip({ stats }: StatStripProps) {
	const { palette, fonts } = useEmailTheme();
	const share = `${Math.floor(100 / Math.max(stats.length, 1))}%`;
	return (
		<table {...tableReset} width="100%">
			<tbody>
				<tr>
					<td align="center" style={{ textAlign: "center" }}>
						{stats.map((entry, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: a stat's position is its identity
								key={i}
								style={{
									display: "inline-block",
									width: share,
									minWidth: "88px",
									boxSizing: "border-box",
									verticalAlign: "top",
									padding: "12px 6px 10px",
									borderTop: `2px solid ${palette.ink}`,
									textAlign: "center",
								}}
							>
								<span
									style={{
										fontFamily: fonts.sans,
										fontSize: "22px",
										fontWeight: "600",
										letterSpacing: "-0.02em",
										color: palette.ink,
									}}
								>
									{String(entry.n)}
								</span>
								<br />
								<span style={{ ...eyebrowStyle(fonts), color: palette.faint }}>{entry.label}</span>
								{entry.delta ? (
									<>
										<br />
										<span
											style={{
												fontFamily: fonts.mono,
												fontSize: "11px",
												color: deltaColor(entry.delta, palette),
											}}
										>
											{entry.delta}
										</span>
									</>
								) : null}
							</div>
						))}
					</td>
				</tr>
			</tbody>
		</table>
	);
}

type RecordBadgeProps = { text: string };

/**
 * A word in a small mono pill on a hairline, the Badge idiom sized for a stage
 * such as "Contacted". Only RecordStack wears it.
 */
function RecordBadge({ text }: RecordBadgeProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<span
			style={{
				display: "inline-block",
				fontFamily: fonts.mono,
				fontSize: "10px",
				lineHeight: "14px",
				letterSpacing: "0.08em",
				textTransform: "uppercase",
				padding: "0 6px",
				border: `1px solid ${palette.line}`,
				borderRadius: "3px",
				color: palette.dim,
				whiteSpace: "nowrap",
			}}
		>
			{text}
		</span>
	);
}

export type { RecordStackItem };
export type RecordStackProps = { records: RecordStackItem[] };

/**
 * One record per row, stacked: the title on its own line, a mono meta line
 * under it, an optional note under that. No column cells and no fixed widths,
 * so a name of any length wraps instead of squashing on a phone. A fixed
 * column table is for numbers alone; names go here.
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
	return (
		<table {...tableReset} width="100%" style={{ fontFamily: fonts.sans, color: palette.ink }}>
			<tbody>
				{records.map((record, i) => {
					const last = i === records.length - 1;
					const meta = record.meta.filter((m) => m !== "");
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
								{record.badge ? (
									<table {...tableReset} width="100%">
										<tbody>
											<tr>
												<td style={{ ...titleStyle, verticalAlign: "top" }}>{title}</td>
												<td
													align="right"
													style={{
														textAlign: "right",
														whiteSpace: "nowrap",
														verticalAlign: "top",
														paddingLeft: "12px",
														paddingTop: "2px",
													}}
												>
													<RecordBadge text={record.badge} />
												</td>
											</tr>
										</tbody>
									</table>
								) : (
									<div style={titleStyle}>{title}</div>
								)}
								{meta.length > 0 ? (
									<div
										style={{
											fontFamily: fonts.mono,
											fontSize: "12px",
											lineHeight: "1.5",
											color: palette.faint,
											marginTop: "4px",
										}}
									>
										{meta.join(" · ")}
									</div>
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
										<span style={{ ...eyebrowStyle(fonts), color: palette.accent }}>
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
	/** Pixels. A width on any column fixes the table's layout so sibling tables share a grid. */
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
	return (
		<table
			{...tableReset}
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
						return (
							<td
								key={i}
								align={c.right ? "right" : "left"}
								{...(c.width !== undefined ? { width: String(c.width) } : {})}
								style={{
									...(c.width !== undefined ? { width: `${c.width}px` } : {}),
									padding: "0 8px 6px 0",
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
							</td>
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
											? palette.accent
											: cell.muted
												? palette.faint
												: cell.mono
													? palette.dim
													: palette.ink,
										...(c.right ? { whiteSpace: "nowrap" } : {}),
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
