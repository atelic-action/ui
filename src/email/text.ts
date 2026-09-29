/*
 * The plain text alternative part, ported one to one from the plain text
 * section of homebase `runners/lib/email.jq`. Every label and number sits in
 * its own padded column or on its own line; nothing is ever concatenated,
 * which is what a mail service's own html to text conversion does to a table.
 *
 * jq counts a string's length in Unicode codepoints, so every width here does
 * too. `.length` on a JavaScript string counts UTF-16 units and would pad an
 * astral character two columns short.
 */

function codepoints(value: string): number {
	return [...value].length;
}

/** jq's ascii_upcase: ASCII letters only, everything else untouched. */
export function asciiUpcase(value: string): string {
	return value.replace(/[a-z]/g, (c) => c.toUpperCase());
}

/** jq's ascii_downcase: ASCII letters only, everything else untouched. */
export function asciiDowncase(value: string): string {
	return value.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

export function spaces(n: number): string {
	return " ".repeat(Math.max(n, 0));
}

/** Pads on the right to a column count. */
export function rpad(value: string, width: number): string {
	return value + spaces(width - codepoints(value));
}

/** Pads on the left to a column count. */
export function lpad(value: string, width: number): string {
	return spaces(width - codepoints(value)) + value;
}

/** The widest a plain text line runs, indent included: two spaces and 66 columns of prose. */
export const textWidth = 68;

/** Prose broken into lines of at most `columns` codepoints, each under `indent`. */
function wrapIndented(text: string, indent: number): string {
	const columns = textWidth - indent;
	const lines = [""];
	for (const word of text.split(" ")) {
		const last = lines[lines.length - 1];
		if (codepoints(last) === 0) lines[lines.length - 1] = word;
		else if (codepoints(last) + 1 + codepoints(word) > columns) lines.push(word);
		else lines[lines.length - 1] = `${last} ${word}`;
	}
	return lines.map((line) => `${spaces(indent)}${line}`).join("\n");
}

/** Prose wrapped at 66 columns under a two space indent. */
export function wrap(text: string): string {
	return wrapIndented(text, 2);
}

export const textRule = "=".repeat(64);

export function textSection(title: string): string {
	return `\n\n${textRule}\n${asciiUpcase(title)}\n${textRule}\n\n`;
}

export function textRead(text: string): string {
	return `The Read\n${wrap(text)}\n`;
}

export function textBar(logged: number, target: number | null): string {
	if (target === null || target === 0) return "";
	const filled = Math.min(logged, target);
	return Array.from({ length: target }, (_, i) => (i < filled ? "#" : ".")).join("");
}

export type TextTarget = {
	label: string;
	logged: number;
	target: number | null;
	note: string;
};

/** One scoreboard line. */
export function textTarget({ label, logged, target, note }: TextTarget): string {
	const count = `${logged}${target === null ? "" : ` / ${target}`}`;
	return `  ${rpad(label, 15)}${rpad(count, 8)}${rpad(textBar(logged, target), 7)}${note}`;
}

/**
 * A column table. `right` holds the column indexes that align right. `widths`,
 * when given, fixes every column's width and keeps every column, so sibling
 * tables line up; null sizes each column to its content and drops any column
 * every row leaves empty.
 */
export function textTableGrid(
	cols: string[],
	rows: string[][],
	right: number[],
	widths: number[] | null,
): string {
	const keep = cols
		.map((_, i) => i)
		.filter((i) => widths !== null || rows.some((row) => (row[i] ?? "") !== ""));
	const widthOf = keep.map((i) =>
		widths !== null
			? widths[i]
			: Math.max(...[cols[i], ...rows.map((row) => row[i] ?? "")].map(codepoints)),
	);
	return [cols, ...rows]
		.map(
			(row) =>
				`  ${keep
					.map((i, k) =>
						right.includes(i) ? lpad(row[i] ?? "", widthOf[k]) : rpad(row[i] ?? "", widthOf[k]),
					)
					.join("  ")
					.replace(/ +$/, "")}`,
		)
		.join("\n");
}

export function textTable(cols: string[], rows: string[][], right: number[]): string {
	return textTableGrid(cols, rows, right, null);
}

/** A pill on a record's title line: faint is the quiet stage word, ink and accent are the Company Cards tones. */
export type RecordBadgeTone = "faint" | "ink" | "accent";
export type RecordBadge = { text: string; tone?: RecordBadgeTone };

/**
 * A record's last `days` days on one line, today at the right edge: each
 * send as a day count back from today, and each known open the same way.
 * The html draws squares and dots on a baseline; the text twin draws one
 * character per day.
 */
export type RecordTimeline = {
	days: number;
	touches: number[];
	opens: number[];
};

/** The color a record's aside number wears: `up` is fresh, `warm` is cooling, `accent` is cold. */
export type RecordAsideTone = "up" | "warm" | "accent";

/** A fact set right on the meta line, its number in a tone: "opened" and "6d". */
export type RecordAside = { text: string; strong?: string; tone?: RecordAsideTone };

/**
 * One record in a stack: what `RecordStack` renders and `recordStackText`
 * writes. It lives here, with no React, so a plain text renderer can import it.
 */
export type RecordStackItem = {
	title: string;
	/** Links the title when set; the plain text twin leaves it out. */
	url?: string | null;
	/** Facts joined by a middle dot on the line under the title; empty items drop. */
	meta: string[];
	note?: string;
	/** A stage word on the title line, right aligned in a pill; "[Contacted]" in the text twin. */
	badge?: string;
	/** More pills after `badge`, each in its tone: New in the accent, the next touch in ink, Wait faint (Company Cards, 2026-09-29). */
	badges?: RecordBadge[];
	/** The record's recent days, drawn between the title and the meta line. */
	timeline?: RecordTimeline;
	/** A fact set right on the meta line, its number colored by its tone. */
	aside?: RecordAside;
	/** A short task under the record, an orange eyebrow over a line of text. */
	callout?: { eyebrow: string; text: string };
};

/** Every pill on a record's title line, the quiet stage word first. */
export function recordBadges(record: RecordStackItem): RecordBadge[] {
	const badges: RecordBadge[] = record.badge ? [{ text: record.badge, tone: "faint" }] : [];
	return [...badges, ...(record.badges ?? [])];
}

/**
 * The timeline as one character per day, oldest on the left and today on the
 * right: `#` a send, `o` an open, `@` both on one day, `·` nothing, then `|`
 * for today's edge. "30d [#····o··@···|]" reads the same way the drawn one does.
 */
export function recordTimelineText(timeline: RecordTimeline): string {
	const days = Math.max(1, Math.round(timeline.days));
	const touch = new Set(timeline.touches.map((d) => Math.round(d)));
	const open = new Set(timeline.opens.map((d) => Math.round(d)));
	let strip = "";
	for (let ago = days - 1; ago >= 0; ago -= 1) {
		strip +=
			touch.has(ago) && open.has(ago) ? "@" : touch.has(ago) ? "#" : open.has(ago) ? "o" : "·";
	}
	return `${days}d [${strip}|]`;
}

/**
 * The plain text twin of `RecordStack`: each title on its own line under a
 * two space indent with every badge after it in square brackets, the
 * timeline as a character strip, the meta joined by middle dots with the
 * aside at its end and the note beneath it, all wrapped under a four space
 * indent, then any callout as its eyebrow in upper case over its text under
 * the same indent, a blank line between records. No line runs past
 * `textWidth`.
 */
export function recordStackText(records: RecordStackItem[]): string {
	return records
		.map((record) => {
			const badges = recordBadges(record)
				.map((b) => ` [${b.text}]`)
				.join("");
			const lines = [wrapIndented(`${record.title}${badges}`, 2)];
			if (record.timeline) lines.push(wrapIndented(recordTimelineText(record.timeline), 4));
			const meta = record.meta.filter((m) => m !== "");
			if (record.aside)
				meta.push([record.aside.text, record.aside.strong ?? ""].filter((x) => x !== "").join(" "));
			if (meta.length > 0) lines.push(wrapIndented(meta.join(" · "), 4));
			if (record.note) lines.push(wrapIndented(record.note, 4));
			if (record.callout) {
				lines.push(wrapIndented(asciiUpcase(record.callout.eyebrow), 4));
				lines.push(wrapIndented(record.callout.text, 4));
			}
			return lines.join("\n");
		})
		.join("\n\n");
}
