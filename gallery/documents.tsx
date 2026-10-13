import { useState } from "react";
import { Gate, type GatePayload } from "../src/artifact/Gate";
import { Note, type NoteProps } from "../src/artifact/Note";
import { Report, type ReportProps } from "../src/artifact/Report";
import type { WriteupPerson } from "../src/artifact/SignOff";
import { ratingCell, Writeup, type WriteupProps } from "../src/artifact/Writeup";
import payload from "./gate-payload.json";
import { Example, Piece } from "./parts";

/*
 * The artifact documents, each as one whole made up document for Kestrel
 * Hollow Bakehouse, the gallery's fictional bakery. Every grade, figure,
 * finding, and address is invented; the sender is the practice's own close,
 * as every document carries it. A site wraps each in ArtifactShell; here
 * each is framed to sit in the page.
 */

const person: WriteupPerson = {
	photoSrc: "/images/note-person.svg",
	photoAlt: "Matthew Fornaciari",
	name: "Matthew Fornaciari",
	role: "Atelic",
	mailHref: "mailto:matt@atelic.me",
	mailLabel: "matt@atelic.me",
};

const writeup: WriteupProps = {
	sender: { name: "atelic", href: "https://atelic.me" },
	recipient: { logoSrc: "/images/kestrel-mark.svg", logoAlt: "Kestrel Hollow Bakehouse" },
	preparedFor: "Kestrel Hollow Bakehouse",
	date: "2026-10-12",
	title: "How Kestrel Hollow Shows Up Online",
	intro:
		"A reading of the bakery's site, its map listing, its searches, and what the AI answers say about it, taken from the outside. Every figure here is made up for the gallery.",
	sheets: [
		{
			id: "kh-overview",
			blocks: [
				{
					kind: "summary",
					id: "kh-summary",
					title: "At a Glance",
					beforeLabel: "June 2026",
					legend: [
						{ grade: "a", label: "Working well" },
						{ grade: "b", label: "Mostly there" },
						{ grade: "c", label: "Needs work" },
						{ grade: "d", label: "Broken" },
					],
					rows: [
						{
							tier: "Health",
							section: "Technical SEO",
							href: "#kh-technical-seo",
							grade: "b",
							before: "c",
							read: "Secure and reachable, but every page is titled Home.",
						},
						{
							tier: "Health",
							section: "Core Web Vitals",
							href: "#kh-core-web-vitals",
							grade: "c",
							read: "A phone waits 4.6 seconds for the first screen.",
						},
						{
							tier: "Visibility",
							section: "Organic SEO",
							href: "#kh-organic-seo",
							grade: "c",
							read: "Found by name, rarely for what it bakes.",
						},
						{
							tier: "Visibility",
							section: "Local SEO",
							href: "#kh-local-seo",
							grade: "c",
							read: "The map listing says closed on Sunday.",
						},
						{
							tier: "Visibility",
							section: "GEO",
							href: "#kh-geo",
							grade: "d",
							read: "No AI answer names the bakery.",
						},
						{
							tier: "Conversion",
							section: "Analytics and Conversion Tracking",
							href: "#kh-analytics",
							grade: "c",
							read: "Visits are counted; orders and calls are not.",
						},
						{
							tier: "Conversion",
							section: "CRO",
							href: "#kh-cro",
							grade: "b",
							read: "Ordering ahead takes three taps.",
						},
					],
				},
			],
		},
		{
			id: "kh-health",
			blocks: [
				{
					kind: "part",
					id: "kh-part-health",
					title: "Health",
					lead: "Can a phone and a search engine reach the site, and does it load fast?",
				},
				{
					kind: "topic",
					id: "kh-technical-seo",
					title: "Technical SEO",
					href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
					oneLiner: "Whether search can reach, read, and tell apart every page.",
					grade: "b",
					why: "Every page is reachable and secure; the titles are the one gap.",
					blocks: [
						{
							kind: "checks",
							title: "The Basics",
							items: [
								{ label: "Secure connection", detail: "Valid through 2027-05-14.", pass: true },
								{
									label: "One home address",
									detail: "Every spelling lands on one page.",
									pass: true,
								},
								{ label: "A sitemap search can read", pass: true },
								{ label: "A title on every page", detail: "All six say Home.", pass: false },
							],
						},
						{
							kind: "findings",
							items: [
								{
									lead: "Every page is titled Home.",
									body: "Search shows the same word for all six pages, so nothing says bakery, or Alder Street, to anyone scanning the results.",
								},
								{
									lead: "The address is secure and single.",
									body: "Every way of typing it arrives at one page, which keeps search from splitting the bakery in two.",
									win: true,
								},
							],
							shot: {
								src: "/images/writeup-search.svg",
								alt: "Search results for the bakery's site, six results all titled Home",
								href: "/images/writeup-search.svg",
								caption: "Six pages, one title",
							},
						},
					],
					sources: [
						{ label: "Search Console", href: "https://search.google.com/search-console" },
						{ label: "The site itself" },
					],
				},
				{
					kind: "topic",
					id: "kh-core-web-vitals",
					title: "Core Web Vitals",
					href: "https://web.dev/articles/vitals",
					oneLiner: "How long a phone waits before the page is there to read.",
					grade: "c",
					why: "The first screen draws past the four second line on a phone.",
					blocks: [
						{
							kind: "scale",
							title: "The First Screen",
							lead: "Seconds until the largest thing on the page draws.",
							max: 8,
							zones: [
								{ label: "Good", upTo: 2.5, tone: "good" },
								{ label: "Slow", upTo: 4, tone: "warn" },
								{ label: "Poor", tone: "bad" },
							],
							ticks: [
								{ at: 2.5, label: "2.5 s" },
								{ at: 4, label: "4 s" },
							],
							readings: [
								{ label: "Phone", value: 4.6, display: "4.6 s", tone: "bad" },
								{ label: "Desktop", value: 1.8, display: "1.8 s", tone: "good" },
							],
						},
						{
							kind: "table",
							title: "Page by Page",
							columns: [
								{ label: "Page" },
								{ label: "Phone", align: "right", sortable: true, firstSort: "desc" },
								{ label: "Loads", align: "center" },
							],
							sort: { column: 1, direction: "desc" },
							rows: [
								{ cells: ["Menu", { display: "6.8 s", sort: 6.8 }, { mark: "bad", text: "Slow" }] },
								{
									cells: ["Home", { display: "4.6 s", sort: 4.6 }, { mark: "warn", text: "Slow" }],
								},
								{
									cells: ["Cakes", { display: "3.1 s", sort: 3.1 }, { mark: "warn", text: "Slow" }],
								},
								{
									cells: [
										"Visit",
										{ display: "1.9 s", sort: 1.9 },
										{ mark: "good", text: "Loads" },
									],
								},
							],
							note: "The menu's weight is one 4.2 MB photo of the chalkboard.",
						},
					],
					sources: [{ label: "PageSpeed Insights", href: "https://pagespeed.web.dev/" }],
				},
			],
		},
		{
			id: "kh-visibility",
			blocks: [
				{
					kind: "part",
					id: "kh-part-visibility",
					title: "Visibility",
					lead: "When someone nearby wants bread, does the bakery come up?",
				},
				{
					kind: "topic",
					id: "kh-organic-seo",
					title: "Organic SEO",
					oneLiner: "Showing up in the plain search results, unpaid.",
					grade: "c",
					why: "People who already know the name find it; people looking for bread mostly do not.",
					blocks: [
						{
							kind: "stats",
							items: [
								{
									value: "11,175",
									label: "Times shown",
									period: "2026 Q3",
									deltas: [
										{
											direction: "up",
											change: "9%",
											basis: "YoY",
											basisTitle: "year over year",
											was: "10,252",
											tone: "good",
										},
									],
								},
								{ value: "1,020", label: "Clicks", period: "2026 Q3" },
								{ value: "9.1%", label: "Click rate", period: "2026 Q3" },
							],
						},
						{
							kind: "table",
							title: "What People Searched",
							columns: [
								{ label: "Search" },
								{ label: "Shown", align: "right", sortable: true, firstSort: "desc" },
								{ label: "Clicks", align: "right", sortable: true, firstSort: "desc" },
							],
							sort: { column: 1, direction: "desc" },
							rows: [
								{ cells: ["sourdough near me", "4,820", "212"] },
								{ cells: ["kestrel hollow bakehouse", "1,960", "731"] },
								{ cells: ["birthday cake order", "2,340", "58"] },
								{ cells: ["wedding cake tasting", "880", "0"], tone: "bad" },
							],
						},
						{
							kind: "columns",
							title: "Clicks a Month",
							legend: [
								{ label: "The same quarter, a year apart", tone: "info" },
								{ label: "The quarter between", tone: "muted" },
							],
							groups: [
								{
									label: "2025 Q3",
									total: "938",
									tone: "info",
									bars: [
										{ label: "Jul", value: 296 },
										{ label: "Aug", value: 311 },
										{ label: "Sep", value: 331 },
									],
								},
								{
									label: "2026 Q2",
									total: "984",
									bars: [
										{ label: "Apr", value: 318 },
										{ label: "May", value: 329 },
										{ label: "Jun", value: 337 },
									],
								},
								{
									label: "2026 Q3",
									total: "1,020",
									tone: "info",
									bars: [
										{ label: "Jul", value: 326 },
										{ label: "Aug", value: 342 },
										{ label: "Sep", value: 352 },
									],
								},
							],
						},
					],
					sources: [{ label: "Search Console", href: "https://search.google.com/search-console" }],
				},
				{
					kind: "topic",
					id: "kh-local-seo",
					title: "Local SEO",
					oneLiner: "Showing up on the map, with the right hours, when someone nearby looks.",
					grade: "c",
					why: "The listing is strong on reviews and wrong on Sunday.",
					blocks: [
						{
							kind: "findings",
							items: [
								{
									lead: "The map listing says closed on Sunday.",
									body: "The site says 08:00 to 14:00, so the Sunday crowd reads the one that turns them away.",
									box: true,
								},
								{
									lead: "212 reviews at 4.7, every one answered.",
									body: "The strongest thing the bakery has online, and the owner already keeps it up.",
									win: true,
								},
							],
							shot: {
								src: "/images/writeup-listing.svg",
								alt: "The bakery's map listing on a phone, Sunday marked closed",
								href: "/images/writeup-listing.svg",
								caption: "The listing's hours",
							},
						},
						{
							kind: "table",
							title: "Where the Bakery Is Listed",
							columns: [
								{ label: "Directory" },
								{ label: "Rating", align: "right", sortable: true, firstSort: "desc" },
								{ label: "Hours Right", align: "center", sortable: true },
							],
							rows: [
								{
									cells: ["Google", ratingCell(4.7, "good"), { mark: "bad", text: "Sunday wrong" }],
								},
								{ cells: ["Apple Maps", ratingCell(4.5), { mark: "good", text: "Right" }] },
								{ cells: ["Yelp", ratingCell(4.0), { mark: "warn", text: "Summer hours" }] },
								{ cells: ["Bing", ratingCell(4.4), { mark: "none", text: "Not listed" }] },
							],
						},
					],
					sources: [{ label: "Business Profile", href: "https://business.google.com/" }],
				},
				{
					kind: "topic",
					id: "kh-geo",
					title: "GEO",
					oneLiner: "Being the name an AI answer gives when someone asks where to buy bread.",
					grade: "d",
					why: "Asked five ways, no AI answer named the bakery once.",
					bullets: [
						{
							lead: "No AI answer names the bakery.",
							body: "Asked for the best sourdough on Alder Street, every answer named two bakeries across town.",
						},
						{
							lead: "Nothing on the site says what it bakes in words.",
							body: "The menu is a picture, so there is nothing for an answer to quote.",
							tone: "info",
						},
					],
					noShot: true,
					sources: [{ label: "Five AI assistants, asked on 2026-10-12" }],
				},
				{
					kind: "markets",
					title: "Neighborhood by Neighborhood",
					lead: "One row a neighborhood the bakery delivers to, one letter a surface.",
					columns: ["Map", "Search", "AI"],
					rows: [
						{
							market: "Five Points",
							place: "Home",
							grades: ["b", "b", "d"],
							read: "Found on the map, missed by the answers.",
						},
						{ market: "Cole", grades: ["c", "c", "d"], read: "Ranks below two chains." },
						{
							market: "Whittier",
							grades: ["c", null, "d"],
							read: "Search not read for this one.",
						},
					],
				},
			],
		},
		{
			id: "kh-conversion",
			blocks: [
				{
					kind: "part",
					id: "kh-part-conversion",
					title: "Conversion",
					lead: "Once someone arrives, do they order, and would anyone know?",
				},
				{
					kind: "topic",
					id: "kh-analytics",
					title: "Analytics and Conversion Tracking",
					oneLiner: "Counting the visits, and the orders and calls they turn into.",
					grade: "c",
					why: "Visits are counted; the order button and the phone number are not.",
					blocks: [
						{
							kind: "checks",
							items: [
								{ label: "Visits counted", pass: true },
								{
									label: "Orders counted",
									detail: "The order button is not tracked.",
									pass: false,
								},
								{ label: "Calls counted", pass: false },
							],
						},
						{
							kind: "bar",
							title: "Where Visits Came From",
							segments: [
								{ label: "search", value: 1840, display: "1,840", tone: "good" },
								{ label: "the map", value: 1210, display: "1,210", tone: "info" },
								{ label: "typed in", value: 640, display: "640", tone: "muted" },
								{ label: "ads", value: 310, display: "310", tone: "warn" },
							],
						},
						{
							kind: "more",
							label: "Every Event the Site Sends",
							summary: "Four events, and none of them is an order.",
							blocks: [
								{
									kind: "table",
									columns: [
										{ label: "Event" },
										{ label: "Last Month", align: "right", sortable: true, firstSort: "desc" },
										{ label: "Useful", align: "center" },
									],
									rows: [
										{ cells: ["page_view", "4,000", { mark: "good", text: "Yes" }] },
										{ cells: ["scroll", "2,214", { mark: "warn", text: "Somewhat" }] },
										{ cells: ["click", "906", { mark: "warn", text: "Somewhat" }] },
										{ cells: ["first_visit", "2,980", { mark: "good", text: "Yes" }] },
									],
								},
							],
						},
					],
					sources: [{ label: "Analytics, read from the page" }],
				},
				{
					kind: "topic",
					id: "kh-cro",
					title: "CRO",
					oneLiner: "How easily a visitor becomes an order.",
					grade: "b",
					why: "Ordering ahead is quick; the menu on the way there is not.",
					blocks: [
						{
							kind: "findings",
							items: [
								{
									lead: "Ordering ahead takes three taps.",
									body: "From the home page to a paid order in under a minute on a phone.",
									win: true,
								},
								{
									lead: "The menu is a photo of the chalkboard.",
									body: "On a phone it has to be pinched to read, so the order often starts without it.",
								},
							],
						},
						{
							kind: "shots",
							title: "On a Phone",
							shots: [
								{
									src: "/images/note-menu.svg",
									alt: "The menu page on a phone, a dark photo of a chalkboard",
									href: "/images/note-menu.svg",
									caption: "The menu",
								},
								{
									src: "/images/writeup-listing.svg",
									alt: "The map listing on a phone",
									caption: "The listing",
								},
							],
						},
					],
					sources: [{ label: "The site, walked on a phone" }],
				},
				{
					kind: "rented",
					text: "$1,860 on search ads for the quarter, bringing 310 visits. Paid reach is rented, so it is reported here and never graded.",
				},
			],
		},
	],
	close: {
		signOff: "Reliably Yours,",
		person,
		twin: {
			line: "The hosted copy, with every link live, is at ",
			domain: "kestrel-hollow.example.test",
			qrSrc: "/images/writeup-qr.svg",
		},
	},
};

