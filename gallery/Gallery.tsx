import { Globe, Link, MapPin, Plug } from "lucide-react";
import { useState } from "react";
import { name as packageName, version } from "../package.json";
import { CreditBar, type PageStop, SiteHeader, SkipLink } from "../src/chrome";
import {
	Callout,
	Checklist,
	ColumnChart,
	DataTable,
	type DataTableColumn,
	type DataTableRow,
	Disclosure,
	GateLogin,
	Hint,
	IconList,
	Rank,
	StackedBar,
	StarRating,
	StatRow,
	ThresholdScale,
	type Tone,
} from "../src/components";
import { Button, Chip, Eyebrow, Lead, SectionHeading } from "../src/primitives";
import { ArtifactPieces } from "./artifact";
import { ChromePieces } from "./chrome";
import { EmailPiece } from "./email";
import { MarketingOffer } from "./marketing-offer";
import { MarketingOpeners } from "./marketing-openers";
import { MarketingPrimitives } from "./marketing-primitives";
import { MarketingProof } from "./marketing-proof";
import { MarketingVisit } from "./marketing-visit";
import { MarketingWriting } from "./marketing-writing";
import { NotFoundPiece } from "./not-found";
import { Example, Piece } from "./parts";
import { TabsPiece } from "./tabs";
import { WatermarkPiece } from "./watermark";

/*
 * Every figure and name on this page is made up, save the sign off's
 * sender, which is the practice's own close. The business throughout is
 * Kestrel Hollow Bakehouse, a fictional neighborhood bakery. The pieces for
 * the chrome, the not found page, the watermark, the artifact pieces, and
 * the email live in files of their own beside this one, each mounted below
 * with one element.
 */

const stops: PageStop[] = [
	{ id: "site-header", label: "SiteHeader" },
	{ id: "site-menu", label: "SiteMenu" },
	{ id: "footer", label: "Footer" },
	{ id: "credit-bar", label: "CreditBar" },
	{ id: "sticky-cta-bar", label: "StickyCTABar" },
	{ id: "brand-lockup", label: "BrandLockup" },
	{ id: "skip-link", label: "SkipLink" },
	{ id: "not-found", label: "NotFound" },
	{ id: "checklist", label: "Checklist" },
	{ id: "icon-list", label: "IconList" },
	{ id: "data-table", label: "DataTable" },
	{ id: "hint", label: "Hint" },
	{ id: "rank", label: "Rank" },
	{ id: "stat-row", label: "StatRow" },
	{ id: "callout", label: "Callout" },
	{ id: "disclosure", label: "Disclosure" },
	{ id: "tabs", label: "Tabs" },
	{ id: "stacked-bar", label: "StackedBar" },
	{ id: "column-chart", label: "ColumnChart" },
	{ id: "threshold-scale", label: "ThresholdScale" },
	{ id: "star-rating", label: "StarRating" },
	{ id: "gate-login", label: "GateLogin" },
	{ id: "watermark", label: "Watermark" },
	{ id: "grade-chip", label: "GradeChip" },
	{ id: "report-card", label: "ReportCard" },
	{ id: "sign-off", label: "SignOff" },
	{ id: "shot", label: "Shot" },
	{ id: "paragraph", label: "Paragraph" },
	{ id: "email", label: "Email" },
	{ id: "primitives", label: "Primitives" },
	{ id: "tones", label: "Tones" },
];

