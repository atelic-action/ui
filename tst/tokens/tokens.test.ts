// @vitest-environment node
import { atelicFonts, atelicPalette, themeTokenMap, toThemeCSS } from "../../src/tokens";

describe("the email palette", () => {
	it("carries the hex values the jq library defines, casing included", () => {
		expect(atelicPalette).toEqual({
			ground: "#F6F1E7",
			paper: "#FDFBF6",
			ink: "#151515",
			dim: "#55503f",
			faint: "#8a8272",
			accent: "#FC4A1A",
			line: "#E6DFD2",
			hair: "#F0EAE0",
		});
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
