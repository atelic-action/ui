import type { ReviewItem, SiteConfig } from "../src/sections";

/*
 * The fictional bakery the marketing groups show, as a site's config would
 * describe it. Every name, number, and review here is made up.
 */
export const bakery: SiteConfig = {
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
	cta: { label: "Order ahead", href: "/order" },
	phone: { e164: "+15555550142", display: "(555) 555-0142" },
	email: "hello@kestrelhollow.example.com",
	address: {
		street: "418 Alder Street",
		locality: "Fairhaven",
		region: "CO",
		postalCode: "80000",
		country: "US",
	},
	mapImage: "/images/bakery-map.svg",
	mapLinkUrl: "https://maps.example.com/?q=418+Alder+Street",
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
	footerBlurb: "Bread mixed, shaped, and baked in the back of the shop since 2014.",
	footerLinks: [{ label: "Wholesale portal", href: "https://portal.example.com", external: true }],
};

/** The same bakery with no map screenshot, so the map shows its click to load facade. */
export const bakeryNoImage: SiteConfig = {
	...bakery,
	mapImage: undefined,
	mapEmbedUrl: "https://maps.example.com/embed?q=418+Alder+Street",
};

export const reviews: ReviewItem[] = [
	{
		quote:
			"The morning bun is the best thing I eat all week. I time my Saturday run so it ends at their door.",
		by: "Priya N.",
		detail: "Regular since 2019",
		rating: 5,
		date: "2026-09-14",
		sourceUrl: "https://reviews.example.com/1",
		tags: ["Pastry"],
	},
	{
		quote:
			"Ordered a birthday cake two days out and they still fit us in. It was gone before the candles were cold.",
		by: "Marcus T.",
		rating: 5,
		date: "2026-08-02",
		sourceUrl: "https://reviews.example.com/2",
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
			"They carry our café every morning before we open. Never a late delivery in three years.",
		by: "Owen at Lantern Coffee",
		detail: "Wholesale customer",
		date: "2026-05-10",
		tags: ["Wholesale"],
	},
];
