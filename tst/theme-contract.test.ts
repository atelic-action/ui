import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The theme contract: every token the component sheets read is declared,
 * either by a theme (the practice's own, `styles/theme.css`, is the worked
 * example a client theme copies) or as a default in `styles/defaults.css`.
 * A theme that drops a token the components read leaves a site's colors,
 * type, or layout falling back to nothing, so this fails first. The
 * contract's prose is the README's Theme table, and every token the sheet
 * declares has its row there.
 *
 * Every sheet in `src/styles/` is swept, a new one included, but the three
 * that are not component sheets: `app.css` (Tailwind source for the app
 * shell, with its own token mapping), `defaults.css`, and `theme.css`, which
 * declare the tokens rather than read them. A token a sheet reads that no
 * theme is expected to set is excluded below by name, with why; private
 * `--_` properties, which a component sets on its own root, are left out
 * by their prefix.
 */
const STYLES = join(import.meta.dirname, "..", "src", "styles");
const README = join(import.meta.dirname, "..", "README.md");
const NOT_READERS = ["app.css", "defaults.css", "theme.css"];

const READ_IN_PLACE =
	"an optional token whose default names another token or the inherited value, read in place as an inline fallback (README.md, Tokens; the defaults.css comment)";

/** A token the sheets read that neither the theme nor the defaults declare, with why. */
const EXCLUDED: { token: string; reason: string }[] = [
	// Set at runtime, or by a component on itself.
	{
		token: "--sticky-cta-space",
		reason: "SiteShell sets it on its root from StickyCTABar's measurement",
	},
	{ token: "--tone", reason: "set by a [data-tone] rule from the tone palette in defaults.css" },
	{ token: "--tone-bg", reason: "set by a [data-tone] rule from the tone palette in defaults.css" },
	{
		token: "--tone-fill",
		reason: "set by a [data-tone] rule from the tone palette in defaults.css",
	},
	{
		token: "--ui-card",
		reason: "the app's alias for --card, read with the plain token as its fallback",
	},
	{
		token: "--ui-primary",
		reason: "the app's alias for --primary, read with the plain token as its fallback",
	},
	{ token: "--star-size", reason: "StarRating sets it from its size prop, with a 24px fallback" },
	{
		token: "--star-fill",
		reason:
			"StarRating sets it from its fill prop; the reads fall back to the text color or --review-gold",
	},
	{
		token: "--star-outline",
		reason: "StarRating sets it from its outline prop, falling back to a mix of the text color",
	},
	{
		token: "--star-focus",
		reason: "a star's focus ring, read with the text color as its fallback",
	},
	{ token: "--stat-size", reason: "a stat row's figure size, read with a 28px fallback" },
	{ token: "--cmp-gutter", reason: "ComparisonTable declares it on its own root" },
	{ token: "--cmp-stage", reason: "ComparisonTable declares it on its own root" },
	{ token: "--fg-cols", reason: "FeatureGrid sets it from its columns prop, with a 4 fallback" },
	{
		token: "--pb-tile-height",
		reason: "the photo board declares it on its own root, per breakpoint",
	},
	{
		token: "--expandable-lines",
		reason: "ExpandableText sets it from its lines prop, with a 3 fallback",
	},
	{
		token: "--expandable-ground",
		reason: "a card sets it to its own ground; unset it reads --surface in place",
	},
	{
		token: "--hero-split-edge",
		reason: "computed on the split hero's own inner element from --max-width and --gutter",
	},
	{
		token: "--hero-split-pad",
		reason: "the split hero's copy sides, computed on the element itself, read in place",
	},
	{
		token: "--radix-popover-content-available-height",
		reason: "Radix sets it on the popover at runtime",
	},
	{ token: "--radix-popover-trigger-width", reason: "Radix sets it on the popover at runtime" },
	{
		token: "--op-card",
		reason: "the artifact package's writeup token, read with --card as its fallback",
	},
	{
		token: "--op-ink-faint",
		reason: "the artifact package's writeup token, read with --neutral-500 as its fallback",
	},
	{
		token: "--op-shot-portrait-max",
		reason: "a writeup's portrait shot cap, read with a fixed fallback",
	},
	// Optional accents and faces a theme may set, each read with a fallback.
	{
		token: "--rule-accent",
		reason: "an accent rule's color, read with the text color as its fallback",
	},
	{
		token: "--brand-accent",
		reason: "the brand line's accent, read with --primary as its fallback",
	},
	{
		token: "--disclosure-focus",
		reason: "a disclosure's focus ring, read with --ink as its fallback",
	},
	{
		token: "--font-heading",
		reason: "a display face for headings, read with the inherited face as its fallback",
	},
	{
		token: "--font-condensed",
		reason:
			"a CalloutPanel title's face, read with --font-heading then --font-sans as its fallback",
	},
	{ token: "--neutral-700", reason: "the prose bodies' color, read with --ink as its fallback" },
	{
		token: "--callout-sub-font",
		reason: "a CalloutPanel line's face, inherited, which no custom property can hold",
	},
	{
		token: "--footer-nap-weight",
		reason: "the footer address's weight, inherited, which no custom property can hold",
	},
	// The optional tokens read in place.
	...[
		"--header-max",
		"--header-gutter",
		"--nav-open-bg",
		"--menu-card-bg",
		"--menu-card-ink",
		"--menu-badge-bg",
		"--menu-badge-ink",
		"--menu-cta-bg",
		"--menu-cta-ink",
		"--menu-rule",
		"--heading-weight",
		"--hero-kicker-weight",
		"--hero-kicker-tracking",
		"--hero-kicker-size",
		"--hero-kicker-leading",
		"--hero-stack-gap",
		"--hero-gap-kicker",
		"--hero-gap-lead",
		"--hero-gap-actions",
		"--hero-split-pad-block",
		"--proof-star-fill",
		"--footer-link",
		"--footer-link-hover",
		"--footer-brand-width",
		"--closing-link",
		"--closing-link-hover",
		"--ink-inset",
		"--field-label-font",
		"--field-label-color",
		"--field-label-weight",
		"--field-border",
		"--field-error",
		"--field-error-border",
		"--field-error-bg",
		"--field-error-weight",
		"--form-footnote-align",
		"--form-footnote-link-weight",
		"--form-footnote-link-color",
		"--hours-rule",
		"--hours-time-font",
		"--page-hero-kicker-font",
		"--page-hero-kicker-size",
		"--page-hero-kicker-weight",
		"--page-hero-kicker-tracking",
		"--page-hero-pad-block",
	].map((token) => ({ token, reason: READ_IN_PLACE })),
];

function stripComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function sheet(name: string): string {
	return stripComments(readFileSync(join(STYLES, name), "utf8"));
}

const READERS = readdirSync(STYLES)
	.filter((name) => name.endsWith(".css") && !NOT_READERS.includes(name))
	.sort();

/** Every public token a sheet reads, with the sheets that read it. */
function reads(): Map<string, string[]> {
	const found = new Map<string, string[]>();
	for (const name of READERS) {
		for (const match of sheet(name).matchAll(/var\(\s*(--[\w-]+)/g)) {
			const token = match[1];
			if (token.startsWith("--_")) continue;
			found.set(token, [...new Set([...(found.get(token) ?? []), name])]);
		}
	}
	return found;
}

/** Every token a sheet declares. */
function declared(name: string): Set<string> {
	return new Set(Array.from(sheet(name).matchAll(/(?:^|[;{\s])(--[\w-]+)\s*:/g), (m) => m[1]));
}

/** The tokens the README's Theme section lists, by the first cell of each table row. */
function contractRows(): string[] {
	const readme = readFileSync(README, "utf8");
	const start = readme.indexOf("\n## Theme\n");
	const end = readme.indexOf("\n## ", start + 1);
	const section = readme.slice(start, end);
	return Array.from(section.matchAll(/^\| `(--[\w-]+)` \|/gm), (m) => m[1]);
}

describe("the theme contract", () => {
	it("declares every token the component sheets read, in the theme or the defaults", () => {
		const theme = declared("theme.css");
		const defaults = declared("defaults.css");
		const excluded = new Set(EXCLUDED.map((entry) => entry.token));
		const missing = Array.from(reads())
			.filter(([token]) => !excluded.has(token) && !theme.has(token) && !defaults.has(token))
			.map(([token, sheets]) => `${token} (read in ${sheets.join(", ")})`);
		expect(missing).toEqual([]);
	});

	it("sweeps every component sheet, and leaves out only the three that declare", () => {
		expect(READERS).toEqual(expect.arrayContaining(["base.css", "chrome.css", "sections.css"]));
		for (const name of NOT_READERS) expect(READERS).not.toContain(name);
	});

	it("excludes only tokens a sheet still reads, each once, with its reason", () => {
		const read = reads();
		const tokens = EXCLUDED.map((entry) => entry.token);
		expect(new Set(tokens).size).toBe(tokens.length);
		for (const entry of EXCLUDED) {
			expect(read.has(entry.token), `${entry.token} is read by no sheet`).toBe(true);
			expect(entry.reason.length).toBeGreaterThan(10);
		}
		// No exclusion hides a token the theme or the defaults declare.
		const declaredAnywhere = new Set([...declared("theme.css"), ...declared("defaults.css")]);
		expect(tokens.filter((token) => declaredAnywhere.has(token))).toEqual([]);
	});

	it("documents every optional token read in place in the README's Tokens table", () => {
		const readme = readFileSync(README, "utf8");
		const undocumented = EXCLUDED.filter((entry) => entry.reason === READ_IN_PLACE)
			.map((entry) => entry.token)
			.filter((token) => !readme.includes(`\`${token}\``));
		expect(undocumented).toEqual([]);
	});

	it("gives every token the sheet declares its row in the README's Theme table, and no other", () => {
		const rows = contractRows();
		const theme = declared("theme.css");
		const defaults = declared("defaults.css");
		expect(rows.length).toBeGreaterThan(40);
		expect([...theme].filter((token) => !rows.includes(token))).toEqual([]);
		// A row the sheet leaves out is a token the defaults carry (the script face).
		expect(rows.filter((token) => !theme.has(token) && !defaults.has(token))).toEqual([]);
	});

	it("names its layer after the components' before anything else, and bundles no font", () => {
		const css = sheet("theme.css").trim();
		expect(css.startsWith("@layer atelic-ui, atelic-ui-theme;")).toBe(true);
		expect(css).not.toMatch(/@font-face/);
		expect(css).not.toMatch(/@import/);
		// Every declaration sits inside the theme layer, on the one root class.
		const body = css.slice("@layer atelic-ui, atelic-ui-theme;".length).trim();
		expect(body.startsWith("@layer atelic-ui-theme {")).toBe(true);
		expect(Array.from(body.matchAll(/([^{};]+)\{/g), (m) => m[1].trim())).toEqual([
			"@layer atelic-ui-theme",
			".atelic-ui",
		]);
	});
});
