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

/**
 * The recipient half of a sent artifact's lockup: the business a document
 * was prepared for, whose mark follows the sender's wordmark after a times
 * sign. An image cut for the surface the header wears (a light mark on the
 * dark bar), never a wordmark string, since the sender's type is the one
 * face the chrome draws in.
 */
export interface BrandRecipient {
	src: string;
	alt: string;
}

/** The identity a header or footer wears. */
export interface Brand {
	name: string;
	/** Where the lockup points. Defaults to "/". */
	href?: string;
	logo?: BrandLogo;
	/** Set on a sent artifact's header only; a marketing site's lockup has no recipient. */
	recipient?: BrandRecipient;
}

/**
 * An entry in a site's primary nav: a plain link, or a group. A group is an
 * entry with `columns`: on a desktop its label is a control that opens a
 * mega menu panel holding the columns (and the `feature` card when it has
 * one), and on a phone the menu opens it as an accordion. `href` is the
 * group's own page, which `allLabel` links to from inside the group.
 */
export interface NavLink {
	label: string;
	href: string;
	/** The group's link columns. An entry with none is a plain link. */
	columns?: NavGroupColumn[];
	/** A card beside the columns on a desktop: a headline, a line, a button, and a picture. */
	feature?: NavFeature;
	/**
	 * The words of a link to the group's own page (`href`), set first in the
	 * group, e.g. "All services". Omit and the group links only its columns.
	 */
	allLabel?: string;
}

/** One link in a nav group's column, with a short line under it when it has one. */
export interface NavGroupLink {
	label: string;
	href: string;
	/** A short line under the link, e.g. what the page covers. */
	description?: string;
	/** Opens in a new tab, except on mailto, tel, and sms links. */
	external?: boolean;
}

/** One column of a nav group: a heading, itself a link when it has an `href`, over its links. */
export interface NavGroupColumn {
	heading: string;
	href?: string;
	links: NavGroupLink[];
}

/** The card a nav group can carry beside its columns on a desktop. */
export interface NavFeature {
	/** A small label over the headline. */
	eyebrow?: string;
	title: string;
	/** One line under the headline. */
	text?: string;
	cta: CallToAction;
	/** The picture that fills the card above the words. */
	image?: { src: string; alt: string };
}

/** A number the header shows, with the words that say whose line it is. */
export interface HeaderPhone extends Phone {
	/** Printed small over the number and read with it, e.g. "Mountain office". */
	label?: string;
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

/** The icons a footer link can carry. */
export type FooterIcon =
	| "facebook"
	| "github"
	| "instagram"
	| "linkedin"
	| "mail"
	| "star"
	| "user"
	| "youtube";

/** A social link; the footer's Social column prints it with its icon. */
export interface SocialLink {
	/** The link's words, e.g. "GitHub". */
	label: string;
	href: string;
	icon: FooterIcon;
}

/** One link in a footer column, with an icon in front when it names one. */
export interface FooterColumnLink extends SiteLink {
	icon?: FooterIcon;
}

/** One link column of the footer, under its heading. */
export interface FooterColumn {
	heading: string;
	links: FooterColumnLink[];
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

/** The pictures a dock item can lead with. */
export type ContactDockIcon =
	| "chat"
	| "phone"
	| "calendar"
	| "mail"
	| "form"
	| "calculator"
	| "map";

/**
 * One way to reach the business. An item with an `href` is a link (a `tel:`
 * dials, a form page opens); an item with `onSelect` is a button that hands
 * off to something already on the page, such as a chat vendor's own window.
 * A prototype never implies a system the business does not run, so an item
 * always points at the business's existing flow.
 */
export interface ContactDockItem {
	label: string;
	/** One short line under the label. */
	description?: string;
	icon?: ContactDockIcon;
	href?: string;
	/** Opens in a new tab, except on mailto, tel, and sms links. */
	external?: boolean;
	/** Called on select in place of following a link; the dock closes first. */
	onSelect?: () => void;
	/** Sets the item apart on a tinted ground, as the way most people should take. */
	lead?: boolean;
}

/** What a site's config gives the dock; `SiteShell` mounts it when present. */
export interface ContactDockConfig {
	/** The launcher's words, e.g. "Talk to us". On a phone the launcher shows its icon alone. */
	label: string;
	/** The panel's heading. Defaults to the launcher's words. */
	title?: string;
	/** One line under the heading. */
	subtitle?: string;
	items: ContactDockItem[];
	/** A small line at the panel's foot, such as the hours someone answers. */
	footnote?: string;
}
