import { describe, expect, it } from "vitest";
import { dedupeSitemap } from "../../src/lib/sitemap";

const entry = (loc: string) =>
	`  <url>\n    <loc>${loc}</loc>\n    <lastmod>2026-09-24</lastmod>\n  </url>\n`;
const sitemap = (...locs: string[]) =>
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.map(entry).join("")}</urlset>\n`;
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

describe("dedupeSitemap", () => {
	it("drops fragment URLs that duplicate a listed page", () => {
		const { xml, removed } = dedupeSitemap(
			sitemap("https://x.com/", "https://x.com/services", "https://x.com/services#dry-needling"),
		);
		expect(locs(xml)).toEqual(["https://x.com/", "https://x.com/services"]);
		expect(removed).toBe(1);
	});

	it("keeps a page reached only through a section link, without its fragment", () => {
		const { xml, removed } = dedupeSitemap(
			sitemap("https://x.com/", "https://x.com/cost#pricing", "https://x.com/cost#faq"),
		);
		expect(locs(xml)).toEqual(["https://x.com/", "https://x.com/cost"]);
		expect(removed).toBe(1);
	});

	it("drops the trailing slash form of a listed page, whichever comes first", () => {
		const { xml, removed } = dedupeSitemap(
			sitemap(
				"https://x.com/",
				"https://x.com/blog/",
				"https://x.com/blog",
				"https://x.com/blog/a",
			),
		);
		expect(locs(xml)).toEqual(["https://x.com/", "https://x.com/blog", "https://x.com/blog/a"]);
		expect(removed).toBe(1);
	});

	it("keeps the slash on the root", () => {
		const input = sitemap("https://x.com/", "https://x.com/about");
		expect(locs(dedupeSitemap(input).xml)).toContain("https://x.com/");
	});

	it("leaves a sitemap with no duplicates untouched", () => {
		const input = sitemap("https://x.com/", "https://x.com/about");
		expect(dedupeSitemap(input)).toEqual({ xml: input, removed: 0 });
	});

	it("keeps the document well formed", () => {
		const { xml } = dedupeSitemap(sitemap("https://x.com/a", "https://x.com/a#b"));
		expect(xml.startsWith("<?xml")).toBe(true);
		expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
		expect(xml.match(/<url>/g)).toHaveLength(1);
	});
});