function Aisles() {
	const [open, setOpen] = useState<Record<string, boolean>>({ breads: true });
	const aisles = [
		{ key: "breads", label: "Breads", items: ["Country sourdough", "Seeded rye", "Baguette"] },
		{ key: "pastry", label: "Pastry", items: ["Croissant", "Morning bun"] },
	];
	return (
		<div style={{ display: "grid", gap: 12 }}>
			{aisles.map((aisle) => (
				<Disclosure
					key={aisle.key}
					label={aisle.label}
					meta={<span className="gallery-count">{aisle.items.length}</span>}
					headingLevel={3}
					open={Boolean(open[aisle.key])}
					onToggle={() => setOpen((was) => ({ ...was, [aisle.key]: !was[aisle.key] }))}
				>
					<ul className="gallery-rows">
						{aisle.items.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</Disclosure>
			))}
		</div>
	);
}

function EditableStars() {
	const [rating, setRating] = useState<number | null>(4);
	return <StarRating value={rating} onChange={setRating} />;
}

const searchColumns: DataTableColumn[] = [
	{ label: "Search" },
	{ label: "Times shown", align: "right", sortable: true, firstSort: "desc" },
	{ label: "Clicks", align: "right", sortable: true, firstSort: "desc" },
	{ label: "Click rate", align: "right", sortable: true, firstSort: "desc" },
];

const searchRows: DataTableRow[] = [
	{ cells: ["sourdough near me", "4,820", "212", "4.4%"] },
	{ cells: ["kestrel hollow bakehouse", "1,960", "731", "37.3%"] },
	{ cells: ["birthday cake order", "2,340", "58", "2.48%"] },
	{ cells: ["gluten free bread", "1,175", "19", "1.62%"] },
	{ cells: ["wedding cake tasting", "880", "0", "0%"], tone: "bad" },
];

const tones: Array<{ tone: Tone; reads: string }> = [
	{ tone: "good", reads: "Working, or good news" },
	{ tone: "warn", reads: "Needs work" },
	{ tone: "bad", reads: "Broken, or bad news" },
	{ tone: "info", reads: "Plain information, in the theme's primary" },
	{ tone: "muted", reads: "Quiet, in the theme's neutrals" },
];

/*
 * The components as an app wears them: outside the site canvas, under the
 * `.atelic-ui` class on a region of its own, on tokens the region maps for
 * itself. An app imports components.css alone; this page also imports
 * base.css, as a site does, so its resets reach here too, and the region's
 * own unlayered rules win over them.
 */
function InAnApp() {
	return (
		<aside className="atelic-ui gallery-app" aria-labelledby="in-an-app-title">
			<h2 id="in-an-app-title">In an App</h2>
			<p>
				The same components outside the site canvas, under <code>.atelic-ui</code> alone, on a
				darker set of tokens this region maps for itself.
			</p>
			<StatRow
				stats={[
					{ value: "1,284", label: "Loaves baked", period: "this week" },
					{ value: "92%", label: "Sold by noon", tone: "good" },
				]}
			/>
			<StackedBar
				segments={[
					{ label: "flour", value: 520, display: "520 g", color: "#f4efe6" },
					{ label: "water", value: 380, display: "380 g", color: "#a39d90" },
					{ label: "starter", value: 100, display: "100 g", color: "#5e5a52" },
				]}
			/>
			<Callout tone="warn" title="The proofing room runs warm.">
				Two batches overproofed on Tuesday.
			</Callout>
			<Disclosure label="This week" summary="The sourdough moved to a cold proof.">
				<p>The sourdough moved to an overnight cold proof.</p>
			</Disclosure>
		</aside>
	);
}

export function Gallery() {
	return (
		<>
			<div className="atelic-ui gallery-page">
				<SkipLink />
				<SiteHeader
					brand={{
						name: "Atelic",
						href: "https://atelic.me",
						logo: { wordmark: "atelic", run: true },
					}}
					variant="dark"
					stops={stops}
				/>
				<main id="main">
					<header className="gallery-head">
						<div className="wrap">
							<h1>The Components</h1>
							<p className="gallery-meta">
								{packageName} {version}
							</p>
							<p className="gallery-intro">
								Everything the package exports that draws, each on its own with made up data for a
								fictional bakery: the chrome, the page components, the pieces a document is built
								from, and the email. The composed documents live in @atelic-action/artifact.
								Everything here renders from the package's own source, so what you see is what the
								next release ships.
							</p>
							<p className="gallery-intro">
								The app shell has <a href="/app">a page of its own</a>.
							</p>
						</div>
					</header>

					<ChromePieces />
					<NotFoundPiece />

					<Piece
						id="checklist"
						title="Checklist"
						lead="A short list of checks, each passed or failed. Reach for it when the reader needs the verdicts at a glance and a line on each; it runs in two columns when there is room and one on a phone."
					>
						<Example>
							<Checklist
								items={[
									{
										label: "Secure connection",
										detail: "The certificate is valid through 2027-05-14.",
										pass: true,
									},
									{
										label: "One home address",
										detail: "Every way of typing the address lands on the same page.",
										pass: true,
									},
									{
										label: "A dead link on the menu page",
										detail: "Of 48 links checked, the catering form leads nowhere.",
										pass: false,
									},
									{ label: "A title on every page", pass: true },
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="icon-list"
						title="IconList"
						lead="A list whose bullets are icons. One icon and tone for the whole list, or one per item, when each line is a different kind of thing: a list of recommendations, each led by what it touches."
					>
						<Example>
							<IconList
								icon={<Globe size={16} />}
								tone="warn"
								items={[
									{
										body: "old.example.com, the previous site, still live with its own contact form.",
									},
									{ body: "test.example.com, a one line test page." },
									{ body: "staging.example.com, a build in progress.", tone: "info" },
								]}
							/>
						</Example>
						<Example>
							<IconList
								items={[
									{ icon: <Plug size={16} />, body: "Install the SEO plugin and set it once." },
									{
										icon: <MapPin size={16} />,
										body: "Keep a neighborhood page only where five or more jobs sit behind it.",
									},
									{
										icon: <Link size={16} />,
										body: "Fix the Florida link so it forwards to the Florida site.",
										tone: "good",
									},
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="data-table"
						title="DataTable"
						lead="A table whose first column names each row and whose number columns sort. Use it for anything a reader will want to rank; on a wide screen a heading sorts it, and on a phone each row stacks and a dropdown sorts."
					>
						<Example caption="Sorted by default, most shown first">
							<DataTable
								columns={searchColumns}
								rows={searchRows.map(({ cells }) => ({ cells }))}
								defaultSort={{ column: 1, direction: "desc" }}
							/>
						</Example>
						<Example caption="With a row tone, listed as given">
							<DataTable columns={searchColumns} rows={searchRows} />
						</Example>
						<Example caption="A hint on each figure column, before the heading when it is right aligned">
							<DataTable
								columns={[
									{ label: "Page" },
									{
										label: "First paint",
										align: "right",
										hint: "The first moment anything appears on the screen. Google draws its line for good at 1.8 s.",
									},
									{
										label: "Main content",
										align: "right",
										hint: "When the biggest thing on the screen has arrived. Google draws its line at 2.5 s.",
									},
								]}
								rows={[
									{ cells: ["Home", "2.3 s", "4.1 s"] },
									{ cells: ["Menu", "1.2 s", "1.9 s"] },
								]}
							/>
						</Example>
						<Example caption="An empty cell draws a dash and sorts last, and a column can name it for a screen reader">
							<DataTable
								columns={[
									{ label: "Bake" },
									{ label: "Orders", align: "right", sortable: true, firstSort: "desc" },
									{ label: "Rating", align: "right", sortable: true, emptyLabel: "Not rated" },
								]}
								rows={[
									{ cells: ["Country sourdough", "64", "4.8"] },
									{ cells: ["Seeded rye", null, "4.6"] },
									{ cells: ["Morning bun", "41", null] },
								]}
								defaultSort={{ column: 2, direction: "desc" }}
							/>
						</Example>
					</Piece>

					<Piece
						id="hint"
						title="Hint"
						lead="An info icon beside a word that opens a short explainer. It opens on hover or focus, stays open on a click or a tap, closes on Escape or a tap elsewhere, and slides left when the bubble would run off the screen. Print hides it. A table column takes one as its hint, shown wide, since the heading row is hidden on a phone."
					>
						<Example caption="Beside a word, and before one">
							<p>
								Frozen for
								<Hint label="About frozen for">
									How long the page ignores a tap or a scroll while its scripts run. Google draws
									its line at 0.2 s.
								</Hint>
							</p>
							<p>
								<Hint label="About layout shift" side="before">
									How much the page jumps around while it loads. Google draws its line at 0.1.
								</Hint>
								Layout shift
							</p>
						</Example>
					</Piece>

					<Piece
						id="rank"
						title="Rank"
						lead="A figure with its badge, for a table cell: a rank, a place in an answer, or a dash for none, each in a tone, linked when it has somewhere to go. The figure's slot is a fixed width, so every rank in a column is the same width and the badges line up down it."
					>
						<Example caption="Where each search lands, on two sites">
							<DataTable
								columns={[
									{ label: "Search" },
									{ label: "Main site", align: "right" },
									{ label: "Bakehouse site", align: "right" },
								]}
								rows={[
									{
										cells: [
											"sourdough near me",
											<Rank key="a" figure="2" tone="good" meaning="Top three" href="#rank" />,
											<Rank
												key="b"
												figure="14"
												tone="bad"
												meaning="Beyond the top ten"
												href="#rank"
											/>,
										],
									},
									{
										cells: [
											"bakery denver",
											<Rank key="a" figure="7" tone="warn" meaning="Top ten" href="#rank" />,
											<Rank key="b" figure="–" tone="bad" meaning="Not ranked" />,
										],
									},
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="stat-row"
						title="StatRow"
						lead="A row of large figures, each over what it counts and its period. Reach for it to open a section with the numbers that matter; deltas set each figure against an earlier one, and a trend arrow marks a figure that is itself a change."
					>
						<Example caption="With deltas, year over year and quarter over quarter">
							<StatRow
								stats={[
									{
										value: "1,284",
										label: "Online orders",
										period: "2026 Q3",
										deltas: [
											{
												direction: "up",
												change: "17%",
												basis: "YoY",
												basisTitle: "year over year",
												was: "1,102",
												tone: "good",
											},
											{
												direction: "up",
												change: "8%",
												basis: "QoQ",
												basisTitle: "quarter over quarter",
												was: "1,190",
												tone: "good",
											},
										],
									},
									{
										value: "$1,860",
										label: "Ad spend",
										period: "2026 Q3",
										deltas: [
											{
												direction: "down",
												change: "12%",
												basis: "YoY",
												basisTitle: "year over year",
												was: "$2,114",
												tone: "good",
											},
											{
												direction: "down",
												change: "6%",
												basis: "QoQ",
												basisTitle: "quarter over quarter",
												was: "$1,975",
											},
										],
									},
									{
										value: "4.7",
										label: "Review rating",
										period: "2026 Q3",
										deltas: [
											{
												direction: "flat",
												change: "0.0",
												basis: "YoY",
												basisTitle: "year over year",
												was: "4.7",
											},
											{
												direction: "down",
												change: "0.1",
												basis: "QoQ",
												basisTitle: "quarter over quarter",
												was: "4.8",
												tone: "warn",
											},
										],
										note: "From 212 reviews",
									},
								]}
							/>
						</Example>
						<Example caption="With a trend, where the figure is the change">
							<StatRow
								stats={[
									{ value: "18%", trend: "up", tone: "good", label: "More calls", period: "QoQ" },
									{
										value: "31%",
										trend: "down",
										tone: "bad",
										label: "Fewer reviews answered",
										period: "QoQ",
									},
									{
										value: "0%",
										trend: "flat",
										tone: "muted",
										label: "Change in directions asked",
										period: "QoQ",
									},
								]}
							/>
						</Example>
						<Example caption="Quiet: a glance row for a working page, with a unit and one figure in the accent">
							<StatRow
								variant="quiet"
								stats={[
									{ value: "148", label: "Loaves on the rack" },
									{ value: "9", label: "Running low", tone: "info" },
									{ value: "36.5", unit: "kg", label: "Flour used" },
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="callout"
						title="Callout"
						lead="One finding: an icon in its tone beside the title, the explainer under it. Use the plain form in a list of findings, and the boxed form for something missing or owed that the reader must not miss."
					>
						<Example caption="The four tones">
							<div className="gallery-stack">
								<Callout tone="good" title="Customers find you by name.">
									A search for the bakery's name puts the site first and the map listing beside it.
								</Callout>
								<Callout tone="warn" title="Most of the wait is the server.">
									A phone waits 3.1 seconds for the first byte before anything draws.
								</Callout>
								<Callout tone="bad" title="The catering form goes nowhere.">
									It submits without an error and nobody receives the message.
								</Callout>
								<Callout tone="info" title="Saturdays carry the week.">
									Two in five online orders land between Friday evening and Saturday noon.
								</Callout>
							</div>
						</Example>
						<Example caption="Boxed">
							<Callout tone="info" variant="box" title="Missing: the analytics account.">
								Without access we read only what the site sends, so the section on visits stays
								empty until it is shared.
							</Callout>
						</Example>
					</Piece>

					<Piece
						id="disclosure"
						title="Disclosure"
						lead="A section the reader opens and closes, in two forms. Held by the caller (open and onToggle), it is an app's card: the page remembers which are open, a closed body is not rendered, and a count beside the label stays out of its name. Left to the browser, it is a document's fold: a native details element whose summary carries the point, which works before any script loads, opens for find in page, and prints open."
					>
						<Example caption="Controlled: an app's sections, the open ones held by the page">
							<Aisles />
						</Example>
						<Example caption="Native, closed by default">
							<Disclosure
								label="Your Main Pages"
								summary="All six load quickly and every one is on Google."
							>
								<p>
									Home, Menu, Cakes, Catering, Visit, and About each answered in under a second and
									each appears in search.
								</p>
							</Disclosure>
						</Example>
						<Example caption="Native, open by default">
							<Disclosure
								label="Your Opening Hours"
								summary="Three listings disagree about Sunday."
								defaultOpen
							>
								<p>
									The site says 08:00 to 14:00, the map listing says closed, and one directory still
									shows the summer hours. Anything can sit inside: a table, a chart, or a picture.
								</p>
							</Disclosure>
						</Example>
					</Piece>

					<TabsPiece />

					<Piece
						id="stacked-bar"
						title="StackedBar"
						lead="One bar split into the parts of a whole, with a key naming each part and its figure. Use it when the parts add up to something the reader already knows, like every page a search engine has seen."
					>
						<Example>
							<StackedBar
								segments={[
									{ label: "on Google", value: 164, tone: "good" },
									{ label: "thin pages", value: 22, tone: "warn" },
									{ label: "broken", value: 6, tone: "bad" },
									{ label: "routine exclusions", value: 41, tone: "muted" },
								]}
							/>
						</Example>
						<Example caption="Parts in colors of their own, for parts that are not good or bad">
							<StackedBar
								segments={[
									{ label: "flour", value: 520, display: "520 g", color: "#151515" },
									{ label: "water", value: 380, display: "380 g", color: "#6f6a60" },
									{ label: "starter", value: 100, display: "100 g", color: "#c9c2b3" },
								]}
							/>
						</Example>
						<Example caption="The bar alone, for a page that keys the parts its own way">
							<StackedBar
								showKey={false}
								segments={[
									{ label: "flour", value: 520, display: "520 g", color: "#151515" },
									{ label: "water", value: 380, display: "380 g", color: "#6f6a60" },
									{ label: "starter", value: 100, display: "100 g", color: "#c9c2b3" },
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="column-chart"
						title="ColumnChart"
						lead="A bar a period, the periods in groups that carry a label and a total. Months in quarters is the case it was cut for: a quarter reads against the one before it and the same one a year earlier."
					>
						<Example>
							<ColumnChart
								legend={[
									{ label: "The same quarter, a year apart", tone: "info" },
									{ label: "The quarter between", tone: "muted" },
								]}
								groups={[
									{
										label: "2025 Q3",
										total: "1,102",
										tone: "info",
										bars: [
											{ label: "Jul", value: 341 },
											{ label: "Aug", value: 368 },
											{ label: "Sep", value: 393 },
										],
									},
									{
										label: "2026 Q2",
										total: "1,190",
										bars: [
											{ label: "Apr", value: 372 },
											{ label: "May", value: 405 },
											{ label: "Jun", value: 413 },
										],
									},
									{
										label: "2026 Q3",
										total: "1,284",
										tone: "info",
										bars: [
											{ label: "Jul", value: 398 },
											{ label: "Aug", value: 431 },
											{ label: "Sep", value: 455 },
										],
									},
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="threshold-scale"
						title="ThresholdScale"
						lead="Zones on a scale and a pin for each reading. Reach for it when a number is judged against fixed lines, like a load time against good and poor, so the reader sees how far over the line it sits."
					>
						<Example>
							<ThresholdScale
								max={8}
								zones={[
									{ label: "Good", upTo: 2.5, tone: "good" },
									{ label: "Slow", upTo: 4, tone: "warn" },
									{ label: "Poor", tone: "bad" },
								]}
								ticks={[
									{ at: 2.5, label: "2.5 s" },
									{ at: 4, label: "4 s" },
								]}
								readings={[
									{ label: "Phone", value: 4.6, display: "4.6 s", tone: "bad" },
									{ label: "Desktop", value: 1.8, display: "1.8 s", tone: "good" },
								]}
							/>
						</Example>
					</Piece>

					<Piece
						id="star-rating"
						title="StarRating"
						lead="A row of stars in half star steps. Given a handler it takes a rating: each star is two targets, the arrows move half a star, and picking the rating already set clears it. Without one it is a picture. The fill and the outline each take any color."
					>
						<Example caption="Editable, in the text color">
							<EditableStars />
						</Example>
						<Example caption="Read only">
							<StarRating value={3.5} />
						</Example>
						<Example caption="A fill and an outline of its own, on a smaller star">
							<StarRating
								value={4.5}
								fillColor="var(--primary)"
								outlineColor="var(--primary)"
								size={18}
							/>
						</Example>
						<Example caption="Unrated, on a scale of three">
							<StarRating value={null} max={3} fillColor="#d98c00" outlineColor="#d9b36a" />
						</Example>
					</Piece>

					<Piece
						id="gate-login"
						title="GateLogin"
						lead="The access gate's sign in screen: a reader on the allowlist asks for a link and the same confirmation shows whoever asks. It is a whole screen in a site, framed here to fit, and its button wears the site's own button classes. Its companion, Watermark, follows."
					>
						<Example caption="With an eyebrow, the copy a site passes, and the fine print">
							<div className="gallery-gate">
								<GateLogin
									brandName="Kestrel Hollow Bakehouse"
									eyebrow="Private"
									lead="Enter your email and we will send a private link to the writeup."
									builtBy="Atelic"
									contactEmail="hello@example.test"
									endpoint="/gallery-has-no-gate"
								/>
							</div>
						</Example>
					</Piece>

					<WatermarkPiece />
					<ArtifactPieces />
					<EmailPiece />

					<Piece
						id="primitives"
						title="Primitives"
						lead="The small pieces every page is set in: the button, the chip, the eyebrow, the lead paragraph, and the section heading that composes the last three. Each recolors from the theme tokens."
					>
						<Example caption="Button: primary, dark, and ghost; large; with the arrow">
							<div className="gallery-row">
								<Button href="#primitives">Order ahead</Button>
								<Button href="#primitives" variant="dark">
									See the menu
								</Button>
								<Button href="#primitives" variant="ghost">
									Our story
								</Button>
								<Button href="#primitives" size="lg" arrow>
									Order ahead
								</Button>
							</div>
						</Example>
						<Example caption="On a dark surface">
							<div className="gallery-row gallery-dark">
								<Button href="#primitives">Order ahead</Button>
								<Button href="#primitives" variant="ghost" onDark>
									Our story
								</Button>
								<Chip onDark dot>
									Open today
								</Chip>
								<Eyebrow onDark>Since 2014</Eyebrow>
							</div>
						</Example>
						<Example caption="Chip: plain, with a dot, and as a link">
							<div className="gallery-row">
								<Chip>Sourdough</Chip>
								<Chip dot>Baked this morning</Chip>
								<Chip href="#primitives">Wholesale</Chip>
							</div>
						</Example>
						<Example caption="SectionHeading: an eyebrow, a title, and a lead">
							<SectionHeading
								eyebrow="Wholesale"
								title="Bread for the places you already eat."
								lead="Eleven cafes and two grocers carry the morning bake, delivered before they open."
								as="h3"
							/>
						</Example>
						<Example caption="Lead, on its own">
							<Lead>
								Everything is mixed, shaped, and baked in the back of the shop on Alder Street.
							</Lead>
						</Example>
					</Piece>

					<Piece
						id="tones"
						title="Tones"
						lead={
							<>
								The one palette the package carries. Good, a warning, and broken read green, amber,
								and red whatever the brand is; info and muted come from the theme's own primary and
								neutrals. A component sets <code>data-tone</code>, and the color follows.
							</>
						}
					>
						<Example>
							<ul className="gallery-tones">
								{tones.map(({ tone, reads }) => (
									<li key={tone} data-tone={tone}>
										<span className="gallery-swatch" aria-hidden="true">
											<span />
										</span>
										<span className="gallery-tone-name">{tone}</span>
										<span className="gallery-tone-reads">{reads}</span>
									</li>
								))}
							</ul>
						</Example>
					</Piece>
					<MarketingOpeners />
					<MarketingOffer />
					<MarketingProof />
					<MarketingVisit />
					<MarketingWriting />
					<MarketingPrimitives />
				</main>
				<CreditBar />
			</div>
			<InAnApp />
		</>
	);
}