const report: ReportProps = {
	title: "Kestrel Hollow Bakehouse",
	period: "September 2026",
	leads: {
		cameIn: {
			figure: "31 orders",
			sentence: "Online orders and catering requests through the site, eight more than August.",
		},
		fromWhere: {
			figure: "19 from search",
			sentence: "Search brought the most, the map listing nine, and the ads three.",
		},
		cost: {
			figure: "$620",
			sentence: "The month's search ads, down from $740 as the unpaid results took over.",
		},
		closed: {
			figure: "$4,180",
			sentence: "What those orders came to, two wedding cakes among them.",
		},
	},
	grades: [
		{
			tier: "Health",
			section: "Technical SEO",
			now: "a",
			lastMonth: "b",
			baseline: "c",
			moved: "Every page has a title of its own.",
		},
		{
			tier: "Health",
			section: "Core Web Vitals",
			now: "b",
			lastMonth: "c",
			baseline: "c",
			moved: "The menu is text now; a phone waits 2.2 seconds.",
		},
		{
			tier: "Visibility",
			section: "Organic SEO",
			now: "b",
			lastMonth: "c",
			baseline: "c",
			moved: "Shown for sourdough near me on the first page.",
		},
		{
			tier: "Visibility",
			section: "Local SEO",
			now: "a",
			lastMonth: "b",
			baseline: "c",
			moved: "The hours agree everywhere, Sunday included.",
		},
		{
			tier: "Visibility",
			section: "GEO",
			now: "c",
			lastMonth: "d",
			baseline: "d",
			moved: "One answer in five now names the bakery.",
		},
		{
			tier: "Conversion",
			section: "Analytics and Conversion Tracking",
			now: "a",
			lastMonth: "a",
			baseline: "c",
			moved: "Steady; orders and calls are both counted.",
		},
		{
			tier: "Conversion",
			section: "CRO",
			now: "b",
			lastMonth: "b",
			baseline: "b",
			moved: "No change this month.",
		},
	],
	close: { signOff: "Reliably Yours,", person },
};

