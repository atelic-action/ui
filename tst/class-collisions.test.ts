import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Every sheet shares the one `atelic-ui` layer and the one `.atelic-ui` root,
 * so a class two components both wear is styled by both sheets' rules. That
 * is how ReportCard's `.rc-name` reached the review carousel's reviewer name
 * (2.2.0) without a test noticing. A class is led by one sheet only, unless
 * the sheet restyling it does so on purpose and is listed here.
 */
const SHARED_ON_PURPOSE: Record<string, string> = {
	// The artifact shell's print rules step the site chrome aside.
	"credit-bar": "artifact.css",
	nav: "artifact.css",
	"nav-logo": "artifact.css",
	"skip-link": "artifact.css",
};

const STYLES = join(import.meta.dirname, "..", "src", "styles");

function leadingClasses(sheet: string): Set<string> {
	const css = readFileSync(join(STYLES, sheet), "utf8");
	return new Set([...css.matchAll(/\.atelic-ui \.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
}

describe("stylesheet classes", () => {
	it("leads each class from one sheet", () => {
		const owners = new Map<string, string[]>();
		for (const sheet of readdirSync(STYLES).filter((f) => f.endsWith(".css"))) {
			for (const cls of leadingClasses(sheet)) owners.set(cls, [...(owners.get(cls) ?? []), sheet]);
		}
		const collisions = [...owners]
			.filter(([cls, sheets]) => sheets.filter((s) => s !== SHARED_ON_PURPOSE[cls]).length > 1)
			.map(([cls, sheets]) => `${cls}: ${sheets.join(", ")}`);
		expect(collisions).toEqual([]);
	});
});
