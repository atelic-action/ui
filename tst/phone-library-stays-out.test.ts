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

/** The entries a page imports: the ones pointing at source, outside the commands. */
const browserEntries = Object.entries(pkg.exports)
	.map(([name, target]) => [name, typeof target === "string" ? target : target.default] as const)
	.filter(([name, target]) => /\.tsx?$/.test(target) && !name.startsWith("./scripts"))
	.map(([, target]) => resolve(ROOT, target));

/** `import ... from "x"`, `export ... from "x"`, a bare `import "x"`, and `import("x")`. */
const IMPORT = /(?:import|export)[^"'`;]*?from\s*["']([^"']+)["']|import\s*\(?\s*["']([^"']+)["']/g;

function resolveImport(from: string, spec: string): string | null {
	const base = resolve(dirname(from), spec);
	for (const candidate of [
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

	it("is reached by the build step that checks the config, so the walk would see it", () => {
		const { packages } = reach([join(ROOT, "src/scripts/check-base-path.ts")]);
		expect([...packages.keys()]).toContain("libphonenumber-js/max");
	});
});
