import { useMemo, useState } from "react";
import {
	BigFold,
	Card,
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
	RecordStack,
	type RecordStackItem,
	RecordTimelineLegend,
	Row,
	recordStackText,
	Scoreboard,
	Stat,
	StatStrip,
	StatsRow,
	TargetRow,
	TitleCard,
	WhatMoved,
} from "../src/email";
import { renderEmail, renderFailureEmail } from "../src/email/render";
import { Example, Piece } from "./parts";

/*
 * The email kit, rendered the way a runner renders it: renderEmail builds the
 * whole document, and the page shows it in a sandboxed frame, where no
 * script runs and the gallery's own styles cannot reach. The bakery's week is
 * made up from top to bottom.
 */

const records: RecordStackItem[] = [
	{
		title: "Alder Street Coffee",
		url: "https://example.test/alder-street-coffee",
		meta: ["Wholesale", "Five Points", "12 loaves a day"],
		note: "Asked for a standing Saturday order of morning buns.",
		badge: "Asked",
		badges: [{ text: "New", tone: "accent" }],
		timeline: { days: 30, touches: [21, 9, 2], opens: [8, 2] },
		aside: { text: "opened", strong: "2d", tone: "up" },
		callout: { eyebrow: "Next", text: "Send the Saturday price sheet by Thursday." },
	},
	{
		title: "Whittier Grocery Cooperative",
		meta: ["Wholesale", "Whittier"],
		note: "Tasting went well; waiting on their board.",
		badge: "Tasted",
		badges: [{ text: "Wait", tone: "faint" }],
		timeline: { days: 30, touches: [26, 14], opens: [13] },
		aside: { text: "opened", strong: "13d", tone: "warm" },
	},
];

function weekEmail(): string {
	return renderEmail({
		title: "Bakehouse Week 41",
		preheader: "Thirty one orders, eight more than last week.",
		children: (
			<>
				<Masthead title="Bakehouse" wordmark="kestrel" meta="Week 41 · 10/05 to 10/11" />
				<TitleCard
					eyebrowText="Week 41"
					headlineLines={["Thirty one orders,", "eight more than last week."]}
					lede="Two wedding cakes and a standing order ask. Every figure here is made up."
					stats={
						<StatsRow>
							<Stat n={31} caption="orders" />
							<Stat n="$4,180" caption="taken" />
							<Stat n={2} caption="cakes booked" />
						</StatsRow>
					}
				/>
				<Eyebrow text="Wholesale · 2" strong aside={<RecordTimelineLegend days={30} />} />
				<Card>
					<Row last={false}>
						<StatStrip
							stats={[
								{ n: 11, label: "Cafes", delta: "+1 (10%)" },
								{ n: 2, label: "Grocers" },
								{ n: 148, label: "Loaves a day", delta: "-6 (4%)" },
							]}
						/>
					</Row>
					<Row last>
						<RecordStack records={records} />
					</Row>
				</Card>
				<Eyebrow text="Scoreboard" />
				<Card>
					<Scoreboard>
						<GroupRow text="The bake" first />
						<TargetRow
							text="Sourdough"
							logged={312}
							target={300}
							note="Sold out by noon twice"
							last={false}
						/>
						<TargetRow
							text="Morning buns"
							logged={540}
							target={600}
							note="Short on Sunday"
							last={false}
						/>
						<TargetRow
							text="Catering trays"
							logged={4}
							target={null}
							note="Two offices, two parties"
							last
						/>
					</Scoreboard>
					<WhatMoved
						items={[
							{ subject: "The map listing", event: "now says open on Sunday." },
							{ subject: "The menu page", event: "is text, and loads in 2.2 seconds." },
						]}
						note="Nothing else changed."
					/>
				</Card>
				<Eyebrow text="Catering" />
				<Card>
					<Item
						name="Five Points Design Studio"
						right="$380"
						subparts={["Breakfast tray", "Friday 08:00"]}
						body="Twenty people, two gluten free."
						foldLabel="the order"
						foldBody="Morning buns, a seeded rye, and the fruit tray."
						linkText="Order"
						url="https://example.test/orders/5521"
						last={false}
					/>
					<Row last={false}>
						<MonoTable
							headers={["Day", "Orders", "Taken"]}
							rows={[
								["Fri", "9", "$1,240"],
								["Sat", "14", "$1,980"],
								["Sun", "8", "$960"],
							]}
						/>
					</Row>
					<FoldRow last={false}>
						<BigFold summary="Asked and declined" count="2">
							<List fontSize="13px">
								<LeadRow lead="A 300 person gala" rest="past what the oven holds" />
								<LeadRow lead="A Monday delivery" rest="the shop is closed" />
							</List>
						</BigFold>
					</FoldRow>
					<Note
						eyebrowText="Busiest hour"
						text="Saturday, 09:00 to 10:00, 41 orders"
						accented
						last
					/>
				</Card>
				<Footer meta="Made up for the gallery · Run 2026-10-12" />
			</>
		),
	});
}

function failureEmail(): string {
	return renderFailureEmail({
		runnerTitle: "Bakehouse Week",
		eyebrowText: "Week 41",
		reason: "The orders export came back empty, so nothing was counted.",
		logTail:
			"fetch orders: 200 OK, 0 rows\nexpected at least 1 row for 2026-10-05..2026-10-11\nexit 1",
	});
}

/**
 * A rendered email in a frame with no scripts. Same origin is allowed only so
 * the page can read the document's height and size the frame to it.
 */
function EmailFrame({ html, title }: { html: string; title: string }) {
	const [height, setHeight] = useState(480);
	return (
		<iframe
			className="gallery-email"
			title={title}
			srcDoc={html.replace(/<head[^>]*>/i, (tag) => `${tag}<base target="_blank">`)}
			sandbox="allow-same-origin allow-popups"
			style={{ height }}
			onLoad={(event) => {
				const doc = event.currentTarget.contentDocument;
				if (!doc) return;
				const measure = () => setHeight(Math.ceil(doc.body.getBoundingClientRect().height));
				measure();
				new ResizeObserver(measure).observe(doc.body);
			}}
		/>
	);
}

export function EmailPiece() {
	const week = useMemo(weekEmail, []);
	const failure = useMemo(failureEmail, []);
	const text = useMemo(() => recordStackText(records), []);
	return (
		<Piece
			id="email"
			title="Email"
			lead="The runner email design as components born inline: tables for layout, inline styles, the palette from context, so they render in a mail client and mount on a page alike. renderEmail builds the whole document from them; each frame below is its output, untouched."
		>
			<Example caption="A week: the masthead, the title card, a record stack with its timeline, the scoreboard, and the catering rows">
				<EmailFrame html={week} title="A made up weekly email, rendered" />
			</Example>
			<Example caption="The failure page renderFailureEmail sends when a run cannot finish">
				<EmailFrame html={failure} title="A made up failure email, rendered" />
			</Example>
			<Example caption="The record stack's plain text twin, from recordStackText">
				<pre className="gallery-pre">{text}</pre>
			</Example>
		</Piece>
	);
}
