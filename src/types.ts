/**
 * The shapes the chrome renders from. Every value arrives as a prop, so a
 * site maps its own config onto these and the components never read a
 * config file, a router, or a brand value of their own.
 */

/**
 * The chrome's mark. `src` is the mark image; omit it for a text wordmark.
 * `tile` renders a CSS glyph tile instead of an image (a dark rounded square
 * bearing the character in the brand's own webfont, which an SVG loaded
 * through an img cannot do). `wordmark` overrides the rendered text when it
 * should differ from the name, and `run` appends the trailing fade bar.
 */
export interface BrandLogo {
	src?: string;
	/** Alt text where the mark stands alone, as in the footer. */
	alt?: string;
	tile?: string;
	wordmark?: string;
	run?: boolean;
}

/** The identity a header or footer wears. */
export interface Brand {
	name: string;
	/** Where the lockup points. Defaults to "/". */
	href?: string;
	logo?: BrandLogo;
}

/** An entry in a site's primary nav. */
export interface NavLink {
	label: string;
	href: string;
}

/** A conversion action rendered as a button link. */
export interface CallToAction {
	label: string;
	href: string;
	/** Opens in a new tab, except on mailto, tel, and sms links. */
	external?: boolean;
}

/** A footer or legal link that may open in a new tab. */
export interface SiteLink {
	label: string;
	href: string;
	external?: boolean;
}

/** An icon link in the footer's brand column. */
export interface SocialLink {
	/** Accessible name, e.g. "GitHub". */
	label: string;
	href: string;
	icon: "github" | "linkedin" | "mail" | "user";
}

export interface Phone {
	/** The dialable number, e.g. "+15555550100". */
	e164: string;
	/** The number as printed, e.g. "(555) 555-0100". */
	display: string;
}

export interface PostalAddress {
	/** Leave empty for a business that publishes a service area but no storefront. */
	street?: string;
	locality: string;
	region: string;
	postalCode?: string;
}

/** One row of opening hours, already formatted by the site. */
export interface HoursRow {
	/** The day label as printed, e.g. "Mon" or "Fri to Sun". */
	label: string;
	/** The range as printed, e.g. "11a to 7p" or "Closed". */
	range: string;
}

/** The contact block at the foot of the menu. */
export interface MenuContact {
	phone?: Phone;
	email?: string;
	address?: PostalAddress;
}
