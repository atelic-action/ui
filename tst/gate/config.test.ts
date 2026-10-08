// @vitest-environment node
import { isAllowed, positive } from "../../src/gate/config";

describe("isAllowed", () => {
	it("matches an address whatever its case or padding, on either side", () => {
		expect(isAllowed(" Sharon@Example.com ", "owner@example.com, sharon@example.COM")).toBe(true);
	});

	it.each([
		["a stranger", "stranger@example.com", "sharon@example.com"],
		["an empty address", "", "sharon@example.com,,"],
		["an empty list", "sharon@example.com", ""],
		["no list", "sharon@example.com", undefined],
		["a partial match", "sharon@example.co", "sharon@example.com"],
	])("refuses %s", (_name, email, list) => {
		expect(isAllowed(email, list)).toBe(false);
	});
});

describe("positive", () => {
	it("keeps a positive number", () => {
		expect(positive("30", 7)).toBe(30);
		expect(positive("0.5", 7)).toBe(0.5);
	});

	it.each([undefined, "", "0", "-3", "Infinity", "NaN", "soon"])("falls back for %j", (value) => {
		expect(positive(value, 7)).toBe(7);
	});
});
