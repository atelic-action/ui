import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * A footer link's hover can be marked by a line as well as by its color, for
 * a theme whose links are already the hover's color: the column links and
 * the contact lines read --footer-link-hover-decoration, which defaults to
 * none, so an unchanged site's hover is its color alone, as before. The
 * browser's own :hover is not something a story's synthetic pointer
 * reaches, so the rule is read from the sheet.
 */
const STYLES = join(import.meta.dirname, "..", "src", "styles");
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

describe("the footer link's hover decoration", () => {
	it("defaults to none, declared once in the defaults", () => {
		expect(sheet("defaults.css")).toMatch(/--footer-link-hover-decoration: none;/);
	});

	it("reaches the column links and the contact lines on hover, and not the rating link", () => {
		const chrome = sheet("chrome.css");
		const rule = chrome.match(/\.atelic-ui \.footer :is\(nav, \.nap\) a:hover \{([^}]*)\}/);
		expect(rule?.[1]).toMatch(/text-decoration-line: var\(--footer-link-hover-decoration\);/);
	});
});
