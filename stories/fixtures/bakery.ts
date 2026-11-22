import type {
	Brand,
	CallToAction,
	ContactDockConfig,
	HeaderPhone,
	MenuContact,
	NavLink,
	Phone,
} from "../../src/chrome";
import type { NavItem, SiteConfig } from "../../src/sections";

/*
 * Kestrel Hollow Bakehouse, the fictional bakery every story is set in,
 * copied from the gallery's data (gallery/marketing-data.ts and
 * gallery/chrome.tsx) so the stories do not move when the gallery does.
 * Every name, number, address, and review is made up: the numbers are 555
 * numbers, the addresses sit on reserved example domains, and Fairhaven is
 * no real town. Add to this file rather than inventing a second business.
 */

export const phone: Phone = { e164: "+15555550142", display: "(555) 555-0142" };

export const phones: HeaderPhone[] = [
	{ e164: "+15555550142", display: "(555) 555-0142", label: "The shop" },
	{ e164: "+15555550143", display: "(555) 555-0143", label: "Wholesale" },
];

export const email = "hello@kestrelhollow.example.com";

export const address = {
	street: "418 Alder Street",
	locality: "Fairhaven",
	region: "CO",
	postalCode: "80000",
	country: "US",
};

export const contact: MenuContact = { phone, email, address };

export const brand: Brand = {
	name: "Kestrel Hollow Bakehouse",
	href: "/",
	logo: { src: "/images/kestrel-glyph-light.svg", wordmark: "Kestrel Hollow" },
};

/** The same identity as a wordmark with the trailing run and no picture. */
export const wordmarkBrand: Brand = {
	name: "Kestrel Hollow Bakehouse",
	href: "/",
	logo: { wordmark: "kestrel hollow", run: true },
};

export const cta: CallToAction = { label: "Order ahead", href: "/order" };

/** A flat nav: four pages, no groups. */
export const flatLinks: NavLink[] = [
	{ label: "Menu", href: "/menu" },
	{ label: "Cakes", href: "/cakes" },
	{ label: "Catering", href: "/catering" },
	{ label: "Visit", href: "/visit" },
];

/** The nav with two groups (what it bakes, and who it bakes for) and a page. */
export const groupedLinks: NavLink[] = [
	{
		label: "Menu",
		href: "/menu",
		allLabel: "The whole menu",
		columns: [
			{
				heading: "Bread",
				href: "/menu/bread",
				links: [
					{ label: "Country sourdough", href: "/menu/sourdough", description: "The daily loaf" },
					{ label: "Seeded rye", href: "/menu/rye", description: "Thursdays and Saturdays" },
					{ label: "Baguettes", href: "/menu/baguettes" },
				],
			},
			{
				heading: "Pastry",
				links: [
					{ label: "Morning buns", href: "/menu/buns", description: "Gone by ten" },
					{ label: "Croissants", href: "/menu/croissants" },
					{ label: "Seasonal tarts", href: "/menu/tarts" },
				],
			},
			{
				heading: "Cakes",
				links: [
					{ label: "Cakes to order", href: "/cakes", description: "Two days ahead" },
					{ label: "Allergens", href: "/menu/allergens" },
				],
			},
		],
		feature: {
			eyebrow: "Order ahead",
			title: "Skip the Saturday line.",
			text: "Order by Friday noon and the loaf waits for you at the counter.",
			cta: { label: "Order ahead", href: "/order" },
			image: { src: "/images/bakery-loop-first-frame.jpg", alt: "The bakery's ovens at dawn" },
		},
	},
	{
		label: "Wholesale",
		href: "/wholesale",
		columns: [
			{
				heading: "For cafes",
				links: [
					{
						label: "Morning delivery",
						href: "/wholesale/delivery",
						description: "Before you open",
					},
					{ label: "Standing orders", href: "/wholesale/standing" },
				],
			},
			{
				heading: "For grocers",
				links: [
					{ label: "Shelf program", href: "/wholesale/shelf", description: "Bagged and labeled" },
				],
			},
		],
	},
	{ label: "Visit", href: "/visit" },
];

/** The grouped nav in the config's shape (`to` where the header takes `href`). */
export const groupedNav: NavItem[] = groupedLinks.map(({ href, ...item }) => ({
	...item,
	to: href,
}));

export const dock: ContactDockConfig = {
	label: "Talk to us",
	title: "How can we help?",
	subtitle: "Pick whichever is easiest.",
	footnote: "Someone answers from seven to three, Tuesday to Sunday.",
	items: [
		{
			label: "Order ahead",
			description: "Pick a loaf and a pickup time",
			icon: "calendar",
			href: "/order",
			lead: true,
		},
		{
			label: "Call (555) 555-0142",
			description: "Seven to three, Tuesday to Sunday",
			icon: "phone",
			href: "tel:+15555550142",
		},
		{
			label: "Send a message",
			description: "We answer within a day",
			icon: "mail",
			href: "/contact",
		},
		{ label: "Find the shop", description: "418 Alder Street", icon: "map", href: "/visit" },
	],
};

/** The bakery as a site's config describes it. */
export const site: SiteConfig = {
	name: "Kestrel Hollow Bakehouse",
	url: "https://kestrelhollow.example.com",
	description:
		"A neighborhood bakery on Alder Street: sourdough, morning buns, and cakes to order.",
	schemaType: ["Bakery"],
	logo: { alt: "Kestrel Hollow Bakehouse", wordmark: "kestrel hollow", run: true },
	nav: [
		{ label: "Menu", to: "/menu" },
		{ label: "Wholesale", to: "/wholesale" },
		{ label: "Visit", to: "/visit" },
	],
	cta,
	phone,
	email,
	address,
	mapImage: "/images/bakery-map.svg",
	mapLinkURL: "https://maps.example.com/?q=418+Alder+Street",
	hours: [
		{
			label: "Tuesday to Friday",
			labelShort: "Tue to Fri",
			days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
			opens: "07:00",
			closes: "15:00",
		},
		{
			label: "Saturday and Sunday",
			labelShort: "Sat and Sun",
			days: ["Saturday", "Sunday"],
			opens: "08:00",
			closes: "14:00",
		},
		{ label: "Monday", labelShort: "Mon", days: [] },
	],
	serviceAreas: ["Fairhaven", "Old Mill", "the Riverside blocks"],
	footer: { rating: "4.9 on Google" },
	footerLinks: [{ label: "Wholesale portal", href: "https://portal.example.com", external: true }],
	socialLinks: [
		{ label: "Instagram", href: "https://instagram.example.com/kestrelhollow", icon: "instagram" },
		{ label: "Facebook", href: "https://facebook.example.com/kestrelhollow", icon: "facebook" },
	],
	legalLinks: [{ label: "Privacy", href: "/privacy" }],
	contactDock: dock,
};
