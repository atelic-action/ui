import type { ArtifactConfig, WriteupPerson, WriteupShot } from "../../src/artifact";
import type {
	ColumnChartGroup,
	DataTableColumn,
	DataTableRow,
	ReportCardGroup,
	StackedBarSegment,
	StatItem,
	ThresholdReading,
	ThresholdZone,
} from "../../src/components";
import type { ProseBlock } from "../../src/primitives";
import { email } from "./bakery";

/*
 * The data the primitives, the components, and the artifact pieces are shown
 * with, all of it set in Kestrel Hollow Bakehouse (fixtures/bakery.ts). The
 * audit here is the bakery's own made up read: every grade, figure, and
 * query is invented, and the sender is a made up studio on example.com.
 */

/** The longest unbroken word a page is likely to carry: a German loaf name off an import list. */
export const longWord = "Vollkornroggensauerteigbrotmitsonnenblumenkernen";

/** The longest unbroken URL a page is likely to print. */
export const longURL =
	"https://kestrelhollow.example.com/menu/seasonal/autumn/the-whole-list-of-tarts-loaves-and-buns-for-every-saturday";

// ---- Prose ----

/** A ported journal post: headings at two levels, paragraphs, a list, and no figures. */
export const proseText: ProseBlock[] = [
	{ type: "h", text: "Why our rye rests two days" },
	{
		type: "p",
		text: "A rye dough has almost no gluten to hold it together, so it leans on its acid instead. The first day builds that acid; the second lets the crumb set so the loaf slices clean.",
	},
	{ type: "h", level: 3, text: "What the first day does" },
	{
		type: "p",
		text: "The starter goes in at six in the evening and the dough sits in the cool room overnight.",
	},
	{
		type: "ul",
		items: [
			"Whole rye from the mill on the river road",
			"Caraway, toasted that morning",
			"Salt, water, and nothing else",
		],
	},
	{ type: "h", level: 3, text: "What the second day does" },
	{
		type: "p",
		text: "Baked, the loaf rests wrapped in linen for a full day. Cut early, it is gummy; cut on time, it keeps for a week.",
	},
];

/** A row of three figures: a photograph, the morning clip, and one still owed. */
export const proseFigures: ProseBlock[] = [
	{
		type: "figure",
		src: "/images/bakery-loop-first-frame.jpg",
		alt: "The ovens at dawn, the first trays going in",
		caption: "The first trays, at five",
		width: 960,
		height: 400,
	},
	{
		type: "figure",
		src: "/video/bakery-loop.mp4",
		poster: "/images/bakery-loop-first-frame.jpg",
		alt: "A baker scoring loaves on the bench",
		caption: "Scoring the country loaves",
		width: 960,
		height: 400,
	},
	{ type: "figure", alt: "The rye resting in linen on the rack", caption: "Still to shoot" },
];

/** The post with its figures between the two halves. */
export const prosePost: ProseBlock[] = [
	...proseText.slice(0, 2),
	...proseFigures,
	...proseText.slice(2),
];

// ---- The bakery's audit (invented) ----

export const reportLegend = [
	{ grade: "a" as const, label: "Clean" },
	{ grade: "b" as const, label: "Works, with a quick win left" },
	{ grade: "c" as const, label: "A customer feels it" },
	{ grade: "d" as const, label: "Broken" },
];

/** The first card: every section graded, one row linked, one line carrying a link of its own. */
export const reportGroups: ReportCardGroup[] = [
	{
		title: "Health",
		rows: [
			{
				name: "Technical SEO",
				href: "#technical-seo",
				grade: "b",
				line: "Every page that matters is in the index; the two cake pages copy each other.",
			},
			{
				name: "Core Web Vitals",
				href: "#core-web-vitals",
				grade: "c",
				line: "The home page shows its first loaf in about 4 s on a phone, against a line of 2.5 s.",
			},
		],
	},
	{
		title: "Visibility",
		rows: [
			{
				name: "Local SEO",
				href: "#local-seo",
				grade: "a",
				line: "First on the map for a bakery search across Fairhaven.",
			},
			{
				name: "Conversion",
				grade: "d",
				line: "The order form posts to an address that bounces.",
			},
		],
	},
];

/** A later card: what moved since the first read, and a section not yet read. */
export const reportGroupsLater: ReportCardGroup[] = [
	{
		title: "Health",
		rows: [
			{
				name: "Technical SEO",
				href: "#technical-seo",
				grade: "a",
				before: "b",
				line: "The copied cake page is gone.",
			},
			{
				name: "Core Web Vitals",
				grade: "c",
				before: "c",
				line: "Still about 4 s on a phone; the hero photo is the next cut.",
			},
		],
	},
	{
		title: "Conversion",
		rows: [{ name: "Analytics", line: "Read once the access lands." }],
	},
];

