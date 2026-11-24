import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * The long word rule (defaults.css, Long words) is declared once, in the
 * sheet every layered sheet imports first, so a consumer loading any one
 * sheet alone still breaks a long word rather than scrolling a phone
 * sideways. A copy on the root anywhere else is a second statement that
 * drifts, and a sheet without one was the bug this replaced.
 */

const STYLES = join(import.meta.dirname, "..", "src", "styles");
// The theme sheet is left out with app.css: it holds the practice's tokens
// and no rule a long word meets, in its own layer (README.md, Theme).
const layered = readdirSync(STYLES).filter(
	(name) => name.endsWith(".css") && !["app.css", "defaults.css", "theme.css"].includes(name),
);
const sheet = (name: string) => readFileSync(join(STYLES, name), "utf8");

describe("the long word rule", () => {
	it("is declared on the root and kept off tables, both weighing nothing, in defaults.css", () => {
		const defaults = sheet("defaults.css");
		expect(defaults).toMatch(/:where\(\.atelic-ui\) \{\s*overflow-wrap: anywhere;\s*\}/);
		expect(defaults).toMatch(/:where\(\.atelic-ui table\) \{\s*overflow-wrap: break-word;\s*\}/);
	});

	it("reaches every layered sheet, each of which imports defaults.css first", () => {
		for (const name of layered.filter((name) => name !== "star-rating.css")) {
			expect(sheet(name).startsWith('@import "./defaults.css";'), name).toBe(true);
		}
		// The star rating's sheet is imported by components.css, never alone.
		expect(sheet("components.css")).toMatch(/@import "\.\/star-rating\.css";/);
	});

	it("is not restated on the root or on bare tables in any other sheet", () => {
		for (const name of layered) {
			const css = sheet(name);
			expect(css, name).not.toMatch(/\.atelic-ui \{[^}]*overflow-wrap/);
			expect(css, name).not.toMatch(/\.atelic-ui table \{[^}]*overflow-wrap/);
		}
	});
});
