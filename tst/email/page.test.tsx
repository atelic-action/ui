// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
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
	Note,
	ReadBlock,
	Records,
	Row,
	Scoreboard,
	Stat,
	StatsRow,
	SubEyebrow,
	TargetRow,
	TitleCard,
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
				<Note eyebrowText="Hottest reader" text="Pinewood Cabinetry, 5 opens" accented last />
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

/*
 * The structured failure page. `frozen/failure-page-plain.html` is the exact
 * string 4.0.0 rendered for the plain call below, frozen the day `step` and
 * `fix` arrived, so a consumer that passes neither keeps every byte.
 */
describe("the structured failure page", () => {
	const plain = {
		runnerTitle: "Retro",
		eyebrowText: "Week 40",
		reason: "Strava returned a 502 & gave up.",
		logTail: "traceback:\n  line 1 <fetch>\n  line 2",
	};
	const structured = {
		runnerTitle: "Brief",
		eyebrowText: "Week 47",
		step: "Claude model call",
		reason: "OAuth token revoked, status 401",
		fix: "Run claude setup-token, then push the new token to the vault.",
		logTail: "POST /v1/messages\n401 Unauthorized\nexit 1",
	};

	function parse(markup: string): Document {
		return new JSDOM(markup).window.document;
	}

	/** Each labelled row as [label, value], in order, the log included. */
	function facts(markup: string): [string, string][] {
		const doc = parse(markup);
		return [...doc.querySelectorAll("td > div:first-child + div, td > div:first-child + pre")].map(
			(value) => [value.previousElementSibling?.textContent ?? "", value.textContent ?? ""],
		);
	}

	it("renders the plain page byte for byte when neither step nor fix is passed", () => {
		const frozen = readFileSync(
			join(import.meta.dirname, "frozen", "failure-page-plain.html"),
			"utf8",
		);
		expect(renderFailureEmail(plain)).toBe(frozen);
		expect(renderFailureEmail({ ...plain, step: undefined, fix: undefined })).toBe(frozen);
	});

	it("renders what failed, why, what to do, and the log, in that order", () => {
		expect(facts(renderFailureEmail(structured))).toEqual([
			["What Failed", "Claude model call"],
			["Why", "OAuth token revoked, status 401"],
			["What to Do", "Run claude setup-token, then push the new token to the vault."],
			["Log", "POST /v1/messages\n401 Unauthorized\nexit 1"],
		]);
	});

	it("keeps the headline and drops the plain reason line", () => {
		const doc = parse(renderFailureEmail(structured));
		doc.querySelector("body > span")?.remove();
		expect(doc.body.textContent).toContain("The brief did not run.");
		expect(doc.body.textContent?.split("OAuth token revoked, status 401")).toHaveLength(2);
	});

	it("leads the preheader with the step", () => {
		expect(renderFailureEmail(structured)).toContain(
			">Claude model call: OAuth token revoked, status 401</span>",
		);
	});

	it("omits the fix row when there is no fix", () => {
		const { fix: _fix, ...rest } = structured;
		expect(facts(renderFailureEmail(rest)).map(([label]) => label)).toEqual([
			"What Failed",
			"Why",
			"Log",
		]);
	});

	it("leaves no empty why row when the reason is empty", () => {
		const markup = renderFailureEmail({ ...structured, reason: "" });
		expect(facts(markup).map(([label]) => label)).toEqual(["What Failed", "What to Do", "Log"]);
		expect(markup).toContain(">Claude model call</span>");
	});

	it("structures the page on a fix alone", () => {
		const markup = renderFailureEmail({ ...plain, fix: "Run the export again." });
		expect(facts(markup).map(([label]) => label)).toEqual(["Why", "What to Do", "Log"]);
		expect(markup).toContain(">Strava returned a 502 &amp; gave up.</span>");
	});

	it("escapes a value holding an angle bracket and an ampersand", () => {
		const markup = renderFailureEmail({
			...structured,
			step: "Fetch <orders> & totals",
			fix: "Run bun run export < input.csv && retry.",
		});
		expect(markup).toContain("Fetch &lt;orders&gt; &amp; totals");
		expect(markup).toContain("Run bun run export &lt; input.csv &amp;&amp; retry.");
		expect(markup).not.toContain("<orders>");
		expect(facts(markup)[0]).toEqual(["What Failed", "Fetch <orders> & totals"]);
	});
});
