// @vitest-environment node
import { isAllowed, positive } from "../../src/gate/config";

describe("isAllowed", () => {
	it("matches an address whatever its case or padding, on either side", () => {
		expect(isAllowed(" Sharon@Example.com ", "owner@example.com, sharon@example.COM")).toBe(true);
	});

	it("admits every address on a domain written as @example.com, and nothing on another", () => {
		expect(isAllowed("anyone@widget.example", "owner@example.com, @widget.example")).toBe(true);
		expect(isAllowed("Owner@Widget.Example", "@widget.example")).toBe(true);
		expect(isAllowed("anyone@notwidget.example", "@widget.example")).toBe(false);
		expect(isAllowed("anyone@sub.widget.example", "@widget.example")).toBe(false);
		expect(isAllowed("widget.example", "@widget.example")).toBe(false);
		expect(isAllowed("anyone@example.com", "@")).toBe(false);
	});

	it("admits every address on a bare domain the same way, and nothing on another", () => {
		expect(isAllowed("anyone@widget.example", "owner@example.com, widget.example")).toBe(true);
		expect(isAllowed("Owner@Widget.Example", " WIDGET.example ")).toBe(true);
		expect(isAllowed("anyone@notwidget.example", "widget.example")).toBe(false);
		expect(isAllowed("anyone@sub.widget.example", "widget.example")).toBe(false);
		expect(isAllowed("anyone@example.com", "widget.example")).toBe(false);
	});

	it("still matches a full address entry exactly, beside a domain entry", () => {
		expect(isAllowed("owner@example.com", "widget.example, owner@example.com")).toBe(true);
		expect(isAllowed("other@example.com", "widget.example, owner@example.com")).toBe(false);
	});

	it.each([
		["a word with no dot", "widget"],
		["an at and a word with no dot", "@widget"],
		["a bare at", "@"],
		["an empty entry", " , ,"],
		["a lone dot", "."],
		["a leading dot", ".widget.example"],
		["a trailing dot", "widget.example."],
	])("lets %s match nothing", (_name, list) => {
		expect(isAllowed("anyone@widget", list)).toBe(false);
		expect(isAllowed("anyone@widget.example", list)).toBe(false);
		expect(isAllowed("anyone@.", list)).toBe(false);
	});

	it.each([
		"attacker@evil.example,x@widget.example",
		"attacker@evil.example;x@widget.example",
		"a@b@widget.example",
		"@widget.example",
		"a b@widget.example",
		"<a@evil.example>x@widget.example",
		'"a@evil.example"@widget.example',
	])("never lets a crafted address %j ride a domain entry", (email) => {
		expect(isAllowed(email, "@widget.example")).toBe(false);
		expect(isAllowed(email, "widget.example")).toBe(false);
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
		expect(positive("30", 7, 365)).toBe(30);
		expect(positive("0.5", 7, 365)).toBe(0.5);
	});

	it.each([undefined, "", "0", "-3", "Infinity", "NaN", "soon"])("falls back for %j", (value) => {
		expect(positive(value, 7, 365)).toBe(7);
	});

	it.each(["366", "1e300", "1e308"])("holds %j to the ceiling", (value) => {
		expect(positive(value, 7, 365)).toBe(365);
	});
});
