import { describe, expect, it } from "vitest";
import { matchesSearch } from "../../src/app/lib/search";

describe("matchesSearch", () => {
	it("returns true when a string field matches", () => {
		expect(matchesSearch("hello", ["Hello World", "other"])).toBe(true);
	});

	it("returns false when no fields match", () => {
		expect(matchesSearch("xyz", ["Hello", "World"])).toBe(false);
	});

	it("is case insensitive", () => {
		expect(matchesSearch("HELLO", ["hello world"])).toBe(true);
	});

	it("handles null and undefined fields", () => {
		expect(matchesSearch("test", [null, undefined, "testing"])).toBe(true);
		expect(matchesSearch("test", [null, undefined])).toBe(false);
	});

	it("matches within string array fields", () => {
		expect(matchesSearch("vegan", [["Vegan", "Healthy"]])).toBe(true);
		expect(matchesSearch("meat", [["Vegan", "Healthy"]])).toBe(false);
	});

	it("handles mixed string and array fields", () => {
		expect(matchesSearch("tag", ["no match", ["Some Tag"]])).toBe(true);
	});

	it("returns false for empty query against valid fields", () => {
		expect(matchesSearch("", ["anything"])).toBe(true);
	});

	it("returns false for empty fields array", () => {
		expect(matchesSearch("test", [])).toBe(false);
	});
});
