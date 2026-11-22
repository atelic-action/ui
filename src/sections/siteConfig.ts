/**
 * The contract between a marketing site and the package's sections, moved
 * here from template-marketing in 0.19.0 (ATE-643).
 *
 * SiteShell maps this config onto the chrome (header, menu, footer, sticky
 * CTA bar), the sections that need the business's facts take it (or only the
 * keys they read) as their `site` prop, and a site's structured data helpers
 * render from it, so standing up a new site means writing one of these plus
 * a theme.css, never touching the components themselves.
 */
import type {
	ContactDockConfig,
	FooterColumn,
	HeaderPhone,
	NavFeature,
	NavPanelSection,
	SiteLink,
	SocialLink,
} from "../types";

export type { SiteLink, SocialLink };

/**
 * An entry in the site's nav: a page, or a group of pages. An entry with
 * `columns` is a group; the header opens it as a mega menu panel on a
 * desktop and an accordion on a phone, and `to` is the group's own page.
 * The footer's Company column lists only the entries, never a group's links.
 */
export interface NavItem {
	label: string;
	to: string;
	/**
	 * The group's panel, left to right: link columns (a heading over its
	 * links), and the picture, icon row, and card sections beside them.
	 */
	columns?: NavPanelSection[];
	/** The card beside a group's columns on a desktop. */
	feature?: NavFeature;
	/** The words of a link to `to` set first inside the group, e.g. "All services". */
	allLabel?: string;
}

/**
 * How much room the sections leave above and below themselves, set on the
 * `.atelic-ui` root as `data-density`. `default` is the trades site rhythm
 * (`--section-space` runs 36 to 64px), `comfortable` the roomier one sites
 * had before 8.0.0, approximately (56 to 120px), and `compact` tighter still (24 to
 * 44px). README.md, Density, holds the companion values.
 */
export type Density = "default" | "comfortable" | "compact";

/**
 * The band a section sits on: the page's own `--surface`, or the alternate
 * `--surface-alt`. Every section that takes `surface` takes this one type.
 */
export type Surface = "default" | "alt";

export interface CTA {
	label: string;
	href: string;
	/** Opens in a new tab with rel="noopener" when true (e.g. a booking portal). */
	external?: boolean;
	/** The header's button carries the arrow the hero's primary button shows. Defaults to false. */
	arrow?: boolean;
	/**
	 * The phone's sticky bar's own words, when they should differ from
	 * `label` (a shorter "Book" where the header says "Book a visit").
	 * Defaults to `label`.
	 */
	stickyLabel?: string;
}

/** How opening hours print: "12h" reads "9a to 5p", "24h" reads "09:00 to 17:00". */
export type Clock = "12h" | "24h";

export interface OpeningHours {
	/** Row label as displayed, e.g. "Monday" or "Friday to Sunday". */
	label: string;
	/** Compact label for the footer's hours column, e.g. "Mon" or "Fri to Sun". */
	labelShort: string;
	/** schema.org day names covered by this row (empty for closed spans). */
	days: string[];
	/** 24 hour "HH:MM"; omit both for a closed row. */
	opens?: string;
	closes?: string;
	/**
	 * Display text for a row without posted times, e.g. "By appointment".
	 * Renders wherever hours appear; defaults to "Closed". Rows without
	 * opens/closes never emit an openingHoursSpecification, so a
	 * by-appointment business states no invented hours in structured data.
	 */
	note?: string;
}

export interface Address {
	street: string;
	locality: string;
	region: string;
	postalCode: string;
	country: string;
}

export interface Founder {
	name: string;
	jobTitle: string;
	honorificSuffix?: string;
	alumniOf?: string;
	/**
	 * Profile URLs for the founder's own schema.org sameAs (their personal site
	 * and profiles), kept off the business's sameAs so the two entities stay
	 * distinct in the graph.
	 */
	sameAs?: string[];
}

/**
 * Copy for the access-gate login screen. Present in the config so the login
 * page is themed and worded per client with no code edits. The gate itself is
 * turned on by setting GATE_SESSION_SECRET on the Vercel project, not by this
 * block (README.md, The Access Gate).
 */
