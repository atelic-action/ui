import type { SiteConfig } from "../../src/sections/siteConfig";

/** Minimal neutral SiteConfig for component tests — no client copy. */
export const testSite: SiteConfig = {
	name: "Test Practice",
	url: "https://example.com",
	description: "A test practice.",
	schemaType: ["LocalBusiness"],
	logo: { src: "/logo.png", alt: "Test Practice" },
	nav: [
		{ label: "Home", to: "/" },
		{ label: "About", to: "/about" },
	],
	cta: { label: "Book Now", href: "https://booking.example.com", external: true },
	phone: { e164: "+15555550100", display: "(555) 555-0100" },
	email: "hello@example.com",
	address: {
		street: "123 Main St",
		locality: "Denver",
		region: "CO",
		postalCode: "80205",
		country: "US",
	},
	hours: [],
	serviceAreas: [],
	footerBlurb: "Blurb.",
};
