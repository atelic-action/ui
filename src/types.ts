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
 *
 * A mark given as `onLight` and `onDark` is the brand's own artwork, cut
 * once for each surface: `onLight` is drawn on a light bar, `onDark` on a
 * dark bar, over a hero, and in the footer. The chrome never recolors either,
 * and either alone serves every surface. A mark given as `src` alone is a
 * light mark the header tints to ink on a light bar, as it always has. Every
 * header mark stands at `--brand-mark-height` (30px unless the theme says
 * otherwise), as wide as its own ratio makes it. `wordmark: false` drops the
 * live name beside the mark, for artwork that already spells it.
 */
export interface BrandLogo {
	src?: string;
	/** Alt text where the mark stands alone: the footer's, when `wordmark` is false. */
	alt?: string;
	tile?: string;
	/** The live name beside the mark; `false` leaves it out. Defaults to the brand's name. */
	wordmark?: string | false;
	run?: boolean;
	/** The mark drawn on a light bar, as given. */
	onLight?: string;
	/** The mark drawn on a dark bar, over a hero, and in the footer, as given. */
	onDark?: string;
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
 * mega menu panel holding its sections left to right (and the `feature` card
 * at the right when it has one), and on a phone the menu opens it as an
 * accordion. `href` is the group's own page, which `allLabel` links to from
 * inside the group.
 */
export interface NavLink {
	label: string;
	href: string;
	/**
	 * The group's panel, left to right: link columns, and the picture, icon
	 * row, and card sections beside them. An entry with none is a plain link.
	 */
	columns?: NavPanelSection[];
	/** A card at the panel's right on a desktop: a picture, a headline, ticked points, and a button. */
	feature?: NavFeature;
	/**
	 * The words of a link to the group's own page (`href`), set first in the
	 * group, e.g. "All services". Off unless given.
	 */
	allLabel?: string;
}

/** A link indented under a column link, joined to it by an elbow. */
export interface NavGroupChildLink {
	label: string;
	href: string;
	/** Opens in a new tab, except on mailto, tel, and sms links. */
	external?: boolean;
	/** A short word in a pill after the label, e.g. "Popular". */
	badge?: string;
}

/** One link in a nav group's column, with a short line under it when it has one. */
export interface NavGroupLink extends NavGroupChildLink {
	/** A short line under the link, e.g. what the page covers. */
	description?: string;
	/** Links drawn indented under this one on a desktop and a phone alike. */
	children?: NavGroupChildLink[];
	/**
	 * Sets the link in the panel's quieter words and regular weight, for a
	 * long list such as the towns under a region's heading. Off by default.
	 */
	quiet?: boolean;
}

/**
 * A link column of a nav group: a heading, itself a link when it has an
 * `href`, over its links. `kind` may be left out; a section without one is
 * a link column.
 */
export interface NavGroupColumn {
	kind?: "links";
	heading: string;
	href?: string;
	links: NavGroupLink[];
}

/** A picture section of a nav group: one photo under its caption, the whole of it a link. */
export interface NavPictureSection {
	kind: "picture";
	/** The photo. Its alt defaults to empty, since the caption names the link. */
	image: { src: string; alt?: string };
	caption: string;
	href: string;
	external?: boolean;
}

/** The icons a nav row can lead with, each a lucide icon. */
export type NavIcon =
	| "calculator"
	| "calendar"
	| "card"
	| "chat"
	| "document"
	| "help"
	| "home"
	| "mail"
	| "map"
	| "phone"
	| "pin"
	| "play"
	| "shield"
	| "star"
	| "tool"
	| "truck"
	| "users";

/** One icon row: an icon, a label, and a short line, the whole row a link. */
export interface NavIconRow {
	label: string;
	description?: string;
	icon: NavIcon;
	href: string;
	external?: boolean;
	/** Sets the row on the primary field, as the way most people should take. One per section. */
	highlight?: boolean;
}

/** A section of icon rows under a heading, two across on a desktop. */
export interface NavIconRowsSection {
	kind: "rows";
	heading?: string;
	rows: NavIconRow[];
}

/** One small card: a kicker, a title, and a meta line beside an optional square picture. */
export interface NavCard {
	kicker?: string;
	title: string;
	meta?: string;
	/** A square picture at the card's left; a quiet tile stands in without one. */
	image?: { src: string; alt?: string };
	href: string;
	external?: boolean;
}

/** A section of small cards under a heading, such as the latest article and the latest job. */
export interface NavCardsSection {
	kind: "cards";
	heading?: string;
	cards: NavCard[];
}

/** One section of a nav group's panel. */
export type NavPanelSection =
	| NavGroupColumn
	| NavPictureSection
	| NavIconRowsSection
	| NavCardsSection;

/** The card a nav group can carry at the right of its panel on a desktop. */
export interface NavFeature {
	/** A small label over the headline. */
	eyebrow?: string;
	title: string;
	/** One line under the headline. */
	text?: string;
	/** Short reasons, each set beside a tick under the headline. */
	points?: string[];
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
	/** The header's button carries the arrow a hero's primary button shows. Off by default. */
	arrow?: boolean;
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

/** What every dock item has, whichever way it acts. */
interface ContactDockItemBase {
	label: string;
	/** One short line under the label. */
	description?: string;
	icon?: ContactDockIcon;
	/** Sets the item apart on a tinted ground, as the way most people should take. */
	lead?: boolean;
}

/**
 * One way to reach the business: a link (`href`, where a `tel:` dials and a
 * form page opens) or a button (`onSelect`, which hands off to something
 * already on the page, such as a chat vendor's own window), and never
 * neither. A prototype never implies a system the business does not run, so
 * an item always points at the business's existing flow.
 */
export type ContactDockItem =
	| (ContactDockItemBase & {
			href: string;
			/** Opens in a new tab, except on mailto, tel, and sms links. */
			external?: boolean;
			onSelect?: never;
	  })
	| (ContactDockItemBase & {
			/** Called on select in place of following a link; the dock closes first. */
			onSelect: () => void;
			href?: never;
			external?: never;
	  });

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
