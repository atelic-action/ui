// @vitest-environment node
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	accentInk,
	Badge,
	Bar,
	contrastRatio,
	DayStrip,
	EmailThemeProvider,
	FailurePage,
	GroupRow,
	Item,
	ListRow,
	Note,
	type Palette,
	ReadBlock,
	RecordStack,
	Records,
	RecordTimelineStrip,
	Row,
	recordTimelineSummary,
	TargetRow,
	TitleLine,
	wrapLong,
} from "../../src/email";
import { RECORDS_WIDTH } from "../../src/email/scoreboard";
import { atelicPalette } from "../../src/tokens";

/*
 * What the 8.0.0 pass made readable: small accent words in the accent's ink,
 * a text alternative for the pieces that draw without words, a long token
 * that wraps rather than widening the email, and a records table a reader
 * can navigate by column.
 */

/** A client palette that names an accent and nothing to set its words in. */
const accentOnly: Palette = {
	ground: "#F6F1E7",
	paper: "#FDFBF6",
	ink: "#151515",
	dim: "#55503f",
	faint: "#6e6757",
	accent: "#FC4A1A",
	line: "#E6DFD2",
	hair: "#F0EAE0",
};

function inline(node: ReactNode, palette?: Palette): string {
	return renderToStaticMarkup(<EmailThemeProvider palette={palette}>{node}</EmailThemeProvider>);
}

function rows(node: ReactNode, palette?: Palette): string {
	return inline(
		<table>
			<tbody>{node}</tbody>
		</table>,
		palette,
	);
}

const WRAP = "overflow-wrap:anywhere;word-break:break-word";

describe("contrastRatio", () => {
	it("measures the WCAG ratio either way round", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
		expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5);
		expect(contrastRatio("#FC4A1A", "#FDFBF6")).toBeCloseTo(3.31, 2);
	});

	it("is null for a color that is not a hex", () => {
		expect(contrastRatio("orange", "#ffffff")).toBeNull();
	});
});

describe("accentInk", () => {
	it("is the palette's own ink when it names one", () => {
		expect(accentInk(atelicPalette)).toBe("#B8300B");
	});

	it("darkens an accent that fails as words until it passes on the paper and the ground", () => {
		const ink = accentInk(accentOnly);
		expect(ink).toBe("#C73A15");
		expect(contrastRatio(ink, accentOnly.paper)).toBeGreaterThanOrEqual(4.5);
		expect(contrastRatio(ink, accentOnly.ground)).toBeGreaterThanOrEqual(4.5);
		// One step lighter fails on the ground, so the step taken is the least that passes.
		expect(contrastRatio("#CA3B15", accentOnly.ground)).toBeLessThan(4.5);
	});

	it("keeps an accent that already passes exactly as written", () => {
		expect(accentInk({ ...accentOnly, accent: "#7a3218" })).toBe("#7a3218");
	});

	it("falls back to the ink for an accent that is not a hex", () => {
		expect(accentInk({ ...accentOnly, accent: "orange" })).toBe(accentOnly.ink);
	});
});

