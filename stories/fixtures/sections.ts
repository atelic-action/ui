import { createElement } from "react";
import type {
	BlogIndexItem,
	BlogPostDoc,
	ComparisonRow,
	Credential,
	FAQCategory,
	FeatureCard,
	GalleryPhoto,
	LegalDoc,
	LocationEntry,
	ProcessStep,
	ProfileItem,
	ReviewItem,
	SiteConfig,
} from "../../src/sections";
import { site } from "./bakery";

/*
 * The sections' own data, in Kestrel Hollow Bakehouse's world
 * (fixtures/bakery.ts). Every name, number, address, review, and host is
 * made up: phones are 555-01xx, hosts sit on example.com, and Fairhaven and
 * its neighborhoods are no real place. Pictures are the generated shapes in
 * stories/public/images/sections/.
 */

/** An answer as one paragraph (the file is plain TypeScript, so no JSX). */
const para = (text: string) => createElement("p", null, text);

/** A picture of this group's, at the root the static folder serves. */
export const image = (name: string) => `/images/sections/${name}.svg`;

/**
 * Where the live map embed loads from in a story: a local stand in page, so
 * pressing the facade never reaches a real map service.
 */
export const mapEmbedStandIn = "/images/sections/map-embed.html";

/** The bakery with no map screenshot but a live embed, so the map shows its click to load facade. */
export const siteWithEmbed: SiteConfig = {
	...site,
	mapImage: undefined,
	mapEmbedURL: mapEmbedStandIn,
};

/** The bakery with neither a screenshot nor an embed: no map at all. */
export const siteWithoutMap: SiteConfig = {
	...site,
	mapImage: undefined,
	mapEmbedURL: undefined,
	mapLinkURL: undefined,
};

/** A long unbroken word, the kind that pushes a narrow column wider than a phone. */
export const unbroken = "Sauerteigbrotbackstubenmeisterschaftswettbewerb";

/** A long unbroken address, the other kind. */
export const longEmail = "wholesale.standing.orders.and.cafe.accounts@kestrelhollow.example.com";

export const reviews: ReviewItem[] = [
	{
		quote:
			"The morning bun is the best thing I eat all week. I time my Saturday run so it ends at their door.",
		by: "Priya N.",
		detail: "Regular since 2019",
		rating: 5,
		date: "2026-09-14",
		sourceURL: "https://reviews.example.com/1",
		tags: ["Pastry"],
	},
	{
		quote:
			"Ordered a birthday cake two days out and they still fit us in. It was gone before the candles were cold.",
		by: "Marcus T.",
		rating: 5,
		date: "2026-08-02",
		sourceURL: "https://reviews.example.com/2",
		tags: ["Cakes"],
	},
	{
		quote:
			"Country sourdough with a crust that actually crackles. The line on Saturdays is long, but it moves, and the staff hand out heels of bread while you wait. I have tried to make this loaf at home for two years and have not come close; at this point I have accepted that some things are better bought from people who wake up at three in the morning to do them properly.",
		by: "Dana R.",
		rating: 4,
		date: "2026-06-21",
		tags: ["Bread"],
	},
	{
		quote:
			"They carry our cafe every morning before we open. Never a late delivery in three years.",
		by: "Owen at Lantern Coffee",
		detail: "Wholesale customer",
		date: "2026-05-10",
		tags: ["Wholesale"],
	},
];

/** A review past the carousel's longest step (420 characters), for the compact quote size. */
export const longestReview: ReviewItem = {
	quote:
		"We moved to Fairhaven in the spring and asked the neighbors where to buy bread. Every one of them said Kestrel Hollow before we finished the question. Six months on, the Saturday loaf is a ritual: the walk down Alder Street, the line that moves faster than it looks, the heel of the morning bake someone hands you while you wait, and the cardboard box of buns that never quite makes it home intact. The seeded rye on Thursdays is the best bread I have eaten outside of a trip abroad, and the cake they made for our daughter's birthday on two days' notice is still talked about at school.",
	by: "Hannah and Felix O.",
	detail: "New to the Riverside blocks",
	rating: 5,
	date: "2026-10-30",
	sourceURL: "https://reviews.example.com/5",
	tags: ["Bread", "Cakes"],
};