/*
 * A first touch note, as a routine would write it: plain data throughout.
 */
const note: NoteProps = {
	title: "A Note for Kestrel Hollow Bakehouse",
	preparedFor: "Kestrel Hollow Bakehouse",
	date: "2026-10-09",
	opener: [
		"I walked past Kestrel Hollow on Alder Street on Tuesday morning, and the line out the door for the morning buns said everything about the bread. ",
		"Online, though, the bakery is harder to find than it is on the sidewalk, and a few small fixes would close that gap.",
	],
	lanes: [
		{
			heading: "What your customer sees",
			findings: [
				{
					lead: "The menu is a photo of the chalkboard.",
					body: "On a phone it weighs 4.2 MB and has to be pinched to read, so someone choosing lunch from the bus stop gives up before finding the soup.",
					shot: {
						src: "/images/note-menu.svg",
						alt: "The menu page on a phone: a dark photo of a chalkboard, too small to read",
						href: "/images/note-menu.svg",
						caption: "The menu page at phone width",
					},
				},
				{
					lead: "Sunday hours disagree.",
					body: "The site says 08:00 to 14:00 and the map listing says closed, so the Sunday crowd reads the one that turns them away.",
				},
			],
		},
		{
			heading: "What I see under the hood",
			findings: [
				{
					lead: "Every page is titled Home.",
					body: "Search shows the same word for all six pages, so nothing tells Google, or anyone scanning the results, that this is a bakery on Alder Street.",
				},
				{
					lead: "A phone waits 6.8 seconds for the first screen.",
					body: "Most of it is the chalkboard photo and three fonts the site never uses; on a cell signal that is long enough to hit back.",
					href: "https://pagespeed.web.dev/",
				},
			],
		},
	],
	start: {
		lead: "I would start by:",
		items: [
			{
				lead: "Setting the menu as text,",
				body: "so it reads on any phone and search can find the soup.",
			},
			{ lead: "Making the hours agree everywhere,", body: "starting with the map listing." },
			{
				lead: "Giving each page a real title:",
				body: "the bakery's name and what the page is for.",
			},
		],
	},
	close: {
		paragraphs: [
			[
				"My name is Matthew and I run ",
				{ text: "Atelic", href: "https://atelic.me" },
				", a small Denver shop that helps companies grow by managing how they show up on the web.",
			],
			[
				"If any of this is useful, ",
				{ text: "grab a time that suits you", href: "https://meet.atelic.me" },
				" and I will walk you through it. If not, no worries at all, and thank you for the morning buns.",
			],
		],
		signOff: "Reliably Yours,",
		person,
	},
};

