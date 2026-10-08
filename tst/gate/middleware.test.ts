// @vitest-environment node

import middleware, { createMiddleware } from "../../src/gate/middleware";
import { signToken } from "../../src/gate/tokens";

const SECRET = "a-test-secret-long-enough-to-sign-with";
const ORIGIN = "https://summit.atelic.me";

function request(path: string, cookie?: string): Request {
	return new Request(`${ORIGIN}${path}`, cookie ? { headers: { cookie } } : undefined);
}

/**
 * The middleware end to end, short of a deploy: dormant with no secret, and
 * once armed it sends a cookieless request for a held file to the login page
 * while the login page's own assets pass straight through.
 */
describe("the access wall middleware", () => {
	afterEach(() => {
		delete process.env.GATE_SESSION_SECRET;
	});

	it("stays dormant with no GATE_SESSION_SECRET, files included", async () => {
		expect(await middleware(request("/images/search-console.png"))).toBeUndefined();
		expect(await middleware(request("/writeup"))).toBeUndefined();
	});

	it("once armed, sends a cookieless request for a screenshot, the PDF, or a page to /login", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		for (const path of ["/images/search-console.png", "/writeup.pdf", "/writeup"]) {
			const response = await middleware(request(path));
			expect(response?.status).toBe(302);
			const location = new URL(response?.headers.get("location") ?? "");
			expect(location.pathname).toBe("/login");
			expect(location.searchParams.get("next")).toBe(path);
		}
	});

	it("once armed, lets the login page's own assets through with no cookie", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		for (const path of ["/login", "/assets/index-BXwh7LMy.js", "/fonts/Geist-Variable.woff2"]) {
			expect(await middleware(request(path))).toBeUndefined();
		}
	});

	it("once armed, lets a held file through for a valid session", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		const session = await signToken(
			{ e: "owner@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "session" },
			SECRET,
		);
		const cookie = `gate_session=${encodeURIComponent(session)}`;
		expect(await middleware(request("/images/search-console.png", cookie))).toBeUndefined();
	});
});

describe("createMiddleware", () => {
	afterEach(() => {
		delete process.env.GATE_SESSION_SECRET;
	});

	it("holds what the site's own test says, in place of the wall", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		const everything = createMiddleware({ needsSession: () => true });
		expect((await everything(request("/assets/index-BXwh7LMy.js")))?.status).toBe(302);
		const nothing = createMiddleware({ needsSession: () => false });
		expect(await nothing(request("/writeup"))).toBeUndefined();
	});

	it("sends a link token offered as a session back to /login", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		const link = await signToken(
			{ e: "owner@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "link" },
			SECRET,
		);
		const response = await middleware(
			request("/writeup", `gate_session=${encodeURIComponent(link)}`),
		);
		expect(response?.status).toBe(302);
	});

	it("sends a cookie that will not decode back to /login", async () => {
		process.env.GATE_SESSION_SECRET = SECRET;
		const response = await middleware(request("/writeup", "gate_session=%E0%A4%A"));
		expect(response?.status).toBe(302);
	});
});