export const faqCategories: FAQCategory[] = [
	{
		id: "ordering",
		title: "Ordering ahead",
		tabLabel: "Ordering",
		description: "Loaves, buns, and boxes held at the counter.",
		cta: { label: "Order for Saturday", href: "/order" },
		items: [
			{
				id: "order-cutoff",
				question: "When is the cutoff for a Saturday order?",
				answer: para("Friday at noon. Orders after that go to Sunday."),
				answerText: "Friday at noon. Orders after that go to Sunday.",
			},
			{
				id: "order-pay",
				question: "Do I pay when I order?",
				answer: para("No, you pay at pickup, by card or cash."),
				answerText: "No, you pay at pickup, by card or cash.",
				cta: { label: "See the pickup times", href: "/visit" },
			},
		],
	},
	{
		id: "cakes",
		title: "Cakes to order",
		tabLabel: "Cakes",
		description: "Birthdays, weddings, and the rest.",
		items: [
			{
				id: "cake-notice",
				question: "How much notice does a cake need?",
				answer: para("Two days for a round cake, two weeks for anything tiered."),
				answerText: "Two days for a round cake, two weeks for anything tiered.",
			},
			{
				id: "cake-allergens",
				question: "Can you bake without nuts?",
				answer: para("Yes. The kitchen handles nuts, so we cannot promise a trace free cake."),
				answerText: "Yes. The kitchen handles nuts, so we cannot promise a trace free cake.",
			},
		],
	},
	{
		id: "wholesale",
		title: "Wholesale",
		items: [
			{
				id: "wholesale-minimum",
				question: "Is there a minimum standing order?",
				answer: para("Twelve loaves a delivery, any mix."),
				answerText: "Twelve loaves a delivery, any mix.",
			},
		],
	},
];

export const locations: LocationEntry[] = [
	{
		name: "Alder Street",
		address: "418 Alder Street, Fairhaven CO 80000",
		hours: ["Tue to Fri · 07:00 to 15:00", "Sat and Sun · 08:00 to 14:00"],
		phoneDisplay: "(555) 555-0142",
		phoneE164: "+15555550142",
		mapLink: "https://maps.example.com/?q=418+Alder+Street",
		note: "The original, since 2014",
	},
	{
		name: "Lantern Square",
		address: "12 Lantern Square, Fairhaven CO 80000",
		hours: ["Wed to Sun · 08:00 to 13:00"],
		phoneDisplay: "(555) 555-0144",
		phoneE164: "+15555550144",
		mapLink: "https://maps.example.com/?q=12+Lantern+Square",
	},
];

export const credentials: Credential[] = [
	{ code: "CFH", title: "County food handler", detail: "Every baker on staff, renewed yearly" },
	{ code: "ORG", title: "Certified organic flour", detail: "From the Hollow Creek mill" },
	{ code: "BGA", title: "Bakers' Guild of Fairhaven" },
];

export const processSteps: ProcessStep[] = [
	{ title: "Mix at night", description: "The levain and the flour meet at ten." },
	{ title: "Rest till three", description: "A slow cold rise for the crust and the crumb." },
	{ title: "Bake at dawn", description: "Into the deck ovens before the doors open." },
];

export const features: FeatureCard[] = [
	{ num: "01", title: "Country sourdough", description: "The daily loaf, two days in the making." },
	{ num: "02", title: "Morning buns", description: "Cardamom and orange, gone by ten." },
	{ num: "03", title: "Cakes to order", description: "Two days' notice for a round cake." },
	{ num: "04", title: "Wholesale", description: "Delivered to cafes before they open." },
];

export const photos: GalleryPhoto[] = [
	{ src: image("loaves"), alt: "Loaves cooling on a rack", caption: "Tuesday's country loaves" },
	{ src: image("buns"), alt: "A tray of morning buns", caption: "Morning buns, before ten" },
	{ src: image("cake"), alt: "A birthday cake with three tiers", caption: "A cake to order" },
	{ src: image("rye"), alt: "Seeded rye sliced on a board", caption: "Thursday rye" },
	{ src: image("counter"), alt: "The front counter at opening", caption: "The counter at seven" },
	{ src: image("ovens"), alt: "The ovens at dawn", caption: "The deck ovens at dawn" },
];

