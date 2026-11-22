// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "../../src/email/theme";

/*
 * The light theme's words against what they sit on, read from the sheet
 * itself, so a token moved back to a stock default that falls short fails
 * here before any page shows it.
 */

const css = readFileSync(resolve(__dirname, "../../src/styles/app.css"), "utf8");

/** An `H S% L%` or `hsl(H, S%, L%)` value as a hex color. */
function hex(value: string): string {
	const [h, s, l] = value
		.replace(/hsl\(|\)/g, "")
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((part) => Number.parseFloat(part));
	const sat = s / 100;
	const light = l / 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = sat * Math.min(light, 1 - light);
	const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return `#${[f(0), f(8), f(4)]
		.map((v) =>
			Math.round(v * 255)
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`;
}

/** The value a custom property takes inside the first rule matching `selector`. */
function token(selector: string, name: string): string {
	const start = css.indexOf(selector);
	if (start < 0) throw new Error(`no rule for ${selector}`);
	const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
	const match = body.match(new RegExp(`${name}:\\s*([^;]+);`));
	if (!match) throw new Error(`no ${name} in ${selector}`);
	return hex(match[1].trim());
}

const light = (name: string) => token(":root {", name);
const ratio = (fg: string, bg: string) => contrastRatio(fg, bg) ?? 0;

describe("the light theme in styles/app.css", () => {
	it("takes red 600 for the destructive token and a passing grey for muted words", () => {
		expect(light("--destructive")).toBe("#dc2626");
		expect(light("--muted-foreground")).toBe("#6b6b73");
	});

	it("sets white words on a destructive fill at 4.5 to 1 or better", () => {
		expect(ratio(light("--destructive-foreground"), light("--destructive"))).toBeGreaterThanOrEqual(
			4.5,
		);
	});

	it("sets destructive words at 4.5 to 1 or better on a card and on the ground", () => {
		for (const ground of ["--card", "--background", "--popover"]) {
			expect(ratio(light("--destructive"), light(ground)), ground).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("sets muted words at 4.5 to 1 or better on every light surface, the grey highlight included", () => {
		for (const ground of [
			"--card",
			"--background",
			"--popover",
			"--muted",
			"--accent",
			"--secondary",
		]) {
			expect(ratio(light("--muted-foreground"), light(ground)), ground).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("darkens a destructive fill on hover and press instead of lightening it", () => {
		expect(css).toMatch(
			/--color-destructive-hover:\s*color-mix\(in srgb, hsl\(var\(--destructive\)\) 85%, black\);/,
		);
	});

	it("sets every rich toast tone's words at 4.5 to 1 or better on its own tint", () => {
		// The tints are sonner's own, which the sheet leaves alone.
		const tints = {
			success: "hsl(143, 85%, 96%)",
			info: "hsl(208, 100%, 97%)",
			warning: "hsl(49, 100%, 97%)",
			error: "hsl(359, 100%, 97%)",
		};
		const rule = '[data-sonner-toaster][data-sonner-theme="light"] {';
		for (const [tone, tint] of Object.entries(tints)) {
			expect(ratio(token(rule, `--${tone}-text`), hex(tint)), tone).toBeGreaterThanOrEqual(4.5);
		}
	});
});
