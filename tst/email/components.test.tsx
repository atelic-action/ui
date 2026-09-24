// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
	Badge,
	Bar,
	BigFold,
	Card,
	DayStrip,
	EmailThemeProvider,
	EmptyRow,
	Eyebrow,
	Fold,
	FoldRow,
	Footer,
	GroupRow,
	Item,
	LeadRow,
	List,
	ListRow,
	Masthead,
	MonoTable,
	Note,
	ReadBlock,
	RecordStack,
	Records,
	Row,
	Scoreboard,
	Stat,
	StatStrip,
	StatsRow,
	SubEyebrow,
	TargetRow,
	TitleCard,
	TitleLine,
	WhatMoved,
} from "../../src/email";
import { fadeStop } from "../../src/email/theme";
import { normalize } from "./normalize";

/*
 * Parity with the jq the components were ported from. Each golden under
 * expected/ was produced by running homebase `runners/lib/email.jq` with the
 * same synthetic arguments; the comparison is DOM equality, never bytes.
 */

const EXPECTED = join(import.meta.dirname, "expected");

function golden(name: string): string {
	return readFileSync(join(EXPECTED, `${name}.html`), "utf8");
}

const OPEN = "<table><tbody>";
const CLOSE = "</tbody></table>";

/** Rows render inside a throwaway table, which is then sliced back off. */
function renderRows(node: ReactNode): string {
	const markup = renderToStaticMarkup(
		<EmailThemeProvider>
			<table>
				<tbody>{node}</tbody>
			</table>
		</EmailThemeProvider>,
	);
	if (!markup.startsWith(OPEN) || !markup.endsWith(CLOSE)) {
		throw new Error(`unexpected wrapper in ${markup.slice(0, 40)}`);
	}
	return markup.slice(OPEN.length, markup.length - CLOSE.length);
}

function renderInline(node: ReactNode): string {
	return renderToStaticMarkup(<EmailThemeProvider>{node}</EmailThemeProvider>);
}

function expectRows(node: ReactNode, name: string): void {
	expect(normalize(renderRows(node), "rows")).toEqual(normalize(golden(name), "rows"));
}

function expectInline(node: ReactNode, name: string): void {
	expect(normalize(renderInline(node), "inline")).toEqual(normalize(golden(name), "inline"));
}

