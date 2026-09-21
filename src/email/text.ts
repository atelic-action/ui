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

/** Prose wrapped at 66 columns under a two space indent. */
export function wrap(text: string): string {
	const lines = [""];
	for (const word of text.split(" ")) {
		const last = lines[lines.length - 1];
		if (codepoints(last) === 0) lines[lines.length - 1] = word;
		else if (codepoints(last) + 1 + codepoints(word) > 66) lines.push(word);
		else lines[lines.length - 1] = `${last} ${word}`;
	}
	return lines.map((line) => `  ${line}`).join("\n");
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
