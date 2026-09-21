// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	lpad,
	rpad,
	spaces,
	textBar,
	textRead,
	textRule,
	textSection,
	textTable,
	textTableGrid,
	textTarget,
	wrap,
} from "../../src/email";

/*
 * The plain text part is the one place byte equality with jq is both possible
 * and required: a column that drifts by a space runs a label into a number,
 * which is the failure the text part exists to prevent.
 */

const EXPECTED = join(import.meta.dirname, "expected", "text");

function golden(name: string): string {
	return readFileSync(join(EXPECTED, `${name}.txt`), "utf8");
}

describe("the plain text helpers", () => {
	it("spaces, including a negative width", () => {
		expect(`[${spaces(5)}][${spaces(-3)}]`).toBe(golden("spaces"));
	});

	it("rpad counts codepoints, not UTF-16 units", () => {
		expect(`[${rpad("Café · naïve", 20)}]`).toBe(golden("rpad-nonascii"));
	});

	it("lpad counts codepoints, not UTF-16 units", () => {
		expect(`[${lpad("Café · naïve", 20)}]`).toBe(golden("lpad-nonascii"));
	});

	it("the rule", () => {
		expect(textRule).toBe(golden("rule"));
	});

	it("textSection upcases ASCII only", () => {
		expect(textSection("blind spots")).toBe(golden("section"));
		expect(textSection("Café · notes")).toBe(golden("section-nonascii"));
	});

	it("textRead wraps under a two space indent", () => {
		expect(
			textRead(
				"A quiet week that still moved, with two lifts, one long run, and a single takeout order on Monday that nobody is proud of.",
			),
		).toBe(golden("read"));
	});

	it("wrap leaves a short line alone", () => {
		expect(wrap("A quiet week.")).toBe(golden("wrap-short"));
	});

	it("wrap keeps a line that lands exactly on 66 columns", () => {
		expect(wrap("aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd eeeeeeeeee ffffffff gg")).toBe(
			golden("wrap-boundary"),
		);
	});

	it("wrap breaks one column past 66", () => {
		expect(wrap("aaaaaaaaaa bbbbbbbbbb cccccccccc dddddddddd eeeeeeeeee ffffffff ggg")).toBe(
			golden("wrap-boundary-plus"),
		);
	});

	it("textBar fills up to the target", () => {
		expect(textBar(2, 5)).toBe(golden("bar-short"));
	});

	it("textBar draws nothing for a null or zero target", () => {
		expect(`[${textBar(2, null)}][${textBar(2, 0)}]`).toBe(golden("bar-null"));
	});

	it("textTarget pads each column", () => {
		const rows = [
			{ label: "Lift", logged: 2, target: 3, note: "One short" },
			{ label: "Takeout", logged: 1, target: null, note: "Mon · Curry Cart" },
			{ label: "Long walkabout name", logged: 12, target: 12, note: "Target met" },
		];
		expect(rows.map(textTarget).join("\n")).toBe(golden("target"));
	});

	it("textTable sizes to content and aligns the right hand columns", () => {
		expect(
			textTable(
				["Day", "Session", "Type", "Min", "Mi"],
				[
					["Mon", "Evening lift", "Lift", "48", ""],
					["Wed", "Café · long run", "Run (S)", "62", "6.20"],
					["", "Total", "", "110", "6.20"],
				],
				[3, 4],
			),
		).toBe(golden("table"));
	});

	it("textTable drops a column every row leaves empty", () => {
		expect(
			textTable(
				["Company", "Stage", "Cash"],
				[
					["Pinewood Cabinetry", "", "$4,200"],
					["Alder & Co", "", ""],
				],
				[2],
			),
		).toBe(golden("table-drop"));
	});

	it("textTableGrid keeps every column when widths are given", () => {
		expect(
			textTableGrid(
				["Company", "Stage", "Cash"],
				[
					["Pinewood Cabinetry", "", "$4,200"],
					["Alder & Co", "", ""],
				],
				[1, 2],
				[24, 14, 10],
			),
		).toBe(golden("table-grid"));
	});
});
