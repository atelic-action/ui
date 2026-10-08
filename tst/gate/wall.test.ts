// @vitest-environment node
import { needsSession } from "../../src/gate/wall";

/**
 * With the wall armed, everything needs a session but what the login page
 * needs to render. The open list was read off the built /login page; any
 * path not on it, a screenshot, the printed PDF, a content chunk, a page, is
 * held. The last block tries the ways a request could dress a held path up
 * as an open one.
 */
describe("needsSession", () => {
	it("holds the owner's screenshots and the printed PDF", () => {
		expect(needsSession("/images/search-console.png")).toBe(true);
		expect(needsSession("/images/ads/overview.jpg")).toBe(true);
		expect(needsSession("/writeup.pdf")).toBe(true);
		expect(needsSession("/report.pdf")).toBe(true);
	});

	it("holds every document and the chunks a document's content compiles into", () => {
		for (const path of ["/", "/writeup", "/writeup/", "/report", "/proposal", "/404.html"]) {
			expect(needsSession(path)).toBe(true);
		}
		expect(needsSession("/assets/doc/writeup-BiT53waW.js")).toBe(true);
		expect(needsSession("/assets/doc/")).toBe(true);
	});

	it("holds what the login page does not load", () => {
		expect(needsSession("/loginx")).toBe(true);
		expect(needsSession("/login.html")).toBe(true);
		expect(needsSession("/sitemap.xml")).toBe(true);
	});

	it("opens brand marks under /brand/ and holds screens under /images/, logo or not", () => {
		expect(needsSession("/brand/x.png")).toBe(false);
		expect(needsSession("/brand/summit.svg")).toBe(false);
		expect(needsSession("/images/x.png")).toBe(true);
		expect(needsSession("/images/logo.svg")).toBe(true);
		expect(needsSession("/brand/../images/x.png")).toBe(true);
		expect(needsSession("/brand/%2e%2e/images/x.png")).toBe(true);
		expect(needsSession("/branding/x.png")).toBe(true);
	});

	it("opens the login page and exactly what it loads", () => {
		for (const path of [
			"/login",
			"/login/",
			"/assets/index-BXwh7LMy.js",
			"/assets/login-Djc24E5F.js",
			"/assets/base-CI7_bW9c.css",
			"/fonts/Geist-Variable.woff2",
			"/fonts/yellowtail.woff2",
			"/favicon.svg",
			"/logo.svg",
		]) {
			expect(needsSession(path)).toBe(false);
		}
	});

	it("opens the website build proxied under /proto, and nothing dressed as it", () => {
		for (const path of [
			"/proto",
			"/proto/",
			"/proto/faqs",
			"/proto/images/hero.jpg",
			"/proto/assets/x.js",
		]) {
			expect(needsSession(path)).toBe(false);
		}
		expect(needsSession("/protox")).toBe(true);
		expect(needsSession("/prototype")).toBe(true);
		expect(needsSession("/proto/../writeup")).toBe(true);
		expect(needsSession("/proto/%2e%2e/images/x.png")).toBe(true);
	});

	it("opens the sign in functions, robots.txt, and the uptime check", () => {
		expect(needsSession("/api/auth/request-link")).toBe(false);
		expect(needsSession("/api/auth/verify")).toBe(false);
		expect(needsSession("/robots.txt")).toBe(false);
		expect(needsSession("/health.json")).toBe(false);
	});

	it("holds a held path however it is dressed up as an open one", () => {
		for (const path of [
			"/assets/%64oc/writeup-BiT53waW.js",
			"/assets//doc/writeup-BiT53waW.js",
			"/ASSETS/DOC/writeup-BiT53waW.js",
			"/assets%2Fdoc/writeup-BiT53waW.js",
			"/fonts/..%2Fimages/search-console.png",
			"/fonts/%2e%2e/images/search-console.png",
			"/api%2F..%2Fimages/search-console.png",
			"/fonts/%E0%A4%A",
		]) {
			expect(needsSession(path)).toBe(true);
		}
	});
});
