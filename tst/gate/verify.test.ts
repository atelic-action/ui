// @vitest-environment node

import { signToken } from "../../src/gate/tokens";
import { GET } from "../../src/gate/verify";

const SECRET = "a-test-secret-long-enough-to-sign-with";

function verifyRequest(token: string): Request {
	return new Request(`http://localhost/api/auth/verify?token=${encodeURIComponent(token)}`, {
		method: "GET",
	});
}

function setCookieHeader(response: Response): string {
	const getter = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
	if (typeof getter === "function") return getter.call(response.headers).join("\n");
	return response.headers.get("set-cookie") ?? "";
}

describe("GET /api/auth/verify", () => {
	beforeEach(() => {
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
	});
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("starts a session and redirects to next for a valid link token", async () => {
		const token = await signToken(
			{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "link", n: "/about" },
			SECRET,
		);
		const response = await GET(verifyRequest(token));
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/about");

		const cookies = setCookieHeader(response);
		expect(cookies).toContain("gate_session=");
		expect(cookies).toContain("HttpOnly");
		expect(cookies).toContain("gate_email=sharon%40example.com");
	});

	it.each(["//evil.example", "/\\evil.example", "/\t/evil.example", "/日本"])(
		"starts the session but lands on the root when next is %j",
		async (next) => {
			const token = await signToken(
				{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "link", n: next },
				SECRET,
			);
			const response = await GET(verifyRequest(token));
			expect(response.status).toBe(302);
			expect(response.headers.get("location")).toBe("/");
			expect(setCookieHeader(response)).toContain("gate_session=");
		},
	);

	it("redirects expired links back to login", async () => {
		const token = await signToken(
			{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) - 10, p: "link", n: "/" },
			SECRET,
		);
		const response = await GET(verifyRequest(token));
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/login?e=expired");
		expect(setCookieHeader(response)).toBe("");
	});

	it("refuses a session token replayed as a link", async () => {
		const token = await signToken(
			{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "session" },
			SECRET,
		);
		const response = await GET(verifyRequest(token));
		expect(response.headers.get("location")).toBe("/login?e=expired");
	});

	it("refuses a token signed with the wrong secret", async () => {
		const token = await signToken(
			{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) + 600, p: "link", n: "/" },
			"a-different-secret",
		);
		const response = await GET(verifyRequest(token));
		expect(response.headers.get("location")).toBe("/login?e=expired");
	});
});