const SEALED_KEY = "gallery-gate-email";

/** The Gate remembers a reader's address, so the example clears it on mount and stays sealed. */
function SealedGate() {
	useState(() => {
		try {
			globalThis.localStorage?.removeItem(SEALED_KEY);
		} catch {
			// Storage blocked: nothing was remembered.
		}
	});
	return (
		<Gate
			payload={payload as GatePayload}
			queryParam="gallery-email"
			storageKey={SEALED_KEY}
			sub="This document opens with the email address it was sent to. Here, that is reader@example.test."
			placeholder="reader@example.test"
		/>
	);
}

export function DocumentPieces() {
	return (
		<>
			<Piece
				id="writeup"
				title="Writeup"
				lead="The graded document an owner gets: an overview that links into every section, then the three tiers, each section a card of small blocks (checks, tables, a scale, stats, columns, a bar, findings beside the owner's screens, a fold) with the sources it was read from. It prints to letter pages with the chrome dropped."
			>
				<Example caption="A whole writeup: seven sections, every block kind, the markets table, and the rented line">
					<div className="gallery-document">
						<Writeup {...writeup} />
					</div>
				</Example>
			</Piece>

			<Piece
				id="report"
				title="Report"
				lead="The monthly page an Operate client gets: the period and the four questions the work answers, each a figure and a sentence, then the seven grades against last month and the baseline, then the sign off. One letter sheet in print."
			>
				<Example caption="A month, with what moved since the baseline">
					<div className="gallery-document">
						<Report {...report} />
					</div>
				</Example>
			</Piece>

			<Piece
				id="note"
				title="Note"
				lead="The first touch, for a business whose site publishes no email address, set as a short page at /notes: the opener, what the customer sees and what sits under the hood, where the work would start, and the close. It reads on a phone first and prints to one letter sheet, and every prop is plain data a routine can write as JSON."
			>
				<Example caption="Two lanes, one finding with the owner's screen under it, one linked">
					<div className="gallery-document">
						<Note {...note} />
					</div>
				</Example>
			</Piece>

			<Piece
				id="gate"
				title="Gate"
				lead="A sealed document: the page carries only ciphertext, and the reader's own email address derives the key that opens it in the browser, with no server to ask. This one was sealed with the package's own sealing command for a made up reader; type reader@example.test to open it. Inside is a proposal's price section: three tier cards with the credit's arithmetic and its mark, icon lists in each card, the two monthly cards side by side beneath them, and the footnote that says what the credit is for."
			>
				<Example caption="Sealed, before the address is typed; opened, the tiers, the monthly row, and the footnote">
					<div className="gallery-document gallery-sealed">
						<SealedGate />
					</div>
				</Example>
			</Piece>
		</>
	);
}
