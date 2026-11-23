import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const STYLES = join(import.meta.dirname, "..", "src", "styles");
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

/** The declarations of the first rule whose selector is exactly `selector`, sorted. */
function declarations(css: string, selector: string): string[] {
	const at = css.indexOf(`${selector} {`);
	expect(at, `${selector} is in the sheet`).toBeGreaterThan(-1);
	const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
	return body
		.split(";")
		.map((line) => line.trim())
		.filter(Boolean)
		.sort();
}

/*
 * The field label is written in three sheets, since an app loads
 * components.css alone and the multi select's label has to look like every
 * other field's there too. The three copies drifted once (8.5.0, review);
 * this holds them identical.
 */
describe("the field label's three copies", () => {
	const copies = [
		["sections.css", ".atelic-ui .field label", ".atelic-ui .field-hint"],
		[
			"primitives.css",
			".atelic-ui .address-search .address-search-label",
			".atelic-ui .address-search .address-search-label small",
		],
		[
			"components.css",
			".atelic-ui .multi-select .multi-select-label",
			".atelic-ui .multi-select .multi-select-label small",
		],
	] as const;

	it("set the label identically in every sheet", () => {
		const [first, ...rest] = copies.map(([name, label]) => declarations(sheet(name), label));
		for (const other of rest) expect(other).toEqual(first);
		expect(first).toContain("color: var(--field-label-color, var(--neutral-600, var(--ink-soft)))");
	});

	it("set the hint beside it identically in every sheet", () => {
		const [first, ...rest] = copies.map(([name, , hint]) => declarations(sheet(name), hint));
		for (const other of rest) expect(other).toEqual(first);
	});
});

describe("selectors", () => {
	it("never wrap a lone selector in :is()", () => {
		const layered = readdirSync(STYLES).filter(
			(name) => name.endsWith(".css") && name !== "app.css",
		);
		for (const name of layered) {
			expect(sheet(name), name).not.toMatch(/:is\([^,()]+\)/);
		}
	});
});