describe("small accent words wear the accent's ink, never the accent", () => {
	const pieces: [string, ReactNode, "rows" | "inline"][] = [
		["TitleLine", <TitleLine key="t" name="Week" right="3 of 5" />, "inline"],
		["Item", <Item key="i" name="Bakehouse" right="2 short" subparts={[]} last />, "rows"],
		["Note", <Note key="n" eyebrowText="Watch" text="Rain all week." accented last />, "rows"],
		["GroupRow", <GroupRow key="g" text="Training" first />, "rows"],
		["TargetRow", <TargetRow key="r" text="Runs" logged={2} target={4} note="" last />, "rows"],
		["ReadBlock", <ReadBlock key="b" text="A quiet week." divider={false} />, "rows"],
		["Badge", <Badge key="d" letter="S" />, "inline"],
		[
			"RecordStack",
			<RecordStack
				key="s"
				records={[
					{
						title: "Crema",
						meta: ["Lead"],
						badges: [{ text: "New", tone: "accent" }],
						aside: { text: "opened", strong: "40d", tone: "accent" },
						callout: { eyebrow: "Next", text: "Call Thursday." },
					},
				]}
			/>,
			"inline",
		],
		[
			"Records",
			<Records key="c" columns={[{ label: "Stage" }]} rows={[[{ value: "Lost", hot: true }]]} />,
			"inline",
		],
		[
			"FailurePage",
			<FailurePage
				key="f"
				runnerTitle="Weekly"
				eyebrowText="Failed"
				reason="Timeout."
				logTail="..."
				fix="Run it again."
			/>,
			"rows",
		],
	];

	for (const [name, node, kind] of pieces) {
		it(`${name}, on the Atelic palette and on one that names only an accent`, () => {
			for (const palette of [atelicPalette, accentOnly]) {
				const markup = kind === "rows" ? rows(node, palette) : inline(node, palette);
				expect(markup, name).toContain(`color:${accentInk(palette)}`);
				expect(markup, name).not.toMatch(/(?<![-\w])color:#FC4A1A/i);
			}
		});
	}

	it("keeps the bright accent for the marks that carry no words", () => {
		const markup = inline(
			<RecordStack
				records={[
					{
						title: "Crema",
						url: "https://example.com",
						meta: [],
						timeline: { days: 7, touches: [], opens: [1] },
						callout: { eyebrow: "Next", text: "Call." },
					},
				]}
			/>,
		);
		expect(markup).toContain(`border-bottom:1px solid ${atelicPalette.accent}`);
		expect(markup).toContain(`border-left:2px solid ${atelicPalette.accent}`);
		expect(markup).toContain(`background:${atelicPalette.accent}`);
	});
});

describe("text alternatives", () => {
	it("Badge reads what its letter stands for when it is told", () => {
		const labelled = inline(<Badge letter="S" label="Social" />);
		expect(labelled).toContain('role="img"');
		expect(labelled).toContain('aria-label="Social"');
		expect(labelled).toContain('title="Social"');
		expect(inline(<Badge letter="S" />)).not.toContain("role=");
	});

	it("DayStrip passes an entry's badge label to its badge", () => {
		const markup = rows(
			<DayStrip
				days={[{ label: "Mon", entries: [{ name: "Run", badge: "S", badgeLabel: "Social" }] }]}
				last
			/>,
		);
		expect(markup).toContain('aria-label="Social"');
	});

	it("Bar says logged of target, or nothing when a count beside it already does", () => {
		expect(inline(<Bar logged={2} target={5} />)).toContain('role="img" cellPadding="0"');
		expect(inline(<Bar logged={2} target={5} />)).toContain('aria-label="2 of 5"');
		expect(inline(<Bar logged={2} target={5} label="Two runs of five" />)).toContain(
			'aria-label="Two runs of five"',
		);
		expect(inline(<Bar logged={2} target={5} label={false} />)).not.toContain("aria-label");
		expect(rows(<TargetRow text="Runs" logged={2} target={5} note="" last />)).not.toContain(
			"aria-label",
		);
	});

	it("RecordTimelineStrip is an image named by its summary, or by its label", () => {
		const timeline = { days: 30, touches: [9, 28], opens: [3] };
		const markup = inline(<RecordTimelineStrip timeline={timeline} />);
		expect(markup).toContain('role="img"');
		expect(markup).toContain(
			'aria-label="Last 30 days: 2 sends, the latest 9 days ago; 1 open, 3 days ago"',
		);
		expect(inline(<RecordTimelineStrip timeline={timeline} label="Quiet lately" />)).toContain(
			'aria-label="Quiet lately"',
		);
	});

	it("recordTimelineSummary counts each day once, inside the window, in plain words", () => {
		expect(recordTimelineSummary({ days: 14, touches: [], opens: [] })).toBe(
			"Last 14 days: no sends; no opens",
		);
		expect(recordTimelineSummary({ days: 1, touches: [0], opens: [] })).toBe(
			"Last 1 day: 1 send, today; no opens",
		);
		expect(recordTimelineSummary({ days: 30, touches: [1, 1.2, 5, 40], opens: [0, 2] })).toBe(
			"Last 30 days: 2 sends, the latest yesterday; 2 opens, the latest today",
		);
	});
});

describe("a long token wraps instead of widening the email", () => {
	const token = "/srv/bakehouse/runners/weekly_ops/cache/ledger_2026W47_wholesale_export.json";

	it("in a Row, an Item, a Note, a ListRow, and a ReadBlock", () => {
		expect(rows(<Row last>{token}</Row>)).toContain(WRAP);
		expect(rows(<Item name={token} right="1" subparts={[]} last />)).toContain(WRAP);
		expect(rows(<Note eyebrowText="Path" text={token} accented={false} last />)).toContain(WRAP);
		expect(rows(<ListRow>{token}</ListRow>)).toContain(WRAP);
		expect(rows(<ReadBlock text={token} divider={false} />)).toContain(WRAP);
	});

	it("in a day of the DayStrip", () => {
		const markup = rows(
			<DayStrip days={[{ label: "Mon", entries: [{ name: "sourdough" }] }]} last />,
		);
		expect(markup).toMatch(/vertical-align:top;overflow-wrap:anywhere;word-break:break-word/);
	});

	it("in the plain failure page's log, as in the structured one's", () => {
		const plain = rows(
			<FailurePage runnerTitle="Weekly" eyebrowText="Failed" reason="Timeout." logTail={token} />,
		);
		expect(plain).toMatch(new RegExp(`<pre style="[^"]*${WRAP}[^"]*">`));
	});

	it("shares one helper the mail clients honor inline", () => {
		expect(wrapLong).toEqual({ overflowWrap: "anywhere", wordBreak: "break-word" });
	});
});

describe("Records", () => {
	const columns = [
		{ label: "Company" },
		{ label: "Stage", right: true },
		{ label: "Cash", right: true },
	];

	it("is a data table whose header cells name their column", () => {
		const markup = inline(
			<Records
				columns={columns}
				rows={[[{ value: "Alder" }, { value: "Lead" }, { value: "$1" }]]}
			/>,
		);
		expect(markup).toMatch(/^<table cellPadding="0"/);
		expect(markup).not.toMatch(/^<table role="presentation"/);
		expect(markup.match(/<th scope="col"/g) ?? []).toHaveLength(3);
		expect(markup).not.toMatch(/<td[^>]*>Company</);
		expect(markup).toMatch(
			/<th scope="col" align="left" style="padding:0 8px 6px 0;font-weight:normal;/,
		);
	});

	it("draws a pixel width as its share of the desktop table, so a phone narrows the same grid", () => {
		const markup = inline(
			<Records
				columns={[
					{ label: "Company" },
					{ label: "Stage", right: true, width: 130 },
					{ label: "Cash", right: true, width: 110 },
				]}
				rows={[[{ value: "Alder" }, { value: "Lead" }, { value: "$1" }]]}
			/>,
		);
		expect(RECORDS_WIDTH).toBe(630);
		expect(markup).toContain('width="20.63%" style="width:20.63%;');
		expect(markup).toContain('width="17.46%" style="width:17.46%;');
		expect(markup).toContain("table-layout:fixed");
		expect(markup).not.toMatch(/width:\d+px/);
	});

	it("scales widths that ask for more than the table to fill it exactly", () => {
		const markup = inline(
			<Records
				columns={[
					{ label: "A", width: 400 },
					{ label: "B", width: 400 },
				]}
				rows={[[{ value: "1" }, { value: "2" }]]}
			/>,
		);
		expect(markup.match(/width="50%"/g) ?? []).toHaveLength(2);
	});

	it("wraps a long value in a left column and keeps a right column on one line", () => {
		const markup = inline(
			<Records
				columns={columns}
				rows={[[{ value: "Alder" }, { value: "Lead" }, { value: "$1" }]]}
			/>,
		);
		expect(markup).toMatch(new RegExp(`<td align="left" style="[^"]*${WRAP}">Alder</td>`));
		expect(markup).toMatch(/<td align="right" style="[^"]*white-space:nowrap">Lead<\/td>/);
	});
});
