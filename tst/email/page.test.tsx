// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	BigFold,
	Card,
	DayStrip,
	Eyebrow,
	FoldRow,
	Footer,
	GroupRow,
	Item,
	LeadRow,
	List,
	Masthead,
	MonoTable,
	Note,
	ReadBlock,
	Records,
	Row,
	Scoreboard,
	Stat,
	StatStrip,
	StatsRow,
	SubEyebrow,
	TargetRow,
	TitleCard,
	WhatMoved,
} from "../../src/email";
import { renderEmail, renderFailureEmail } from "../../src/email/render";
import { normalize } from "./normalize";

/*
 * The whole document, composed the way a runner composes one, against the
 * same composition run through jq.
 */

const EXPECTED = join(import.meta.dirname, "expected");

function golden(name: string): string {
	return readFileSync(join(EXPECTED, `${name}.html`), "utf8");
}

const page = renderEmail({
	title: "Week 40 Retro",
	preheader: "Three of four targets hit.",
	children: (
		<>
			<Masthead title="Retro · Week 40" />
			<TitleCard
				eyebrowText="Week 40 · 09/28 to 10/04"
				headlineLines={["Three of four", "targets hit."]}
				lede="A quiet week that still moved."
				stats={
					<StatsRow>
						<Stat n={3} caption="shortlisted" />
						<Stat n={1} caption="for your call" />
						<Stat n={9} caption="verified & killed" />
					</StatsRow>
				}
			/>
			<Eyebrow text="Scoreboard" />
			<Card>
				<Scoreboard>
					<GroupRow text="Movement" first />
					<TargetRow text="Lift" logged={2} target={3} note="One short" last={false} />
					<TargetRow text="Takeout" logged={1} target={null} note="Mon · Curry Cart" last />
				</Scoreboard>
				<WhatMoved
					items={[{ subject: "Pinewood Cabinetry", event: "replied to the audit." }]}
					note="Nothing else changed."
				/>
			</Card>
			<Eyebrow text="Movement" />
			<Card>
				<ReadBlock text="Two lifts and one long run." divider />
				<SubEyebrow text="By Day" />
				<DayStrip
					days={[
						{ label: "Mon", entries: [{ name: "Lift", strong: false, badge: "" }] },
						{ label: "Tue", entries: [] },
						{ label: "Wed", entries: [{ name: "Run", strong: true, badge: "S" }] },
					]}
					last={false}
				/>
				<SubEyebrow text="Sessions · 2" />
				<Row last>
					<Records
						columns={[{ label: "Day" }, { label: "Session" }, { label: "Min", right: true }]}
						rows={[
							[
								{ value: "Mon", mono: true, muted: true },
								{ value: "Evening lift" },
								{ value: "48", mono: true },
							],
							[
								{ value: "Wed", mono: true, muted: true },
								{ value: "Alder & Co run" },
								{ value: "62", mono: true },
							],
						]}
					/>
				</Row>
			</Card>
			<Eyebrow text="The board" />
			<Card>
				<Item
					name="Pinewood Cabinetry"
					right="4.5"
					subparts={["Cabinet shop", "Longmont"]}
					body="They answered the audit inside a day."
					foldLabel="what they do"
					foldBody="Built ins & refacing."
					linkText="Posting"
					url="https://example.test/pinewood"
					last={false}
				/>
				<FoldRow last>
					<BigFold summary="Considered and rejected" count="3">
						<List fontSize="13px">
							<LeadRow lead="Alder & Co" rest="no owner found" />
						</List>
					</BigFold>
				</FoldRow>
			</Card>
			<Eyebrow text="The queue" />
			<Card>
				<Row last={false}>
					<MonoTable
						headers={["Type", "Complete", "Target"]}
						rows={[
							["Bumps", "0", "4"],
							["Intros", "0", "6"],
						]}
					/>
				</Row>
				<Note eyebrowText="Hottest reader" text="Pinewood Cabinetry, 5 opens" accented last />
			</Card>
			<Eyebrow text="At a glance" />
			<Card>
				<Row last>
					<StatStrip
						stats={[
							{ n: 6, label: "Lead" },
							{ n: 2, label: "MQL" },
							{ n: 1, label: "Closed" },
						]}
					/>
				</Row>
			</Card>
			<Footer meta="Run 2026-10-05 · 41s" />
		</>
	),
});

describe("the page", () => {
	it("matches the jq composition once parsed", () => {
		expect(normalize(page, "document")).toEqual(normalize(golden("page-full"), "document"));
	});

	it("opens on a doctype React would never emit", () => {
		expect(page.startsWith("<!doctype html>")).toBe(true);
	});

	it("keeps the style block's angle bracket unescaped", () => {
		expect(page).toContain("details>summary{list-style:none}");
	});

	it("hides the preheader in the body", () => {
		expect(page).toContain(
			'<span style="display:none;font-size:1px;color:#F6F1E7;max-height:0;overflow:hidden">Three of four targets hit.</span>',
		);
	});

	it("renders the failure page", () => {
		const markup = renderFailureEmail({
			runnerTitle: "Retro",
			eyebrowText: "Week 40",
			reason: "Strava returned a 502 & gave up.",
			logTail: "traceback:\n  line 1 <fetch>\n  line 2",
		});
		expect(normalize(markup, "document")).toEqual(normalize(golden("failure-page"), "document"));
	});
});
