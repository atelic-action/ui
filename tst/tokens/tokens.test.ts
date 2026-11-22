// @vitest-environment node
import { contrastRatio } from "../../src/email/theme";
import { atelicFonts, atelicPalette, themeTokenMap, toThemeCSS } from "../../src/tokens";

describe("the email palette", () => {
	it("carries the hex values the jq library defines, casing included, with the brand's faint, the accent's ink, and warm darkened for contrast", () => {
		expect(atelicPalette).toEqual({
			ground: "#F6F1E7",
			paper: "#FDFBF6",
			ink: "#151515",
			dim: "#55503f",
			faint: "#6e6757",
			accent: "#FC4A1A",
			accentInk: "#B8300B",
			line: "#E6DFD2",
			hair: "#F0EAE0",
			up: "#2F7A4B",
			down: "#B23A2E",
			warm: "#966319",
		});
	});

	it("sets every color that words wear at 4.5 to 1 or better on both the paper and the ground", () => {
		const words = ["ink", "dim", "faint", "accentInk", "up", "down", "warm"] as const;
		for (const key of words) {
			for (const ground of [atelicPalette.paper, atelicPalette.ground]) {
				expect(
					contrastRatio(atelicPalette[key] as string, ground),
					`${key} on ${ground}`,
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});

	it("stores font family values, not whole declarations", () => {
		expect(atelicFonts).toEqual({
			mono: "'Courier New',monospace",
			sans: "'Helvetica Neue',Helvetica,Arial,sans-serif",
		});
		expect(atelicFonts.mono).not.toContain("font-family");
	});
});

describe("toThemeCSS", () => {
	it("maps the palette onto the site token names", () => {
		expect(toThemeCSS(atelicPalette)).toBe(
			[
				"--surface: #F6F1E7;",
				"--surface-dark: #151515;",
				"--card: #FDFBF6;",
				"--ink: #151515;",
				"--primary: #FC4A1A;",
			].join("\n"),
		);
	});

	it("follows a client palette", () => {
		const css = toThemeCSS({ ...atelicPalette, accent: "#0B6E4F" });
		expect(css).toContain("--primary: #0B6E4F;");
		expect(css).not.toContain("#FC4A1A");
	});

	it("exposes the mapping so it can be inspected", () => {
		expect(themeTokenMap["--primary"]).toBe("accent");
		expect(Object.keys(themeTokenMap)).toHaveLength(5);
	});
});
