// @vitest-environment node
import { signToken, verifyToken } from "../../src/gate/tokens";

const SECRET = "a-test-secret-long-enough-to-sign-with";
const soon = () => Math.floor(Date.now() / 1000) + 600;

/** Base64url of a JSON value, the way a compact token carries it. */
const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

describe("gate tokens", () => {
	it("round trips a link token with its next path", async () => {
		const x = soon();
		const token = await signToken({ e: "sharon@example.com", x, p: "link", n: "/writeup" }, SECRET);
		expect(await verifyToken(token, SECRET)).toEqual({
			e: "sharon@example.com",
			x,
			p: "link",
			n: "/writeup",
		});
	});

	it("round trips a session token, which carries no next path", async () => {
		const x = soon();
		const token = await signToken({ e: "sharon@example.com", x, p: "session" }, SECRET);
		expect(await verifyToken(token, SECRET)).toEqual({ e: "sharon@example.com", x, p: "session" });
	});

	it("signs a compact HS256 token", async () => {
		const token = await signToken({ e: "sharon@example.com", x: soon(), p: "session" }, SECRET);
		const [header] = token.split(".");
		expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "HS256" });
		expect(token.split(".")).toHaveLength(3);
	});

	it("refuses a token another secret signed", async () => {
		const token = await signToken({ e: "sharon@example.com", x: soon(), p: "session" }, SECRET);
		expect(await verifyToken(token, `${SECRET}-other`)).toBeNull();
	});

	it("refuses an expired token", async () => {
		const token = await signToken(
			{ e: "sharon@example.com", x: Math.floor(Date.now() / 1000) - 60, p: "session" },
			SECRET,
		);
		expect(await verifyToken(token, SECRET)).toBeNull();
	});

	it("refuses a token whose payload was changed after signing", async () => {
		const token = await signToken({ e: "sharon@example.com", x: soon(), p: "link" }, SECRET);
		const [header, , signature] = token.split(".");
		const forged = part({ sub: "sharon@example.com", exp: soon(), p: "session" });
		expect(await verifyToken(`${header}.${forged}.${signature}`, SECRET)).toBeNull();
	});

	it("refuses an unsigned token that names no algorithm", async () => {
		const unsigned = `${part({ alg: "none" })}.${part({ sub: "sharon@example.com", exp: soon(), p: "session" })}.`;
		expect(await verifyToken(unsigned, SECRET)).toBeNull();
	});

	it("refuses a signed token with no purpose, or one it does not know", async () => {
		const { SignJWT } = await import("jose");
		const key = new TextEncoder().encode(SECRET);
		const mint = (body: Record<string, unknown>) =>
			new SignJWT(body)
				.setProtectedHeader({ alg: "HS256" })
				.setSubject("sharon@example.com")
				.setExpirationTime(soon())
				.sign(key);
		expect(await verifyToken(await mint({}), SECRET)).toBeNull();
		expect(await verifyToken(await mint({ p: "admin" }), SECRET)).toBeNull();
	});

	it.each([undefined, null, "", "nope", "a.b", "a.b.c"])("refuses %j", async (token) => {
		expect(await verifyToken(token, SECRET)).toBeNull();
	});

	it("refuses everything when the secret is empty", async () => {
		const token = await signToken({ e: "sharon@example.com", x: soon(), p: "session" }, SECRET);
		expect(await verifyToken(token, "")).toBeNull();
	});

	it("signs with a short secret too, since a host may already hold one", async () => {
		const token = await signToken({ e: "sharon@example.com", x: soon(), p: "session" }, "short");
		expect((await verifyToken(token, "short"))?.e).toBe("sharon@example.com");
	});
});
