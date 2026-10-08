/**
 * The contract between an artifact and the components that host it.
 *
 * An artifact is a document, not a business's website, so this is a fraction
 * of a marketing site's config: who it is from, who it was prepared for,
 * where it is hosted, who may read it, and whether an open reports to the
 * CRM. Everything a reader sees on the page itself arrives as content, never
 * from here.
 */

/**
 * Copy for the access-gate login screen. Present in the config so the login
 * page is themed and worded per artifact with no code edits. The gate itself
 * is turned on by setting GATE_SESSION_SECRET on the Vercel project, not by
 * this block; `access` below says whether it must be. See ACCESS-GATE.md.
 */
export interface GateConfig {
	/** Mono eyebrow above the headline, e.g. "Private preview". */
	eyebrow?: string;
	/** Login headline. */
	headline: string;
	/** Sub-lead under the headline. */
	lead: string;
	/** Fine-print attribution, e.g. "Built by Jane Maker". Defaults to the sender's name. */
	builtBy?: string;
	/** Contact email shown in the fine print. Defaults to the sender's email. */
	contactEmail?: string;
}

/**
 * A named reader, sealed. This config ships in the script every page loads,
 * so it lists neither the reader's email nor their token: `id` is a digest
 * of the token, and `sealed` is the email encrypted under a key derived from
 * it. Only the reader's own link opens it (readers.ts).
 */
export interface ArtifactReader {
	id: string;
	sealed: string;
}

/**
 * Who the document is from: the practice, on every artifact. The lockup in
 * the header renders from `logo` exactly as the marketing chrome's does, so
 * a client branded artifact host keeps the sender's chrome over the client's
 * palette (GATE.md, Branding an Artifact Host).
 */
export interface ArtifactSender {
	/** The sender's name, worn in the header and the gate's fine print. */
	name: string;
	/**
	 * The chrome identity. `src` is the mark image; omit it for a pure text
	 * wordmark. `tile` renders a CSS glyph tile instead of an image (a dark
	 * rounded square bearing the given character in the brand's own webfont,
	 * with the accent bar beneath, since an SVG-as-img mark cannot load
	 * webfonts). `wordmark` overrides the rendered text when it should differ
	 * from `name`; `run` appends the trailing fade bar after it.
	 */
	logo: { src?: string; alt: string; tile?: string; wordmark?: string; run?: boolean };
	/** Where the header lockup points; the sender's own site. */
	href?: string;
	/** Reply address, shown in the access gate's fine print. */
	email: string;
}

/** Who the document was prepared for; the business's name suffixes every title. */
export interface ArtifactRecipient {
	name: string;
	/**
	 * The recipient's mark for the header lockup ("atelic × <mark>"), cut for
	 * the dark bar (a light mark on transparent). Unset, the header wears the
	 * sender's lockup alone. ArtifactShell passes it to the ui header as
	 * `brand.recipient` (@atelic-action/ui 0.6.0 and later).
	 *
	 * A logo is a brand mark, not a private signal, so the file lives under
	 * public/brand/, which the access wall leaves open: the router's pending
	 * page carries the header, so every page preloads this mark, the login
	 * page included, and one under public/images/ would be held there. The
	 * writeup's printed copy is white paper, so the lockup it prints in place
	 * of the header takes a mark cut for a light ground (`recipient.logoSrc`
	 * in the writeup's content).
	 */
	logo?: { src: string; alt: string };
}

export interface ArtifactConfig {
	/** Canonical origin of the hosted twin, no trailing slash, e.g. "https://og.atelic.me". */
	url: string;
	/**
	 * Who may read it, which decides where it may be hosted (the practice's
	 * FOOTPRINT.md, Privacy). "public" when everything on it was read from
	 * public signals, a prospect's writeup; "private" when anything came from
	 * the owner's own consoles, which is every customer's writeup and every
	 * monthly page. A private artifact deploys only behind the armed wall:
	 * the build fails on Vercel without the wall's variables
	 * (scripts/check-access.ts), and scripts/check-wall.ts proves the live
	 * host answers with the wall before any link goes out (ACCESS-GATE.md).
	 */
	access: "public" | "private";
	sender: ArtifactSender;
	recipient: ArtifactRecipient;
	/** Social card image; a site-relative path resolves against `url`. */
	ogImage?: string;
	/**
	 * Robots line for every page. Artifacts default to "noindex, nofollow"
	 * and there is no reason to raise it: a document handed to one business
	 * is never search inventory.
	 */
	robots?: string;
	/**
	 * Analytics wiring. When `hubspotPortalId` is set, the HubSpot tracking
	 * code loads and records the open; because an artifact lives on its own
	 * host, every visit is attributable to that engagement. `hubspotRegion`
	 * picks the loader host and defaults to "na1"; na2 portals load from
	 * js-na2.hs-scripts.com.
	 *
	 * `identify` says who each link identifies, and every cut says it: a
	 * reader for every named person a link goes to, or an empty list. When a
	 * visit arrives with `?k=<token>` (the token on that person's link), the
	 * visitor is identified to HubSpot by their email, so the open lands on
	 * their contact timeline. Visits without a token stay anonymous. Mint a
	 * reader with `bun run reader <email>`.
	 *
	 * A private artifact needs nobody listed: its readers sign in at the
	 * wall and are identified by the email they signed in with. DEPLOY.md,
	 * Who Opened It, is the procedure.
	 */
	analytics?: {
		hubspotPortalId: string;
		hubspotRegion?: "na1" | "na2" | "eu1";
		identify: ArtifactReader[];
	};
	/** Copy for the access-gate login screen (see GateConfig). */
	gate?: GateConfig;
}
