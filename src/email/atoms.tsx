import type { ReactNode } from "react";
import { eyebrowStyle, tableReset, useEmailTheme } from "./theme";

/*
 * The atoms of the runner email, ported one to one from the atoms section of
 * homebase `runners/lib/email.jq`. Every layout is a table and every style is
 * inline, because Gmail strips a style block and ignores media queries on some
 * accounts. Where the jq takes a pre rendered html string the React prop is
 * `children` or a ReactNode; where the jq escapes a string argument the prop
 * is a plain string and React does the escaping.
 */

export type EyebrowProps = {
	text: string;
	/** Reads as a heading on a phone: larger, bold, in ink rather than faint. */
	strong?: boolean;
};

/** A section label between cards. */
export function Eyebrow({ text, strong = false }: EyebrowProps) {
	const { palette, fonts } = useEmailTheme();
	const look = strong
		? {
				...eyebrowStyle(fonts),
				fontSize: "15px",
				fontWeight: "700",
				letterSpacing: "0.06em",
				color: palette.ink,
			}
		: { ...eyebrowStyle(fonts), color: palette.faint };
	return (
		<tr>
			<td style={{ padding: "36px 8px 12px", ...look }}>{text}</td>
		</tr>
	);
}

export type CardProps = { children?: ReactNode };

/** A card: paper on a hairline, rows inside. */
export function Card({ children }: CardProps) {
	const { palette } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					background: palette.paper,
					border: `1px solid ${palette.line}`,
					borderRadius: "14px",
					padding: "0",
				}}
			>
				<table {...tableReset} width="100%">
					<tbody>{children}</tbody>
				</table>
			</td>
		</tr>
	);
}

export type FoldProps = { summary: string; children?: ReactNode };

/** A small disclosure inside a row: "+ what they do". */
export function Fold({ summary, children }: FoldProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<details style={{ marginTop: "12px" }}>
			<summary
				style={{
					fontFamily: fonts.mono,
					fontSize: "12px",
					color: palette.faint,
					cursor: "pointer",
				}}
			>
				{"+ "}
				{summary}
			</summary>
			<div
				style={{
					fontSize: "14px",
					lineHeight: "1.55",
					color: palette.dim,
					marginTop: "8px",
				}}
			>
				{children}
			</div>
		</details>
	);
}

export type BigFoldProps = { summary: string; count?: ReactNode; children?: ReactNode };

/** A card level disclosure: a bold summary with an optional faint count beside it. */
export function BigFold({ summary, count, children }: BigFoldProps) {
	const { palette, fonts } = useEmailTheme();
	const hasCount = count !== undefined && count !== null && count !== "";
	return (
		<details>
			<summary
				style={{
					fontSize: "15px",
					fontWeight: "600",
					color: palette.ink,
					cursor: "pointer",
				}}
			>
				<span style={{ fontFamily: fonts.mono, color: palette.faint }}>+</span> {summary}
				{hasCount ? (
					<>
						{" "}
						<span
							style={{
								fontFamily: fonts.mono,
								fontSize: "12px",
								fontWeight: "400",
								color: palette.faint,
							}}
						>
							{count}
						</span>
					</>
				) : null}
			</summary>
			{children}
		</details>
	);
}

export type TitleLineProps = { name: string; right: string };

/** A name on the left and the one value that matters on the right, in the accent. */
export function TitleLine({ name, right }: TitleLineProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<table {...tableReset} width="100%">
			<tbody>
				<tr>
					<td
						style={{
							fontSize: "17px",
							fontWeight: "600",
							letterSpacing: "-0.02em",
							color: palette.ink,
							lineHeight: "1.2",
						}}
					>
						{name}
					</td>
					<td
						align="right"
						style={{
							fontFamily: fonts.mono,
							fontSize: "12px",
							color: palette.accent,
							whiteSpace: "nowrap",
							paddingLeft: "12px",
						}}
					>
						{right}
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export type ItemProps = {
	name: string;
	right: string;
	/** Facts joined by a middle dot. Null and empty parts drop, an empty list still renders the row. */
	subparts: (string | null)[];
	body?: string;
	foldLabel?: string;
	foldBody?: string;
	linkText?: string;
	url?: string;
	/** Drops the bottom hairline so the card closes clean. */
	last: boolean;
};

/**
 * The workhorse row: title line, a dim subline of facts joined by middots, a
 * body sentence or two, an optional fold, an optional link.
 */
export function Item({
	name,
	right,
	subparts,
	body,
	foldLabel,
	foldBody,
	linkText,
	url,
	last,
}: ItemProps) {
	const { palette, fonts } = useEmailTheme();
	const parts = subparts.filter((p) => p !== null && p !== "");
	return (
		<tr>
			<td
				style={{
					padding: `22px 24px ${last ? "22px" : "20px"}`,
					fontFamily: fonts.sans,
					...(last ? {} : { borderBottom: `1px solid ${palette.line}` }),
				}}
			>
				<TitleLine name={name} right={right} />
				{subparts.length > 0 ? (
					<div style={{ fontSize: "14px", color: palette.dim, marginTop: "3px" }}>
						{parts.join(" · ")}
					</div>
				) : null}
				{body ? (
					<div
						style={{
							fontSize: "14px",
							lineHeight: "1.55",
							color: palette.ink,
							marginTop: "12px",
						}}
					>
						{body}
					</div>
				) : null}
				{foldBody ? <Fold summary={foldLabel ?? ""}>{foldBody}</Fold> : null}
				{url ? (
					<div style={{ marginTop: "14px" }}>
						<a
							href={url}
							style={{
								fontSize: "14px",
								fontWeight: "500",
								color: palette.ink,
								textDecoration: "none",
								borderBottom: `1px solid ${palette.accent}`,
							}}
						>
							{linkText ?? ""}
							{" →"}
						</a>
					</div>
				) : null}
			</td>
		</tr>
	);
}

export type NoteProps = { eyebrowText: string; text: string; accented: boolean; last: boolean };

/** A short note inside a card under a small eyebrow; accented puts the eyebrow in orange. */
export function Note({ eyebrowText, text, accented, last }: NoteProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: `18px 24px ${last ? "20px" : "4px"}`,
					fontFamily: fonts.sans,
					fontSize: "14px",
					lineHeight: "1.55",
					color: accented ? palette.ink : palette.dim,
				}}
			>
				<span style={{ ...eyebrowStyle(fonts), color: accented ? palette.accent : palette.faint }}>
					{eyebrowText}
				</span>
				<br />
				{text}
			</td>
		</tr>
	);
}

