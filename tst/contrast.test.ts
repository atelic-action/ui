import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Words meet 4.5 to 1 against what they sit on. The package's own color
 * defaults are measured here against the practice's grounds, the palette
 * the stories wear (the surface, the card, and the alternate band), and the
 * sheets are read for the token each quiet or inset word reads, since jsdom
 * paints nothing (ATE-772).
 */

const STYLES = join(import.meta.dirname, "..", "src", "styles");
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

/** A default's value as declared in defaults.css. */
function declared(token: string): string {
	const match = sheet("defaults.css").match(new RegExp(`${token}:\\s*(#[0-9a-f]{6});`, "i"));
	if (!match?.[1]) throw new Error(`no hex default for ${token}`);
	return match[1];
}

function luminance(hex: string): number {
	const channel = (offset: number) => {
		const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
		return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** The WCAG contrast ratio of two colors. */
function ratio(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

const grounds = { surface: "#f6f1e7", card: "#fdfbf6", alternate: "#efe8da" };

describe("the package's color defaults", () => {
	it("measures the way WCAG does", () => {
		expect(ratio("#000000", "#ffffff")).toBeCloseTo(21, 5);
		expect(ratio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
	});

	for (const token of ["--tone-good", "--tone-warn", "--tone-bad", "--grade-b"]) {
		it(`sets ${token}'s words at 4.5 to 1 or more on the surface, the card, and the alternate band`, () => {
			const words = declared(token);
			for (const [name, ground] of Object.entries(grounds)) {
				expect(ratio(words, ground), `${token} ${words} on the ${name}`).toBeGreaterThanOrEqual(
					4.5,
				);
			}
		});
	}

	it("sets each tone's and grade's words at 4.5 to 1 on its own ground", () => {
		for (const [words, ground] of [
			["--tone-good", "--tone-good-bg"],
			["--tone-warn", "--tone-warn-bg"],
			["--tone-bad", "--tone-bad-bg"],
			["--grade-b", "--grade-b-bg"],
		] as const) {
			expect(
				ratio(declared(words), declared(ground)),
				`${words} on ${ground}`,
			).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe("the token each quiet word reads", () => {
	const sections = sheet("sections.css");

	it("sets the contact form's error words in the primary's ink, never the deep fill", () => {
		// The words read --field-error first (8.5.0), and unset fall back to
		// exactly the primary's ink, as they always did.
		expect(sections).toMatch(
			/\.field \.err \{[^}]*color: var\(--field-error, var\(--primary-ink, var\(--primary\)\)\);/,
		);
		expect(sections).toMatch(
			/\.form-alert \{[^}]*color: var\(--field-error, var\(--primary-ink, var\(--primary\)\)\);/,
		);
		expect(sections).toMatch(/\.form-error \{[^}]*color: var\(--primary-ink, var\(--primary\)\);/);
		expect(sections).not.toMatch(/\.field \.err \{[^}]*color: var\(--primary-deep\)/);
	});

	it("sets the carousel's denominator in the quiet gray, never the rule gray", () => {
		expect(sections).toMatch(/\.rvc-score-out \{[^}]*color: var\(--neutral-500\);/);
	});

	it("sets every soft word on the inset well in --ink-inset", () => {
		const inset = /color: var\(--ink-inset, var\(--ink-soft\)\);/;
		for (const selector of [
			"\\.map-facade-hint",
			"\\.profile-placeholder",
			"\\.rslider-ph\\.is-before",
		]) {
			expect(sections).toMatch(new RegExp(`${selector} \\{[^}]*${inset.source}`));
		}
		expect(sheet("primitives.css")).toMatch(
			new RegExp(`\\.atelic-ui \\.ph \\{[^}]*${inset.source}`),
		);
	});
});
