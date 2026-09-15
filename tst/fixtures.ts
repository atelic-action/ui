import type { Brand, CallToAction, NavLink, Phone, PostalAddress } from "../src/types";

/** Minimal neutral props for component tests, with no client copy. */
export const brand: Brand = {
	name: "Test Practice",
	href: "/",
	logo: { src: "/logo.png", alt: "Test Practice" },
};

export const links: NavLink[] = [
	{ label: "Home", href: "/" },
	{ label: "About", href: "/about" },
];

export const primaryCTA: CallToAction = {
	label: "Book Now",
	href: "https://booking.example.com",
	external: true,
};

export const phone: Phone = { e164: "+15555550100", display: "(555) 555-0100" };

export const email = "hello@example.com";

export const address: PostalAddress = {
	street: "123 Main St",
	locality: "Denver",
	region: "CO",
	postalCode: "80205",
};
