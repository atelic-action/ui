import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/*
 * Google's phone number library checks a site's config at build time and
 * never ships in a page. This walks every file a page can bundle, from the
 * package's browser entries through their relative imports, and fails if
 * any of them imports the library or reaches the file that does.
 */

const ROOT = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
	exports: Record<string, string | { default: string }>;
};

/** An entry's source file: the file itself, or for a built entry the source it is built from. */
const sourceOf = (target: string) =>
	resolve(ROOT, target.replace(/^\.\/dist\//, "./src/").replace(/\.js$/, ".ts"));

const entries = Object.entries(pkg.exports)
	.map(([name, target]) => [name, typeof target === "string" ? target : target.default] as const)
	.filter(([, target]) => /\.(tsx?|js)$/.test(target));

/** Every entry but the contacts check: the page entries, and the built ones a site runs or tests. */
const browserEntries = entries
	.filter(([name]) => name !== "./scripts/contacts")
	.map(([, target]) => sourceOf(target))
	.filter((file) => existsSync(file));

/** `import ... from "x"`, `export ... from "x"`, a bare `import "x"`, and `import("x")`. */
const IMPORT = /(?:import|export)[^"'`;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;

function resolveImport(from: string, spec: string): string | null {
	const base = resolve(dirname(from), spec);
	// A built file's relative imports carry .js and name the .ts beside them.
	const source = base.replace(/\.js$/, ".ts");
	for (const candidate of [
		source,
		base,
		`${base}.ts`,
		`${base}.tsx`,
		join(base, "index.ts"),
		join(base, "index.tsx"),
	]) {
		if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
	}
	return null;
}

/** Every source file reachable from `entries`, and the bare packages each imports. */
function reach(entries: string[]) {
	const seen = new Set<string>();
	const packages = new Map<string, string>();
	const queue = [...entries];
	while (queue.length) {
		const file = queue.pop() as string;
		if (seen.has(file)) continue;
		seen.add(file);
		for (const match of readFileSync(file, "utf8").matchAll(IMPORT)) {
			const spec = match[1] ?? match[2] ?? "";
			if (spec.startsWith(".")) {
				const next = resolveImport(file, spec);
				if (next) queue.push(next);
			} else packages.set(spec, relative(ROOT, file));
		}
	}
	return { files: seen, packages };
}

describe("Google's phone number library", () => {
	it("is reached by nothing a page bundles", () => {
		expect(browserEntries.length).toBeGreaterThan(10);
		const { files, packages } = reach(browserEntries);
		const offenders = [...packages].filter(([spec]) => spec.startsWith("libphonenumber-js"));
		expect(offenders).toEqual([]);
		expect([...files].map((file) => relative(ROOT, file))).not.toContain(
			"src/scripts/check-contacts.ts",
		);
	});

	it("is reached by the built contacts entry alone, which the walk follows from dist to its source", () => {
		const contacts = entries.find(([name]) => name === "./scripts/contacts");
		expect(contacts?.[1]).toBe("./dist/scripts/check-contacts.js");
		const { packages } = reach([sourceOf(contacts?.[1] ?? "")]);
		expect([...packages.keys()]).toContain("libphonenumber-js/max");
		expect(browserEntries).toContain(join(ROOT, "src/artifact/readers.ts"));
	});

	it("is reached by the build step that checks the config, so the walk would see it", () => {
		const { packages } = reach([join(ROOT, "src/scripts/check-base-path.ts")]);
		expect([...packages.keys()]).toContain("libphonenumber-js/max");
	});
});
