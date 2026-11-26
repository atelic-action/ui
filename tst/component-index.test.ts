import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The README's Component Index is where a reader, a person or an agent,
 * learns what each piece is for before composing, extending, or creating
 * one, so a component that is exported and has no row there is invisible
 * at the moment it matters. Every component the four component entries
 * export has its own name, in backticks, in the first column of an index row.
 */
const ROOT = join(import.meta.dirname, "..");
const ENTRIES = ["sections", "primitives", "chrome", "components"];

/** The value exports of an entry that are named as a component is: PascalCase, never a type, never a constant. */
function componentsExportedBy(entry: string): string[] {
	const source = readFileSync(join(ROOT, "src", entry, "index.ts"), "utf8");
	const names: string[] = [];
	for (const block of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
		if (block[1]) continue;
		for (const raw of block[2].split(",")) {
			const item = raw.trim();
			if (!item || item.startsWith("type ")) continue;
			const name = item.split(/\s+as\s+/).pop() ?? item;
			if (/^[A-Z][A-Za-z0-9]*$/.test(name) && /[a-z]/.test(name)) names.push(name);
		}
	}
	return names;
}

function componentIndex(): string {
	const readme = readFileSync(join(ROOT, "README.md"), "utf8");
	const start = readme.indexOf("## Component Index");
	if (start === -1) throw new Error("README has no Component Index heading");
	const next = readme.indexOf("\n## ", start + 1);
	return readme.slice(start, next === -1 ? undefined : next);
}

/** The names in backticks in the first column of the index's table rows, so a mention in another row's prose never counts. */
function indexedNames(): Set<string> {
	const names = new Set<string>();
	for (const line of componentIndex().split("\n")) {
		if (!line.startsWith("|")) continue;
		const firstCell = line.split("|")[1] ?? "";
		for (const m of firstCell.matchAll(/`([^`]+)`/g)) names.add(m[1]);
	}
	return names;
}

describe("the Component Index", () => {
	it("is where the README says it is", () => {
		expect(componentIndex()).toContain("| Export | Entry | What It Is For | Storybook |");
	});

	it.each(ENTRIES)("names every component the %s entry exports", (entry) => {
		const index = indexedNames();
		const exported = componentsExportedBy(entry);
		expect(exported.length).toBeGreaterThan(0);
		expect(exported.filter((name) => !index.has(name))).toEqual([]);
	});
});
