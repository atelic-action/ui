/**
 * Sitemap cleanup, run after the build writes sitemap.xml.
 *
 * The prerender crawler adds every internal link it follows to the page list,
 * so an in page link like `/services#dry-needling` lands in the sitemap as its
 * own URL, and an index route like `/blog/` lands beside the `/blog` the nav
 * links to. Google ignores fragments, and every page declares its canonical
 * without the trailing slash, so each one is a duplicate of a page already
 * listed. This strips the fragment and the trailing slash from every `<loc>`
 * and keeps the first entry per resulting URL, so a page reached only through
 * a section link or its slashed form still stays listed. The root keeps its
 * slash.
 */

const URL_BLOCK = /[ \t]*<url>[\s\S]*?<\/url>\s*/g;
const LOC = /<loc>([^<]*)<\/loc>/;
const TRAILING_SLASH = /^(\w+:\/\/[^/]+\/.*?[^/])\/+$/;

export function dedupeSitemap(xml: string): { xml: string; removed: number } {
	const seen = new Set<string>();
	let removed = 0;
	const cleaned = xml.replace(URL_BLOCK, (block) => {
		const match = block.match(LOC);
		if (!match) return block;
		const loc = match[1].split("#")[0].replace(TRAILING_SLASH, "$1");
		if (seen.has(loc)) {
			removed++;
			return "";
		}
		seen.add(loc);
		return block.replace(LOC, () => `<loc>${loc}</loc>`);
	});
	return { xml: cleaned, removed };
}