describe("atoms", () => {
	it("Eyebrow", () => expectRows(<Eyebrow text="The board" />, "eyebrow"));

	it("Card", () =>
		expectRows(
			<Card>
				<EmptyRow text="Nothing cleared every filter this week." />
			</Card>,
			"card",
		));

	it("Fold", () =>
		expectInline(
			<Fold summary="what they do">
				{"Built ins and "}
				<b>refacing</b>
				{"."}
			</Fold>,
			"fold",
		));

	it("BigFold with a count", () =>
		expectInline(
			<BigFold summary="Considered and rejected" count="3">
				<List fontSize="13px">
					<LeadRow lead="Alder & Co" rest="no owner found" />
				</List>
			</BigFold>,
			"big-fold-count",
		));

	it("BigFold without a count", () =>
		expectInline(
			<BigFold summary="Source notes">
				<List fontSize="14px">
					<LeadRow lead="The board" rest="nothing new" />
				</List>
			</BigFold>,
			"big-fold-nocount",
		));

	it("TitleLine escapes an apostrophe the way jq does", () =>
		expectInline(<TitleLine name="Pinewood Cabinetry's shop" right="4.5" />, "title-line"));

	it("Item, everything on", () =>
		expectRows(
			<Item
				name="Pinewood Cabinetry"
				right="4.5"
				subparts={["Cabinet shop", "Longmont", null, ""]}
				body="They answered the audit inside a day."
				foldLabel="what they do"
				foldBody="Built ins & refacing."
				linkText="Posting"
				url="https://example.test/pinewood?q=1&r=2"
				last={false}
			/>,
			"item-full",
		));

	it("Item, bare and last", () =>
		expectRows(
			<Item
				name="Alder & Co"
				right="flagged"
				subparts={[]}
				body=""
				foldLabel=""
				foldBody=""
				linkText=""
				url=""
				last
			/>,
			"item-bare",
		));

	it("Item keeps the subparts div when every part is empty", () =>
		expectRows(
			<Item
				name="Birch Millwork"
				right="3.0"
				subparts={["", null]}
				body=""
				foldLabel=""
				foldBody=""
				linkText="Posting"
				url="https://example.test/birch"
				last={false}
			/>,
			"item-empty-subparts",
		));

	it("Note, accented and last", () =>
		expectRows(
			<Note eyebrowText="One tradeoff" text="The rate is below the band." accented last />,
			"note-accented",
		));

	it("Note, plain", () =>
		expectRows(
			<Note
				eyebrowText="Prospects"
				text="Two shops asked for a quote."
				accented={false}
				last={false}
			/>,
			"note-plain",
		));

	it("EmptyRow", () =>
		expectRows(<EmptyRow text="Nobody is owed a touch this week." />, "empty-row"));

	it("StatsRow with three Stats, one carrying markup", () =>
		expectRows(
			<StatsRow>
				<Stat n={3} caption="replies owed" />
				<Stat n={0} caption="bumps due" />
				<Stat n={9} caption="verified & killed" />
			</StatsRow>,
			"stats-row",
		));

	it("List with a LeadRow and a raw ListRow", () =>
		expectInline(
			<List fontSize="13px">
				<LeadRow lead="Alder & Co" rest="no owner found" />
				<ListRow>
					<span>a raw cell</span>
				</ListRow>
			</List>,
			"list",
		));

	it("Row", () =>
		expectRows(
			<Row last={false}>
				<span>a block</span>
			</Row>,
			"row",
		));

	it("Row, last", () =>
		expectRows(
			<Row last>
				<span>a block</span>
			</Row>,
			"row-last",
		));

	it("FoldRow", () =>
		expectRows(
			<FoldRow last={false}>
				<BigFold summary="Source notes">
					<List fontSize="14px">
						<ListRow>one</ListRow>
					</List>
				</BigFold>
			</FoldRow>,
			"fold-row",
		));

	it("FoldRow, last", () =>
		expectRows(
			<FoldRow last>
				<BigFold summary="Source notes" count="2">
					<List fontSize="14px">
						<ListRow>one</ListRow>
					</List>
				</BigFold>
			</FoldRow>,
			"fold-row-last",
		));

	it("MonoTable", () =>
		expectInline(
			<MonoTable
				headers={["Type", "Complete", "Target", "%", "Details"]}
				rows={[
					["Bumps", "0", "4", "0", "two shops & a cafe"],
					["Intros", "0", "6", "0", ""],
				]}
			/>,
			"mono-table",
		));
});

