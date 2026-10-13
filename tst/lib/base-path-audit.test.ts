import { describe, expect, it } from "vitest";
import {
	cssRefs,
	expectedRewrites,
	htmlRefs,
	rewriteProblems,
	unbasedRefs,
} from "../../src/lib/basePathAudit";

const based = `<!DOCTYPE html><html><head><link rel="stylesheet" href="/proto/assets/base-1.css"/><link rel="icon" href="/proto/favicon.svg"/><script type="module" src="/proto/assets/index-1.js"></script><link rel="preconnect" href="//fonts.example.com"/></head><body><a class="skip-link" href="#main">Skip</a><a href="/proto/">Home</a><a href="/proto/faqs">FAQs</a><img src="/proto/images/map.jpg" srcset="/proto/images/map.jpg 1x, /proto/images/map@2x.jpg 2x"/><a href="https://example.com/book">Book</a><a href="mailto:hi@example.com">Email</a></body></html>`;
const leaky = based
	.replace('href="/proto/faqs"', 'href="/faqs"')
	.replace("/proto/images/map@2x.jpg", "/images/map@2x.jpg");

describe("htmlRefs", () => {
	it("collects root absolute href, src, and srcset paths and nothing else", () => {
		expect(htmlRefs(based)).toEqual([
			"/proto/assets/base-1.css",
			"/proto/favicon.svg",
			"/proto/assets/index-1.js",
			"/proto/",
			"/proto/faqs",
			"/proto/images/map.jpg",
			"/proto/images/map.jpg",
			"/proto/images/map@2x.jpg",
		]);
	});
});

describe("unbasedRefs", () => {
	it("passes a based build whose every reference carries the prefix", () => {
		expect(unbasedRefs(htmlRefs(based), "/proto")).toEqual([]);
	});

	it("names each reference that skipped withBase", () => {
		expect(unbasedRefs(htmlRefs(leaky), "/proto")).toEqual(["/faqs", "/images/map@2x.jpg"]);
	});

	it("has nothing to hold a root build to", () => {
		expect(unbasedRefs(["/faqs", "/assets/x.js"], "")).toEqual([]);
	});

	it("reads stylesheet urls, the self hosted fonts included", () => {
		const css = `@font-face{src:url(/proto/fonts/a.woff2) format("woff2")}.x{background:url("/images/b.png")}.y{background:url(data:image/svg+xml,abc)}`;
		expect(cssRefs(css)).toEqual(["/proto/fonts/a.woff2", "/images/b.png"]);
		expect(unbasedRefs(cssRefs(css), "/proto")).toEqual(["/images/b.png"]);
	});
});

describe("rewriteProblems", () => {
	const headers = [{ source: "/(.*)", headers: [] }];

	it("wants nothing of a root cut's vercel.json", () => {
		expect(expectedRewrites("")).toEqual([]);
		expect(rewriteProblems({}, "")).toEqual([]);
	});

	it("passes a based cut that carries both rewrites", () => {
		expect(rewriteProblems({ rewrites: expectedRewrites("/proto") }, "/proto")).toEqual([]);
	});

	it("fails a based cut missing either rewrite", () => {
		expect(rewriteProblems({ rewrites: [] }, "/proto")).toHaveLength(2);
		expect(rewriteProblems({ rewrites: [expectedRewrites("/proto")[0]] }, "/proto")).toHaveLength(
			1,
		);
	});

	it("fails a root cut that kept a based cut's rewrites, and a based cut on the wrong prefix", () => {
		const rewrites = expectedRewrites("/proto");
		expect(rewriteProblems({ rewrites }, "")).toHaveLength(2);
		expect(rewriteProblems({ rewrites }, "/preview")).toHaveLength(4);
	});

	it("leaves unrelated rewrites alone", () => {
		const rewrites = [
			{ source: "/old-page", destination: "/new-page" },
			{ source: "/home", destination: "/" },
		];
		expect(rewriteProblems({ rewrites, ...{ headers } }, "")).toEqual([]);
	});
});
