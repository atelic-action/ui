// @vitest-environment node
import { parseReaderArgs } from "../../src/scripts/reader-link";

/**
 * The reader command's line: an email, an optional page, and three flags.
 * A line that names no reader is a usage error, which the command prints
 * and exits on.
 */
describe("parseReaderArgs", () => {
	it("takes an email alone and sends the reader to the writeup", () => {
		expect(parseReaderArgs(["reader@example.com"])).toEqual({
			email: "reader@example.com",
			path: "/writeup",
			token: undefined,
			forceQr: false,
			noQr: false,
		});
	});

	it("reads a page however it is written", () => {
		for (const page of ["report", "/report", "/report/", "//report//"]) {
			expect(parseReaderArgs(["reader@example.com", page])?.path).toBe("/report");
		}
	});

	it("takes an existing token wherever it sits on the line", () => {
		expect(parseReaderArgs(["reader@example.com", "--token", "abc"])?.token).toBe("abc");
		const first = parseReaderArgs(["--token", "abc", "reader@example.com", "/report"]);
		expect(first).toMatchObject({ email: "reader@example.com", path: "/report", token: "abc" });
	});

	it("reads the two QR flags and keeps them out of the page", () => {
		const forced = parseReaderArgs(["--qr", "reader@example.com"]);
		expect(forced).toMatchObject({ forceQr: true, noQr: false, path: "/writeup" });
		const never = parseReaderArgs(["reader@example.com", "--no-qr"]);
		expect(never).toMatchObject({ forceQr: false, noQr: true, path: "/writeup" });
	});

	it("refuses a line with no email, one that is not an address, or a token flag with no token", () => {
		expect(parseReaderArgs([])).toBeUndefined();
		expect(parseReaderArgs(["reader"])).toBeUndefined();
		expect(parseReaderArgs(["--qr"])).toBeUndefined();
		expect(parseReaderArgs(["reader@example.com", "--token"])).toBeUndefined();
	});
});
