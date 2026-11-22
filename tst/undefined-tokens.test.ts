import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Three tokens the sheets read that nothing defined, so they silently did
 * nothing: the shadows a frame and a card draw, the sign off's script face,
 * and the prose bodies' color (ATE-772). Each now resolves: a default in
 * defaults.css, or a fallback at every read.
 */

const STYLES = join(import.meta.dirname, "..", "src", "styles");
const layered = readdirSync(STYLES).filter((name) => name.endsWith(".css") && name !== "app.css");
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

describe("tokens read but once undefined", () => {
	it("defaults the shadows and the script face to neutral values, no site's brand", () => {
		const defaults = sheet("defaults.css");
		expect(defaults).toMatch(
			/--shadow-md: 0 4px 14px rgb\(0 0 0 \/ 0\.08\), 0 12px 32px rgb\(0 0 0 \/ 0\.06\);/,
		);
		expect(defaults).toMatch(
			/--shadow-lg: 0 10px 30px rgb\(0 0 0 \/ 0\.12\), 0 30px 70px rgb\(0 0 0 \/ 0\.1\);/,
		);
		expect(defaults).toMatch(
			/--font-script: "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive;/,
		);
		// No self hosted face a template ships: the package bundles no font.
		expect(defaults).not.toMatch(/Yellowtail/);
	});

	it("reads --neutral-700, which no theme sets, with the ink behind it everywhere", () => {
		let reads = 0;
		for (const name of layered) {
			for (const match of sheet(name).matchAll(/var\(--neutral-700([^)]*)\)/g)) {
				reads += 1;
				expect(match[1], `${name}: ${match[0]}`).toBe(", var(--ink");
			}
		}
		expect(reads).toBeGreaterThan(0);
	});
});
