import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every color a layered sheet paints comes from a token, so a site's
 * theme.css recolors all of it (CLAUDE.md, Component Rules, 3). A raw color
 * may appear only as a token's default in the defaults sheet
 * (`defaults.css`, whose `:where(.atelic-ui)` rules hold every default, the
 * tone palette included, and which every layered sheet imports) or on a line
 * listed below with its reason; a custom property declared
 * with a raw color anywhere else is a second, hidden palette and fails.
 * `color-mix()`, `transparent`, and `currentColor` are not colors of their
 * own and pass. Every sheet in `src/styles/` is swept, a new one included,
 * except those excluded below with their reasons (the excluded skip the
 * defaults import check too); `src/email/` (inline
 * literals by design) is not a sheet.
 */
const STYLES = join(import.meta.dirname, "..", "src", "styles");

/** A sheet the sweep leaves out, with why. */
const EXCLUDED: { sheet: string; reason: string }[] = [
	{
		sheet: "app.css",
		reason:
			"Tailwind source for the app shell, outside the atelic-ui layer, whose default tokens are the app's own palette",
	},
	{
		sheet: "theme.css",
		reason:
			"the one sheet that holds theme values, the practice's own palette, opted into by import (README.md, Theme); tst/theme-contract.test.ts holds its shape",
	},
];

const SHEETS = readdirSync(STYLES)
	.filter((name) => name.endsWith(".css"))
	.filter((name) => !EXCLUDED.some((entry) => entry.sheet === name))
	.sort();

/** The sheet and the rules whose custom property declarations may carry a raw color. */
const DEFAULTS = {
	sheet: "defaults.css",
	selectors: [":where(.atelic-ui) {", ":where(.atelic-ui) ::backdrop {"],
	// The long word rules, the one thing beside the tokens that every sheet
	// needs as it needs the defaults (defaults.css, Long words). They set
	// inherited properties and no token, so no raw color may sit in them.
	rules: [
		":where(.atelic-ui) {",
		":where(.atelic-ui table) {",
		':where(.atelic-ui a[href^="tel:"]:not(:has(:not(svg, svg *))), .atelic-ui .tel-number) {',
		".atelic-ui .visually-hidden {",
	],
};

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

/** The sheet's lines with every comment blanked out, line numbers kept. */
function codeLines(css: string): string[] {
	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
	return stripped.split("\n");
}

/**
 * The line numbers (0 based, first and last) of every block opened by a line
 * that is exactly `selector`, found by brace depth on comment free lines.
 */
function blocks(lines: string[], selector: string): [number, number][] {
	const found: [number, number][] = [];
	lines.forEach((line, start) => {
		if (line.trim() !== selector) return;
		let depth = 0;
		for (let i = start; i < lines.length; i += 1) {
			for (const char of lines[i]) {
				if (char === "{") depth += 1;
				if (char === "}") depth -= 1;
			}
			if (depth === 0) {
				found.push([start, i]);
				return;
			}
		}
		found.push([start, lines.length - 1]);
	});
	return found;
}

function rawColorOffenders(sheet: string, css: string): string[] {
	const offenders: string[] = [];
	const lines = codeLines(css);
	const defaults =
		sheet === DEFAULTS.sheet
			? DEFAULTS.selectors.flatMap((selector) => blocks(lines, selector))
			: [];
	const inDefaults = (i: number) => defaults.some(([first, last]) => i > first && i < last);
	lines.forEach((line, i) => {
		const match = RAW.exec(line);
		if (!match) return;
		const code = line.trim();
		if (inDefaults(i) && /^--[\w-]+\s*:/.test(code)) return;
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

	it("finds every sheet in the styles folder, and excludes only what it names", () => {
		expect(SHEETS).toContain("components.css");
		expect(SHEETS).toContain("chrome.css");
		for (const entry of EXCLUDED) expect(SHEETS).not.toContain(entry.sheet);
		for (const entry of EXCLUDED) expect(entry.reason.length).toBeGreaterThan(10);
	});

	it("keeps the defaults in the one sheet, holding nothing but them, imported by every layered sheet", () => {
		const lines = codeLines(readFileSync(join(STYLES, DEFAULTS.sheet), "utf8"));
		const rules = lines.map((line) => line.trim()).filter((line) => line.endsWith("{"));
		expect(rules).toEqual([
			"@layer atelic-ui {",
			DEFAULTS.selectors[0],
			...DEFAULTS.rules,
			DEFAULTS.selectors[1],
		]);
		// The long word rules carry no token of their own.
		const css = readFileSync(join(STYLES, DEFAULTS.sheet), "utf8");
		for (const rule of DEFAULTS.rules.slice(1)) {
			const body = css.slice(css.indexOf(rule) + rule.length, css.indexOf("}", css.indexOf(rule)));
			expect(body, rule).not.toMatch(/--[\w-]+:/);
		}
		for (const sheet of SHEETS.filter((name) => name !== DEFAULTS.sheet)) {
			const css = readFileSync(join(STYLES, sheet), "utf8");
			expect(codeLines(css).some((line) => line.trim().startsWith(":where(.atelic-ui)"))).toBe(
				false,
			);
			// star-rating.css is outside the scope by design and is imported by components.css.
			if (sheet !== "star-rating.css")
				expect(css.startsWith('@import "./defaults.css";')).toBe(true);
		}
	});

	it("bites on a hex, a function, and a named color, and spares a comment", () => {
		const css = [
			".atelic-ui .a { color: #fff; }",
			".atelic-ui .b { background: rgba(0, 0, 0, 0.5); }",
			".atelic-ui .c { border-color: white; }",
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

	it("spares a raw token default inside the defaults block, and only there", () => {
		const css = [
			":where(.atelic-ui) {",
			"	--on-primary: #fff;",
			"}",
			".atelic-ui {",
			"	--tone-good: #1b7f3b;",
			"}",
			".atelic-ui .band {",
			"	--on-primary: #fff;",
			"}",
		].join("\n");
		expect(rawColorOffenders("defaults.css", css)).toEqual([
			'defaults.css:5 paints "#1b7f3b": --tone-good: #1b7f3b;',
			'defaults.css:8 paints "#fff": --on-primary: #fff;',
		]);
		// The same block in another sheet is no defaults block at all.
		expect(rawColorOffenders("chrome.css", css)).toHaveLength(3);
	});

	it("gives every allowed line a reason", () => {
		for (const entry of ALLOWED) expect(entry.reason.length).toBeGreaterThan(10);
	});
});