export interface GateConfig {
	/** Mono eyebrow above the headline, e.g. "Private preview". */
	eyebrow?: string;
	/** Login headline. */
	headline: string;
	/** Sub-lead under the headline. */
	lead: string;
	/** Fine-print attribution, e.g. "Built by Jane Maker". Defaults to `attribution`. */
	builtBy?: string;
	/** Contact email shown in the fine print. Defaults to `email`. */
	contactEmail?: string;
}

export interface SiteConfig {
	/** Brand name as rendered in the wordmark and structured data. */
	name: string;
	/**
	 * Canonical URL, no trailing slash, e.g. "https://example.com". For a cut
	 * with a `basePath` it is the full URL including the prefix
	 * ("https://example.atelic.me/proto"), and the build fails if it does not
	 * end with the base.
	 */
	url: string;
	/**
	 * The path prefix the site is served under, for a cut that does not own the
	 * root of its host: a site build previewed at "/proto" on the business's
	 * artifact host, which proxies those requests here. "" (the default) is the
	 * root. `marketingConfig` reads it for Vite's `base` and the router's
	 * `basepath`, and `SiteShell` hands it to `BasePathProvider`, which every
	 * link and image a section renders reads through `useBasePath`.
	 */
	basePath?: string;
	/** Default meta description and LocalBusiness description. */
	description: string;
	/** schema.org business types, most general first, e.g. ["MedicalBusiness", "PhysicalTherapy"]. */
	schemaType: string[];
	/**
	 * The chrome identity. `src` is the mark image; omit it for a pure text
	 * wordmark. `tile` renders a CSS glyph tile instead of an image (a dark
	 * rounded square bearing the given character in the brand's own webfont,
	 * with the accent bar beneath — an SVG-as-img mark cannot load webfonts,
	 * so a lettered mark must be real DOM text to render true). `wordmark`
	 * overrides the rendered wordmark text when it should differ from `name`
	 * (e.g. a lowercase brand treatment); `run` appends the trailing fade bar
	 * after the wordmark (the Eyebrow's signature, worn by the brand itself).
	 */
	/**
	 * The mark. `onLight` and `onDark` are the brand's own artwork for each
	 * surface, drawn as given; `src` alone is a light mark the header tints
	 * to ink on a light bar. `wordmark: false` drops the live name beside it.
	 */
	logo: {
		src?: string;
		alt: string;
		tile?: string;
		wordmark?: string | false;
		run?: boolean;
		onLight?: string;
		onDark?: string;
	};
	/** Google Fonts stylesheet URL for the theme's font stack. */
	fontsHref?: string;
	nav: NavItem[];
	/** The site's primary conversion action; rendered in nav, sticky bar, and menus. */
	cta: CTA;
	/** Omit for businesses with no public phone; call surfaces render nothing. */
	phone?: { e164: string; display: string };
	email: string;
	address: Address;
	geo?: { latitude: number; longitude: number };
	mapEmbedURL?: string;
	mapLinkURL?: string;
	/**
	 * Path to a static map screenshot (e.g. "/images/map.jpg"). When set, the
	 * map renders as a lightweight image linking to directions instead of the
	 * click-to-load live embed — one request, no third-party chain, and it
	 * shows a real map on first paint.
	 */
	mapImage?: string;
	hours: OpeningHours[];
	/**
	 * The clock the hours print on, wherever they appear (the footer, the
	 * hours table, the location section). "12h" (the default) reads "9a to 5p"
	 * in the footer and "9:00a to 5:00p" in the table; "24h" reads "09:00 to
	 * 17:00" in both, with leading zeros. Structured data is unaffected, since
	 * `opens` and `closes` are already 24 hour.
	 */
	clock?: Clock;
	/** Neighborhoods or cities served; feeds local SEO copy and structured data. */
	serviceAreas: string[];
	priceRange?: string;
	/** Cuisine types for a Restaurant/FoodEstablishment (schema.org servesCuisine). */
	servesCuisine?: string[];
	founder?: Founder;
	/** Names of offered services for structured data. */
	offers?: string[];
	/** The footer's Resources column (guides, financing, a patient portal). */
	footerLinks?: SiteLink[];
	/** The footer's Social column, each link printed with its icon. */
	socialLinks?: SocialLink[];
	/** The footer's Legal column. */
	legalLinks?: SiteLink[];
	/** Copyright attribution line suffix, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/**
	 * What the footer needs beyond the fields above. The default footer is a
	 * brand column (the logo, the rating linked to the Google profile,
	 * `address` linked to `mapLinkURL`, `phone`, `email`), the `hours` as a
	 * column of their own, and four link columns: Company from `nav`,
	 * Resources from `footerLinks`, Social from `socialLinks`, and Legal from
	 * `legalLinks`.
	 */
	footer?: {
		/** The Google rating as printed, e.g. "4.8 on Google". */
		rating?: string;
		/**
		 * Where the rating links, the profile holding the reviews. Defaults to
		 * `mapLinkURL`, the business's Google profile, whenever a rating is set.
		 */
		ratingHref?: string;
		/**
		 * The rating link's accessible name when it should say more than the
		 * rating's words, e.g. "4.8 on Google, opens the Google profile".
		 */
		ratingLabel?: string;
		/** The link columns, named outright, in place of the four the config derives. */
		columns?: FooterColumn[];
		/** The site's own words for the closing bar's right side, in place of the practice's credit. */
		note?: string;
		/**
		 * Set false to drop the address from the brand column and leave only
		 * the phone and email (a practice with no storefront has nothing to
		 * visit). Defaults to true.
		 */
		showAddress?: boolean;
		/**
		 * Set false to keep the hours out of the footer while `hours` still
		 * feeds the structured data and the sections that print them. Defaults
		 * to true: a site whose config holds hours shows them in its footer.
		 */
		showHours?: boolean;
	};
	ogImage?: string;
	/** Profile URLs for the schema.org sameAs entity graph (socials, listings). */
	sameAs?: string[];
	/**
	 * Robots meta override for every page (e.g. "noindex, nofollow" while the
	 * site lives on a preview subdomain). Defaults to indexable.
	 */
	robots?: string;
	/**
	 * Analytics wiring. When `hubspotPortalId` is set, the HubSpot tracking code
	 * loads on every page and records visits; because each prospect gets a
	 * unique preview URL, a visit is attributable to that prospect. `hubspotRegion`
	 * picks the loader host and defaults to "na1"; na2 portals (loggable via a
	 * bcc.na2 address) load from js-na2.hs-scripts.com.
	 *
	 * `identify` ties a visit to a specific prospect: when the visit arrives with
	 * `?k=<token>` (the token embedded in that prospect's outreach link), the
	 * visitor is identified to HubSpot as `email`, so the visit attaches to that
	 * prospect's contact timeline. Visits without the token stay anonymous.
	 */
	analytics?: {
		/**
		 * GA4 measurement id (e.g. "G-XXXXXXXXXX"). When set, the Google tag
		 * loads on every page and the conversion events in
		 * the site's own analytics module (the standard set in DEPLOY.md)
		 * reach GA. Independent of the HubSpot wiring; a site can carry either
		 * or both.
		 */
		googleTagId?: string;
		hubspotPortalId?: string;
		hubspotRegion?: "na1" | "na2" | "eu1";
		identify?: { token: string; email: string };
	};
	/** Copy for the access-gate login screen (see GateConfig). */
	gate?: GateConfig;
	/** The section spacing every page wears (see Density). Defaults to `default`. */
	density?: Density;
	/**
	 * Words shown beside the burger on a phone, e.g. "Menu", which then also
	 * name the button. Absent, the burger stands alone as it always has.
	 */
	menuLabel?: string;
	/** What the header shows beyond the nav and the CTA. */
	header?: {
		/** Up to two numbers in the bar, each a tel link; the first is the phone's call button. */
		phones?: HeaderPhone[];
	};
	/**
	 * The floating Get in Touch launcher. Present, `SiteShell` mounts the
	 * dock on every page; absent, there is none.
	 */
	contactDock?: ContactDockConfig;
}
