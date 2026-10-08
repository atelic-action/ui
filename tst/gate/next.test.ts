// @vitest-environment node
import { safeNext } from "../../src/gate/next";

describe("safeNext", () => {
	it.each(["/", "/writeup", "/report?k=abc", "/proto/services#top"])(
		"keeps the path %s",
		(path) => {
			expect(safeNext(path)).toBe(path);
		},
	);

	it.each([
		["a protocol relative host", "//evil.example"],
		["a backslash host", "/\\evil.example"],
		["a backslash later in the path", "/writeup\\..\\evil"],
		["a tab a browser would drop", "/\t/evil.example"],
		["a newline a browser would drop", "/\n/evil.example"],
		["a character a Location header cannot carry", "/\u65e5\u672c"],
		["a line separator", "/x\u2028"],
		["a space", "/write up"],
		["an absolute URL", "https://evil.example"],
		["a bare word", "writeup"],
		["an empty string", ""],
		["a missing value", undefined],
		["a value that is not a string", { href: "/writeup" }],
	])("sends %s to the root", (_name, value) => {
		expect(safeNext(value)).toBe("/");
	});
});
