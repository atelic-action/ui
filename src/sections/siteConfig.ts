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
import type { SiteLink, SocialLink } from "../types";

export type { SiteLink, SocialLink };

export interface NavItem {
	label: string;
	to: string;
}

export interface CTA {
	label: string;
	href: string;
	/** Opens in a new tab with rel="noopener" when true (e.g. a booking portal). */
	external?: boolean;
}

/** How opening hours print: "12h" reads "9a to 5p", "24h" reads "09:00 to 17:00". */
export type Clock = "12h" | "24h";

export interface OpeningHours {
	/** Row label as displayed, e.g. "Monday" or "Friday to Sunday". */
	label: string;
	/** Compact label for the footer, e.g. "Mon" or "Fri to Sun". */
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
	 * ("https://atwood.atelic.me/proto"), and the build fails if it does not
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
	logo: { src?: string; alt: string; tile?: string; wordmark?: string; run?: boolean };
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
	/** Short brand paragraph for the footer. */
	footerBlurb: string;
	/** Extra footer nav links beyond the main nav (e.g. a patient portal). */
	footerLinks?: SiteLink[];
	/** Icon links (socials, the founder's own site) rendered in the footer brand column. */
	socialLinks?: SocialLink[];
	legalLinks?: SiteLink[];
	/** Copyright attribution line suffix, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/**
	 * Footer wording overrides: the heading over the address column (defaults
	 * to "Visit", which reads wrong for a practice with no storefront) and a
	 * short closing note beside the copyright line ("Made with love in ...").
	 */
	footer?: {
		contactHeading?: string;
		note?: string;
		/**
		 * Set false to drop the name and address lines from the contact column
		 * and leave only the phone and email under the heading (a practice with
		 * no storefront has nothing to visit). Defaults to true.
		 */
		showAddress?: boolean;
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
}
