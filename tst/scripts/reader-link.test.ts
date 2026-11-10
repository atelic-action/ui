// @vitest-environment node
import { verifyToken } from "../../src/gate/tokens";
import { GET } from "../../src/gate/verify";
import { LONGEST_DAYS, parseReaderArgs, sendLink } from "../../src/scripts/reader-link";

const SECRET = "a-test-secret-long-enough-to-sign-with";
const HOST = { url: "https://summit.atelic.me", secret: SECRET, allowlist: "example.com" };

/**
 * The reader command's line: an email, an optional page, and a window. A
 * line that names no reader is a usage error, which the command prints and
 * exits on.
 */
describe("parseReaderArgs", () => {
	it("takes an email alone and sends the reader to the read for two weeks", () => {
		expect(parseReaderArgs(["Reader@Example.com"])).toEqual({
			email: "reader@example.com",
			path: "/the-read",
			days: 14,
		});
	});

	it("reads a page however it is written, and keeps its query", () => {
		for (const page of ["report", "/report", "/report/", "//report//"]) {
			expect(parseReaderArgs(["reader@example.com", page])?.path).toBe("/report");
		}
		expect(parseReaderArgs(["reader@example.com", "/the-read?tab=plan"])?.path).toBe(
			"/the-read?tab=plan",
		);
	});

	it("takes a window wherever it sits on the line, held to a month", () => {
		expect(parseReaderArgs(["--days", "3", "reader@example.com"])?.days).toBe(3);
		expect(parseReaderArgs(["reader@example.com", "/notes", "--days", "90"])).toMatchObject({
			path: "/notes",
			days: LONGEST_DAYS,
		});
	});

	it("refuses a line with no address, a window that is no number, or a stray word", () => {
		expect(parseReaderArgs([])).toBeUndefined();
		expect(parseReaderArgs(["reader"])).toBeUndefined();
		expect(parseReaderArgs(["reader@example.com", "--days"])).toBeUndefined();
		expect(parseReaderArgs(["reader@example.com", "--days", "soon"])).toBeUndefined();
		expect(parseReaderArgs(["reader@example.com", "--days", "0"])).toBeUndefined();
		expect(parseReaderArgs(["reader@example.com", "/report", "extra"])).toBeUndefined();
	});

	it("refuses a page the sign in would not land on as written", () => {
		expect(parseReaderArgs(["reader@example.com", "/the read"])).toBeUndefined();
	});
});

describe("sendLink", () => {
	const reader = { email: "owner@example.com", path: "/the-read?tab=plan", days: 14 };

	it("signs a link token for the reader, landing on the page, inside the window", async () => {
		const now = Date.parse("2026-11-10T12:00:00Z");
		const link = new URL(await sendLink(reader, HOST, now));
		expect(link.origin + link.pathname).toBe("https://summit.atelic.me/api/auth/verify");
		const claims = await verifyToken(link.searchParams.get("token"), SECRET);
		expect(claims).toMatchObject({ e: "owner@example.com", p: "link", n: "/the-read?tab=plan" });
		expect(claims?.x).toBe(now / 1000 + 14 * 24 * 60 * 60);
	});

	it("refuses an address the wall would not admit, and a host with no secret", async () => {
		await expect(sendLink({ ...reader, email: "a@example.org" }, HOST)).rejects.toThrow(
			"is not on GATE_ALLOWLIST",
		);
		await expect(sendLink(reader, { ...HOST, secret: undefined })).rejects.toThrow(
			"no GATE_SESSION_SECRET",
		);
	});

	it("signs the reader in on every open, since a mail client opens it first", async () => {
		vi.stubEnv("GATE_SESSION_SECRET", SECRET);
		vi.stubEnv("GATE_ALLOWLIST", HOST.allowlist);
		try {
			const link = await sendLink(reader, HOST);
			for (let open = 0; open < 3; open++) {
				const response = await GET(new Request(link));
				expect(response.headers.get("location")).toBe("/the-read?tab=plan");
			}
		} finally {
			vi.unstubAllEnvs();
		}
	});
});