export type EmptyRowProps = { text: string };

/** One line of dim text filling a card row: the empty state. */
export function EmptyRow({ text }: EmptyRowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: "22px 24px",
					fontFamily: fonts.sans,
					fontSize: "14px",
					color: palette.dim,
				}}
			>
				{text}
			</td>
		</tr>
	);
}

export type StatProps = { n: string | number; caption?: ReactNode };

/** A big number over a small caption; three of these sit in a title card. */
export function Stat({ n, caption }: StatProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<td style={{ padding: "10px 0", borderTop: `1px solid ${palette.line}` }}>
			<span
				style={{
					fontFamily: fonts.sans,
					fontSize: "22px",
					fontWeight: "600",
					letterSpacing: "-0.02em",
					color: palette.ink,
				}}
			>
				{String(n)}
			</span>
			<br />
			{caption}
		</td>
	);
}

export type StatsRowProps = { children?: ReactNode };

/** The row of Stat cells inside a title card. */
export function StatsRow({ children }: StatsRowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "20px 26px 24px" }}>
				<table
					{...tableReset}
					width="100%"
					style={{ fontFamily: fonts.mono, fontSize: "12px", color: palette.faint }}
				>
					<tbody>
						<tr>{children}</tr>
					</tbody>
				</table>
			</td>
		</tr>
	);
}

export type ListProps = { fontSize: string; children?: ReactNode };

/** A hairline list inside a fold: one ListRow per line. */
export function List({ fontSize, children }: ListProps) {
	const { palette } = useEmailTheme();
	return (
		<table
			{...tableReset}
			width="100%"
			style={{
				marginTop: "12px",
				fontSize,
				lineHeight: "1.5",
				color: palette.dim,
			}}
		>
			<tbody>{children}</tbody>
		</table>
	);
}

export type ListRowProps = { children?: ReactNode };

export function ListRow({ children }: ListRowProps) {
	const { palette } = useEmailTheme();
	return (
		<tr>
			<td style={{ padding: "6px 0", borderTop: `1px solid ${palette.hair}` }}>{children}</td>
		</tr>
	);
}

export type LeadRowProps = { lead: string; rest: string };

/** A list row that opens on a bolded lead. */
export function LeadRow({ lead, rest }: LeadRowProps) {
	const { palette } = useEmailTheme();
	return (
		<ListRow>
			<b style={{ color: palette.ink, fontWeight: "500" }}>{lead}</b> {rest}
		</ListRow>
	);
}

export type RowProps = { last: boolean; children?: ReactNode };

/** A card row holding any block the pieces above built, with the card's own padding and hairline. */
export function Row({ last, children }: RowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: `18px 24px ${last ? "22px" : "18px"}`,
					fontFamily: fonts.sans,
					...(last ? {} : { borderBottom: `1px solid ${palette.line}` }),
				}}
			>
				{children}
			</td>
		</tr>
	);
}

export type FoldRowProps = { last: boolean; children?: ReactNode };

/** A card row that holds a card level fold. */
export function FoldRow({ last, children }: FoldRowProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<tr>
			<td
				style={{
					padding: last ? "18px 24px 20px" : "18px 24px",
					fontFamily: fonts.sans,
					...(last ? {} : { borderBottom: `1px solid ${palette.line}` }),
				}}
			>
				{children}
			</td>
		</tr>
	);
}

export type MonoTableProps = { headers: string[]; rows: string[][] };

/**
 * A compact monospace table for data the reader copies rather than reads.
 */
export function MonoTable({ headers, rows }: MonoTableProps) {
	const { palette, fonts } = useEmailTheme();
	return (
		<table
			{...tableReset}
			width="100%"
			style={{
				marginTop: "12px",
				fontFamily: fonts.mono,
				fontSize: "11px",
				lineHeight: "1.5",
				color: palette.dim,
			}}
		>
			<tbody>
				<tr>
					{headers.map((label, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: a header's position is its identity
						<td key={i} style={{ padding: "4px 6px", color: palette.faint }}>
							{label}
						</td>
					))}
				</tr>
				{rows.map((cells, r) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: a row's position is its identity
					<tr key={r}>
						{cells.map((cell, c) => (
							<td
								// biome-ignore lint/suspicious/noArrayIndexKey: a cell's position is its identity
								key={c}
								style={{
									padding: "4px 6px",
									borderTop: `1px solid ${palette.hair}`,
									verticalAlign: "top",
								}}
							>
								{cell}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
