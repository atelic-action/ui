import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const STYLES = join(import.meta.dirname, "..", "src", "styles");
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

/*
 * The field label and its hint are one rule, held in fields.css, which the
 * three field sheets import: so an app loading components.css alone still
 * gets the multi select's label, and no copy can drift.
 */
describe("the field label's one rule", () => {
	const layered = readdirSync(STYLES).filter((name) => name.endsWith(".css") && name !== "app.css");

	it("is declared in fields.css alone", () => {
		const fields = sheet("fields.css");
		for (const selector of [
			".atelic-ui .field label",
			".atelic-ui .address-search .address-search-label",
			".atelic-ui .multi-select .multi-select-label",
			".atelic-ui .field-hint",
		]) {
			expect(fields).toContain(selector);
		}
		for (const name of layered.filter((name) => name !== "fields.css")) {
			expect(sheet(name), name).not.toMatch(
				/var\(--field-label-font|\.atelic-ui \.field-hint|-label small \{/,
			);
		}
	});

	it("reaches every sheet that draws a labeled field, components.css alone included", () => {
		for (const name of ["sections.css", "primitives.css", "components.css"]) {
			expect(
				sheet(name).startsWith('@import "./defaults.css";\n@import "./fields.css";'),
				name,
			).toBe(true);
		}
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
