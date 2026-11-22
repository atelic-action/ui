import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every color a layered sheet paints comes from a token, so a site's
 * theme.css recolors all of it (CLAUDE.md, Component Rules, 3). A raw color
 * may appear only where a token is declared (`--on-primary: #fff;`, which is
 * where the defaults and the tone palette live) or on a line listed below
 * with its reason. `color-mix()`, `transparent`, and `currentColor` are not
 * colors of their own and pass. `styles/app.css` (Tailwind source, outside
 * the layer) and `src/email/` (inline literals by design) are not swept.
 */
const SHEETS = [
	"base.css",
	"chrome.css",
	"sections.css",
	"primitives.css",
	"components.css",
	"gate.css",
	"artifact.css",
	"star-rating.css",
];

/** A line that may keep a raw color, by sheet and an exact piece of the line, with why. */
const ALLOWED: { sheet: string; line: string; reason: string }[] = [
	{
		sheet: "sections.css",
		line: "-webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);",
		reason: "the marquee's edge fade is a mask: only its alpha counts, and no color is painted",
	},
	{
		sheet: "sections.css",
		line: "mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);",
		reason: "the same mask, unprefixed",
	},
];

const NAMED = [
	"white",
	"black",
	"red",
	"green",
	"blue",
	"gray",
	"grey",
	"orange",
	"yellow",
	"purple",
	"pink",
	"brown",
	"silver",
	"gold",
	"navy",
	"teal",
	"maroon",
	"olive",
	"lime",
	"aqua",
	"fuchsia",
	"cyan",
	"magenta",
	"beige",
	"ivory",
	"tan",
	"coral",
	"salmon",
	"crimson",
	"indigo",
	"violet",
];

const RAW = new RegExp(
	[
		"#[0-9a-fA-F]{3,8}\\b",
		"\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\\(",
		`(?<![\\w.#-])(?:${NAMED.join("|")})(?![\\w-])`,
	].join("|"),
);

const STYLES = join(import.meta.dirname, "..", "src", "styles");

/** The sheet's lines with every comment blanked out, line numbers kept. */
function codeLines(css: string): string[] {
	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
	return stripped.split("\n");
}

function rawColorOffenders(sheet: string, css: string): string[] {
	const offenders: string[] = [];
	codeLines(css).forEach((line, i) => {
		const match = RAW.exec(line);
		if (!match) return;
		const code = line.trim();
		if (/^--[\w-]+\s*:/.test(code)) return;
		if (ALLOWED.some((entry) => entry.sheet === sheet && code === entry.line)) return;
		offenders.push(`${sheet}:${i + 1} paints "${match[0]}": ${code}`);
	});
	return offenders;
}

describe("raw colors in the layered sheets", () => {
	it("keeps every painted color on a token", () => {
		const offenders = SHEETS.flatMap((sheet) =>
			rawColorOffenders(sheet, readFileSync(join(STYLES, sheet), "utf8")),
		);
		expect(offenders).toEqual([]);
	});

	it("bites on a hex, a function, and a named color, and spares a declaration and a comment", () => {
		const css = [
			".atelic-ui .a { color: #fff; }",
			".atelic-ui .b { background: rgba(0, 0, 0, 0.5); }",
			".atelic-ui .c { border-color: white; }",
			"	--on-primary: #fff;",
			"/* a white mark on a #000 ground */",
			".atelic-ui .d { white-space: nowrap; color: color-mix(in srgb, var(--ink) 50%, transparent); }",
			".atelic-ui .on-dark { color: var(--on-dark); }",
		].join("\n");
		expect(rawColorOffenders("x.css", css)).toEqual([
			'x.css:1 paints "#fff": .atelic-ui .a { color: #fff; }',
			'x.css:2 paints "rgba(": .atelic-ui .b { background: rgba(0, 0, 0, 0.5); }',
			'x.css:3 paints "white": .atelic-ui .c { border-color: white; }',
		]);
	});

	it("gives every allowed line a reason", () => {
		for (const entry of ALLOWED) expect(entry.reason.length).toBeGreaterThan(10);
	});
});
