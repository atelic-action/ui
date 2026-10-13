// @vitest-environment node

import { createMiddleware } from "../../src/gate/middleware";
import { createNeedsSession, needsSession, OPEN_PATHS } from "../../src/gate/wall";

const SECRET = "a-test-secret-long-enough-to-sign-with";
const ORIGIN = "https://summit.example.com";

/** The matcher the README recommends for a marketing site: everything but api/ and the login page. */
const SIMPLE_MATCHER = /^\/((?!api\/|login$|login\/).*)$/;

/**
 * A marketing site's wall holds by allowlist: its matcher sends every page
 * and file but the functions and the login page to the middleware, and the
 * middleware lets one through with no session only when the wall's open
 * lists name it. The old matcher let anything with a file extension through,
 * so a page whose last segment carried a dot escaped it.
 */
describe("the wall held by allowlist", () => {
	afterEach(() => {
		delete process.env.GATE_SESSION_SECRET;
		delete process.env.GATE_ALLOWLIST;
	});

	it("the simple matcher sends pages and files to the middleware, and leaves api/ and login out", () => {
		for (const path of ["/", "/blog/release-2.0", "/about/index.html", "/images/x.jpg"]) {
			expect(SIMPLE_MATCHER.test(path)).toBe(true);
		}
		for (const path of ["/api/contact", "/api/auth/verify", "/login", "/login/"]) {
			expect(SIMPLE_MATCHER.test(path)).toBe(false);
		}
	});

	it("holds a page whose last segment carries a dot, and a page asked for by its file name", () => {
		for (const path of [
			"/blog/release-2.0",
			"/about/index.html",
			"/sitemap.xml",
			"/images/a.jpg",
		]) {
			expect(needsSession(path)).toBe(true);
		}
	});

	it("opens what a marketing login page loads", () => {
		for (const path of ["/assets/index-1.js", "/assets/base-1.css", "/fonts/a.woff2"]) {
			expect(needsSession(path)).toBe(false);
		}
		expect(needsSession("/favicon.svg")).toBe(false);
		expect(OPEN_PATHS.prefixes).toContain("/assets/");
		expect(OPEN_PATHS.exact).toContain("/favicon.svg");
	});

	it("adds a site's own open paths, and still holds the held corner", () => {
		const judge = createNeedsSession({ exact: ["/apple-touch-icon.png"], prefixes: ["/icons/"] });
		expect(judge("/apple-touch-icon.png")).toBe(false);
		expect(judge("/icons/192.png")).toBe(false);
		expect(judge("/icons/../images/a.jpg")).toBe(true);
		expect(judge("/assets/doc/private-1.js")).toBe(true);
		expect(judge("/blog/release-2.0")).toBe(true);
		expect(createNeedsSession()).toBe(needsSession);
	});

	it("refuses an opening that would unlock the host or is not a plain path", () => {
		expect(() => createNeedsSession({ prefixes: ["/"] })).toThrow(/never "\/" alone/);
		expect(() => createNeedsSession({ prefixes: ["/icons"] })).toThrow(/folder/);
		expect(() => createNeedsSession({ exact: ["icon.png"] })).toThrow(/plain path/);
		expect(() => createNeedsSession({ exact: ["/a/../b"] })).toThrow(/plain path/);
	});

	it("the middleware takes the openings, and a needsSession of the site's own wins", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		process.env.GATE_ALLOWLIST = "owner@example.com";
		const request = (path: string) => new Request(`${ORIGIN}${path}`);

		const opened = createMiddleware({ open: { exact: ["/apple-touch-icon.png"] } });
		expect(await opened(request("/apple-touch-icon.png"))).toBeUndefined();
		expect((await opened(request("/blog/release-2.0")))?.status).toBe(302);

		const own = createMiddleware({ needsSession: () => false, open: { prefixes: ["/x/"] } });
		expect(await own(request("/blog/release-2.0"))).toBeUndefined();
	});
});