describe("the scoreboard", () => {
	it("Bar widens its segments at a target of three", () =>
		expectInline(<Bar logged={2} target={3} />, "bar-small"));

	it("Bar narrows its segments past three", () =>
		expectInline(<Bar logged={5} target={4} />, "bar-wide"));

	it("Bar fills no further than the target", () =>
		expectInline(<Bar logged={9} target={6} />, "bar-overfilled"));

	it("GroupRow, first", () => expectRows(<GroupRow text="Movement" first />, "group-row-first"));

	it("GroupRow", () => expectRows(<GroupRow text="Atelic" first={false} />, "group-row"));

	it("TargetRow, short", () =>
		expectRows(
			<TargetRow text="Lift" logged={2} target={3} note="One short" last={false} />,
			"target-row-short",
		));

	it("TargetRow, met", () =>
		expectRows(
			<TargetRow text="Yoga" logged={4} target={4} note="Target met" last={false} />,
			"target-row-met",
		));

	it("TargetRow with a null target", () =>
		expectRows(
			<TargetRow text="Takeout" logged={1} target={null} note="Mon · Curry Cart" last />,
			"target-row-null",
		));

	it("TargetRow with a zero target draws no bar", () =>
		expectRows(
			<TargetRow text="Swim" logged={0} target={0} note="Nothing planned" last />,
			"target-row-zero",
		));

	it("Scoreboard", () =>
		expectRows(
			<Scoreboard>
				<GroupRow text="Movement" first />
				<TargetRow text="Lift" logged={2} target={3} note="One short" last={false} />
				<TargetRow text="Takeout" logged={1} target={null} note="Mon · Curry Cart" last />
			</Scoreboard>,
			"scoreboard",
		));

	it("WhatMoved", () =>
		expectRows(
			<WhatMoved
				items={[
					{ subject: "Pinewood Cabinetry", event: "replied to the audit." },
					{ subject: "Alder & Co", event: "went quiet." },
				]}
				note="Nothing else changed."
			/>,
			"what-moved",
		));

	it("WhatMoved without a note", () =>
		expectRows(
			<WhatMoved items={[{ subject: "Birch Millwork", event: "booked a visit." }]} note="" />,
			"what-moved-nonote",
		));

	it("ReadBlock with a divider", () =>
		expectRows(<ReadBlock text="Two lifts and one long run." divider />, "read-block-divider"));

	it("ReadBlock", () =>
		expectRows(<ReadBlock text="Two lifts and one long run." divider={false} />, "read-block"));

	it("SubEyebrow", () => expectRows(<SubEyebrow text="By Day" />, "sub-eyebrow"));

	it("Badge", () => expectInline(<Badge letter="S" />, "badge"));

	it("DayStrip", () =>
		expectRows(
			<DayStrip
				days={[
					{ label: "Mon", entries: [{ name: "Lift", strong: false, badge: "" }] },
					{ label: "Tue", entries: [] },
					{
						label: "Wed",
						entries: [
							{ name: "Run", strong: true, badge: "S" },
							{ name: "Yoga", strong: false, badge: "" },
						],
					},
				]}
				last={false}
			/>,
			"day-strip",
		));

	it("DayStrip, last", () =>
		expectRows(
			<DayStrip
				days={[{ label: "Sat", entries: [{ name: "Hike", strong: true, badge: "" }] }]}
				last
			/>,
			"day-strip-last",
		));

	it("StatStrip", () =>
		expectInline(
			<StatStrip
				stats={[
					{ n: 6, label: "Lead" },
					{ n: 2, label: "MQL" },
					{ n: 1, label: "Closed" },
				]}
			/>,
			"stat-strip",
		));

	it("StatStrip floors its cell width", () =>
		expectInline(
			<StatStrip
				stats={[
					{ n: 1, label: "A" },
					{ n: 2, label: "B" },
					{ n: 3, label: "C" },
					{ n: 4, label: "D" },
					{ n: 5, label: "E" },
					{ n: 6, label: "F" },
					{ n: 7, label: "G" },
				]}
			/>,
			"stat-strip-seven",
		));

	it("StatStrip wraps seven stats as inline blocks and shows a delta under its label", () => {
		const markup = renderInline(
			<StatStrip
				stats={[
					{ n: 1, label: "A" },
					{ n: 2, label: "B" },
					{ n: 3, label: "C", delta: "+3 · +12%" },
					{ n: 4, label: "D" },
					{ n: 5, label: "E" },
					{ n: 6, label: "F" },
					{ n: 7, label: "G" },
				]}
			/>,
		);
		const cells = markup.match(/<div style="display:inline-block;[^"]*"/g) ?? [];
		expect(cells).toHaveLength(7);
		for (const cell of cells) {
			expect(cell).toContain("min-width:88px");
			expect(cell).toContain("vertical-align:top");
		}
		expect(markup.match(/<td/g)).toHaveLength(1);
		expect(markup).toMatch(/>C<\/span><br\/><span style="[^"]*">\+3 · \+12%<\/span>/);
	});

	it("RecordStack keeps a long title whole and fixes no width on any cell", () => {
		const title = "Pinewood Cabinetry and Custom Millwork of Denver";
		expect(title).toHaveLength(48);
		const markup = renderInline(
			<RecordStack
				records={[
					{
						title,
						url: "https://example.test/pinewood",
						meta: ["Lead", "Longmont", "", "fit 14"],
						note: "Answered the audit inside a day.",
					},
					{ title: "Alder & Co", meta: ["Other"] },
				]}
			/>,
		);
		expect(markup).toContain(`>${title}</a>`);
		const cells = markup.match(/<td[^>]*>/g) ?? [];
		expect(cells).toHaveLength(2);
		for (const cell of cells) {
			expect(cell).not.toMatch(/\swidth=/);
			expect(cell).not.toMatch(/[";]width:/);
		}
		expect(markup).toContain(">Lead · Longmont · fit 14</div>");
		expect(markup).toContain(">Answered the audit inside a day.</div>");
		expect(markup.match(/border-bottom:1px solid #/g)).toHaveLength(2);
	});

	it("Records drops a column every row leaves empty", () =>
		expectInline(
			<Records
				columns={[
					{ label: "Day" },
					{ label: "Session" },
					{ label: "Type", right: true },
					{ label: "Min", right: true },
					{ label: "Mi", right: true },
				]}
				rows={[
					[
						{ value: "Mon", mono: true, muted: true },
						{ value: "Evening lift" },
						{
							value: "Lift",
							html: (
								<>
									Lift
									<Badge letter="S" />
								</>
							),
						},
						{ value: "48", mono: true },
						{ value: "" },
					],
					[
						{ value: "Wed", mono: true, muted: true },
						{ value: "Alder & Co run" },
						{ value: "Run" },
						{ value: "62", mono: true },
						{ value: "" },
					],
				]}
			/>,
			"records-drop",
		));

	it("Records keeps a column whose only content is markup", () => {
		const markup = renderInline(
			<Records
				columns={[{ label: "Day" }, { label: "Type" }]}
				rows={[[{ value: "Mon" }, { html: <Badge letter="S" /> }]]}
			/>,
		);
		expect(markup).toContain(">Type</td>");
	});

	it("fadeStop fades a hex accent and never writes NaN for anything else", () => {
		expect(fadeStop("#FC4A1A")).toBe("rgba(252,74,26,0)");
		expect(fadeStop("#f41")).toBe("rgba(255,68,17,0)");
		expect(fadeStop("rgb(252,74,26)")).toBe("transparent");
	});

	it("Records fixes its layout when a column carries a width", () =>
		expectInline(
			<Records
				columns={[
					{ label: "Company", keep: true },
					{ label: "Stage", right: true, width: 130, keep: true },
					{ label: "Cash", right: true, width: 110, keep: true },
				]}
				rows={[
					[
						{ value: "Pinewood Cabinetry" },
						{ value: "No stage set", muted: true },
						{ value: "", mono: true },
					],
					[
						{ value: "Alder & Co" },
						{ value: "Closed Lost", hot: true },
						{ value: "$4,200", mono: true },
					],
				]}
			/>,
			"records-fixed",
		));

	it("Records with no rows keeps only the columns that say keep", () =>
		expectInline(
			<Records columns={[{ label: "Company", keep: true }, { label: "Reason" }]} rows={[]} />,
			"records-empty",
		));
});

describe("the frame", () => {
	it("Masthead", () => expectRows(<Masthead title="Retro · Week 40" />, "masthead"));

	it("TitleCard with stats", () =>
		expectRows(
			<TitleCard
				eyebrowText="Week 40 · 09/28 to 10/04"
				headlineLines={["Three of four", "targets hit."]}
				lede="A quiet week that still moved."
				stats={
					<StatsRow>
						<Stat n={3} caption="shortlisted" />
						<Stat n={1} caption="for your call" />
					</StatsRow>
				}
			/>,
			"title-card",
		));

	it("TitleCard without stats closes its lede", () =>
		expectRows(
			<TitleCard
				eyebrowText="Week 41"
				headlineLines={["Nothing cleared."]}
				lede="The sources were thin."
			/>,
			"title-card-nostats",
		));

	it("TitleCard without a lede", () =>
		expectRows(
			<TitleCard eyebrowText="Week 42" headlineLines={["Two lines", "of headline"]} lede="" />,
			"title-card-nolede",
		));

	it("Footer", () => expectRows(<Footer meta="Run 2026-10-05 · 41s · retro@runners" />, "footer"));
});