export const profiles: ProfileItem[] = [
	{
		name: "Ines Varga",
		meta: "Head baker",
		blurb: "Mixes the levain every night and has not missed a Saturday since 2014.",
		image: { src: image("baker-ines"), alt: "Ines at the bench, shaping a loaf" },
		href: "/team/ines",
		linkLabel: "Meet Ines",
	},
	{
		name: "Theo Marsh",
		meta: "Pastry",
		blurb: "Rolls the morning buns and runs the laminating table.",
		image: { src: image("baker-theo"), alt: "Theo rolling dough for the buns" },
		href: "/team/theo",
	},
	{
		name: "Wren Calloway",
		meta: "Cakes",
		blurb: "Takes every cake order and decorates every one of them.",
		image: { src: image("baker-wren"), alt: "Wren piping a cake" },
	},
];

export const blogItems: BlogIndexItem[] = [
	{
		slug: "why-the-rye-rests",
		title: "Why our rye rests two days",
		description: "The seeded rye is baked on Tuesday and sold on Thursday, and that is the point.",
		publishedAt: "2026-10-14",
		readingMinutes: 5,
	},
	{
		slug: "the-saturday-line",
		title: "The Saturday line, explained",
		description: "What we bake, how much, and why it is gone by noon.",
		publishedAt: "2026-09-02",
		readingMinutes: 3,
	},
	{
		slug: "cardamom",
		title: "A note on cardamom",
		publishedAt: "2026-07-21",
	},
];

export const blogPost: BlogPostDoc = {
	title: "Why our rye rests two days",
	description: "The seeded rye is baked on Tuesday and sold on Thursday.",
	publishedAt: "2026-10-14",
	updatedAt: "2026-10-20",
	author: "Ines Varga",
	blocks: [
		{
			type: "p",
			text: "A rye loaf straight from the oven is still cooking inside. Cut it that day and the crumb is gummy; wait two days and it slices clean.",
		},
		{ type: "h", text: "What happens in the two days" },
		{
			type: "p",
			text: "The starches set, the moisture evens out from the crust to the middle, and the flavor deepens.",
		},
		{ type: "h", level: 3, text: "Why Thursday" },
		{
			type: "ul",
			items: ["Baked Tuesday at dawn", "Wrapped Wednesday", "On the counter Thursday"],
		},
		{
			type: "figure",
			src: image("rye"),
			alt: "Seeded rye sliced on a board",
			caption: "Thursday's rye, sliced",
			width: 800,
			height: 600,
		},
	],
};

export const legalDoc: LegalDoc = {
	title: "Privacy",
	lastUpdated: "2026-09-01",
	blocks: [
		{ type: "h", text: "What we collect" },
		{
			type: "p",
			text: "When you order ahead we keep your name, your email address, and what you ordered, so the order is waiting at the counter.",
		},
		{ type: "h", text: "What we never do" },
		{ type: "ul", items: ["Sell your details", "Send you mail you did not ask for"] },
		{
			type: "p",
			text: "THE SITE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, TO THE EXTENT THE LAW ALLOWS.",
		},
	],
};

export const comparisonRows: ComparisonRow[] = [
	{
		id: "speed",
		stage: "Phone speed",
		stageHref: "/glossary/speed",
		before: { grade: "D", points: ["Eight seconds to the menu"] },
		after: { grade: "A", points: ["Under two seconds", "No layout shift"] },
	},
	{
		id: "ordering",
		stage: "Ordering ahead",
		before: { grade: "C", points: ["A phone number only"] },
		after: { grade: "A", points: ["One tap to the order form"] },
	},
	{
		id: "hours",
		stage: "Hours",
		before: { grade: "B", points: ["Listed, in a picture"] },
		after: { grade: "B", points: ["Listed as text"] },
	},
	{
		id: "reviews",
		stage: "Reviews",
		before: { grade: "not measured", points: ["No reviews on the site"] },
		after: { grade: "A", points: ["The Google rating, linked"] },
	},
];

export const marqueeItems = [
	"County food handler",
	"Certified organic flour",
	"Bakers' Guild of Fairhaven",
	"Fairhaven Gazette, best bun",
	"Since 2014",
];