/** A report's headline figures. */
export const stats: StatItem[] = [
	{
		value: "3,948",
		label: "Visits",
		period: "2026 Q3",
		deltas: [
			{
				direction: "up",
				change: "23%",
				basis: "YoY",
				basisTitle: "year over year",
				was: "3,210",
				tone: "good",
			},
			{ direction: "down", change: "4%", basis: "QoQ", basisTitle: "quarter over quarter" },
		],
	},
	{ value: "6", outOf: "7", label: "Pages in the index", tone: "good" },
	{
		value: "4.1",
		unit: "s",
		label: "First loaf on a phone",
		change: { direction: "down", text: "0.8 s", tone: "good" },
		tone: "warn",
	},
	{
		value: "12",
		trend: "up",
		label: "Orders from the site",
		note: "Counted from the order inbox, not analytics",
	},
];

/** Mobile paint against its lines: good to 2.5 s, slow to 4 s, poor beyond. */
export const thresholdZones: ThresholdZone[] = [
	{ label: "Good", upTo: 2.5, tone: "good" },
	{ label: "Slow", upTo: 4, tone: "warn" },
	{ label: "Poor", tone: "bad" },
];

export const thresholdTicks = [
	{ at: 2.5, label: "2.5 s" },
	{ at: 4, label: "4 s" },
];

export const thresholdReadings: ThresholdReading[] = [
	{ label: "Home page", value: 4.1, display: "4.1 s", tone: "bad" },
	{ label: "Menu", value: 3.2, display: "3.2 s", tone: "warn" },
	{ label: "Order ahead", value: 1.9, display: "1.9 s", tone: "good" },
];

/** Visits a month, two quarters a year apart. */
export const columnGroups: ColumnChartGroup[] = [
	{
		label: "2025 Q3",
		total: "3,210",
		tone: "muted",
		bars: [
			{ label: "Jul", value: 1040 },
			{ label: "Aug", value: 1120 },
			{ label: "Sep", value: 1050 },
		],
	},
	{
		label: "2026 Q3",
		total: "3,948",
		tone: "good",
		bars: [
			{ label: "Jul", value: 1210, display: "1.2k" },
			{ label: "Aug", value: 1420, display: "1.4k" },
			{ label: "Sep", value: 1318, display: "1.3k" },
		],
	},
];

export const columnLegend = [
	{ label: "The same quarter, a year earlier", tone: "muted" as const },
	{ label: "This quarter", tone: "good" as const },
];

/** Where the quarter's visits came from. */
export const segments: StackedBarSegment[] = [
	{ label: "Map listing", value: 1840, tone: "good" },
	{ label: "Search", value: 1158, tone: "info" },
	{ label: "Social", value: 620, tone: "muted" },
	{ label: "Typed in", value: 330, tone: "warn" },
];

/** The searches a neighbor types, and where the bakery lands for each. */
export const queryColumns: DataTableColumn[] = [
	{ label: "Search" },
	{
		label: "Map place",
		align: "right",
		sortable: true,
		firstSort: "asc",
		hint: "Where the bakery sits in the map pack for this search, from the shop's own corner.",
	},
	{ label: "Monthly searches", align: "right", sortable: true, firstSort: "desc" },
	{ label: "Change", align: "right", emptyLabel: "Not measured" },
];

export const queryRows: DataTableRow[] = [
	{ cells: ["sourdough near me", 3, "1,900", "+1"] },
	{ cells: ["bakery open sunday", 1, "880", "0"] },
	{ cells: ["birthday cake fairhaven", 7, "320", null], tone: "bad" },
	{ cells: ["rye bread", { display: "Not placed", sort: 99 }, "140", "-2"] },
	{ cells: ["croissant", 2, "2,400"] },
];

// ---- The artifact around the bakery's read ----

/** The made up studio that sends the bakery its read. */
export const sender: ArtifactConfig["sender"] = {
	name: "Larkmoor Studio",
	href: "https://studio.example.com",
	email: "hello@studio.example.com",
	logo: { src: "/images/primitives/larkmoor-mark-light.svg", alt: "Larkmoor Studio" },
};

export const artifactSite: ArtifactConfig = {
	url: "https://kestrel.studio.example.com",
	access: "private",
	sender,
	recipient: {
		name: "Kestrel Hollow Bakehouse",
		logo: { src: "/images/kestrel-glyph-light.svg", alt: "Kestrel Hollow Bakehouse" },
	},
	robots: "noindex, nofollow",
};

/** The studio's person, closing the read. */
export const person: WriteupPerson = {
	photoSrc: "/images/primitives/larkmoor-person.svg",
	photoAlt: "Ada Fennimore",
	name: "Ada Fennimore",
	role: "Larkmoor Studio",
	mailHref: "mailto:hello@studio.example.com",
	mailLabel: "hello@studio.example.com",
};

/** The home page at desktop width, opening the full picture. */
export const shotWide: WriteupShot = {
	src: "/images/bakery-desktop.svg",
	alt: "The home page at desktop width: a dark hero photo and the hours in small gray type",
	href: "/images/bakery-desktop.svg",
	caption: "The home page at desktop width",
};

/** The menu page at phone width: taller than it is wide. */
export const shotPortrait: WriteupShot = {
	src: "/images/note-menu.svg",
	alt: "The menu page on a phone: a photo of the chalkboard, too small to read",
	caption: "The menu page at phone width",
};

/** The bakery's own address, for a story that needs a reply line. */
export const bakeryEmail = email;
