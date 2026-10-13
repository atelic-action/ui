/**
 * Strips `#fragment` and trailing slash duplicates out of the built
 * dist/client/sitemap.xml. A step of a marketing site's `bun run build`, after
 * vite writes the sitemap; the logic and its reasoning live in
 * src/lib/sitemap.ts. A site with a base path ships no sitemap
 * (`marketingConfig` turns it off), so there is nothing to clean.
 *
 * Usage: atelic-clean-sitemap   (from the site's root)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { dedupeSitemap } from "../lib/sitemap";

/** Where the build writes the sitemap, from the site's root. */
export const SITEMAP = "dist/client/sitemap.xml";

/** The command: cleans the sitemap of the build in `cwd`, if it built one. */
export function main(cwd: string = process.cwd()): void {
	const path = resolve(cwd, SITEMAP);
	if (!existsSync(path)) {
		console.log(`[sitemap] ${SITEMAP} not built (base path set), nothing to clean`);
		return;
	}
	const { xml, removed } = dedupeSitemap(readFileSync(path, "utf8"));
	writeFileSync(path, xml);
	console.log(`[sitemap] ${SITEMAP} (${removed} duplicate URL${removed === 1 ? "" : "s"} removed)`);
}
