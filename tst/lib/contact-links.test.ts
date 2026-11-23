import { isPhoneNumber } from "../../src/lib/contactForm";
import {
	dialable,
	EMAIL_PATTERN,
	isE164,
	isEmail,
	keypadDigits,
	toE164,
} from "../../src/lib/contactLinks";

describe("toE164", () => {
	it.each([
		["(555) 555-0142", "+15555550142"],
		["555-555-0142", "+15555550142"],
		["555.555.0142", "+15555550142"],
		["555 555 0142", "+15555550142"],
		["5555550142", "+15555550142"],
		["1-555-555-0142", "+15555550142"],
		["1 (555) 555-0142", "+15555550142"],
		["+1 555 555 0142", "+15555550142"],
		["+15555550142", "+15555550142"],
		["+44 20 7946 0000", "+442079460000"],
		["  (555) 555-0142  ", "+15555550142"],
		["(555) 555-0142 x12", "+15555550142"],
		["(555) 555-0142 ext. 12", "+15555550142"],
		["555-555-0142, 3", "+15555550142"],
	])("reads %j as %s", (value, expected) => {
		expect(toE164(value)).toBe(expected);
	});

	it.each([
		[""],
		["   "],
		["555-0142"],
		["055-555-0142"],
		["155-555-0142"],
		["2-555-555-0142"],
		["call us"],
		["555-CAKE"],
		["+1 555"],
		["+0 555 555 0142"],
		["+1234567890123456"],
		["555+555-0142"],
	])("refuses %j", (value) => {
		expect(toE164(value)).toBeNull();
	});
});

describe("keypadDigits and dialable", () => {
	it.each([
		["1-800-FLOWERS", "18003569377"],
		["1-800-flowers", "18003569377"],
		["1 800 FLOWERS", "18003569377"],
		["1-800-GO-FEDEX", "18004633339"],
		["Call (303) 555-0142", "3035550142"],
		["303-555-0142 (cell)", "3035550142"],
		["(303) 555-0142 x12", "3035550142"],
		["+44 20 7946 0000", "+442079460000"],
	])("dials %j as %s", (value, expected) => {
		expect(dialable(value)).toBe(expected);
	});

	it("dials nothing from words alone", () => {
		expect(dialable("call us")).toBeNull();
		expect(keypadDigits("CALL US")).toBe("");
	});
});

describe("isE164", () => {
	it("takes a + and 8 to 15 digits, never opening on 0, and nothing else", () => {
		expect(isE164("+15555550142")).toBe(true);
		expect(isE164("+12345678")).toBe(true);
		expect(isE164("+123456789012345")).toBe(true);
		expect(isE164("+1234567")).toBe(false);
		expect(isE164("+1234567890123456")).toBe(false);
		expect(isE164("+05555550142")).toBe(false);
		expect(isE164("15555550142")).toBe(false);
		expect(isE164("+1 555 555 0142")).toBe(false);
		expect(isE164("")).toBe(false);
	});
});

describe("isEmail", () => {
	it.each([
		["hello@example.com", true],
		["  hello@example.com  ", true],
		["first.last+orders@shop.example.com", true],
		["hello@example", false],
		["hello@", false],
		["@example.com", false],
		["hello world@example.com", false],
		["", false],
	])("isEmail(%j) is %s", (value, expected) => {
		expect(isEmail(value)).toBe(expected);
	});

	it("is the pattern the form has always checked", () => {
		expect(EMAIL_PATTERN.source).toBe("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
	});
});

describe("the form and the link agree", () => {
	it.each([["(555) 555-0142"], ["+44 20 7946 0000"], ["555-0142"], [""], ["555-CAKE"]])(
		"on %j",
		(value) => {
			expect(isPhoneNumber(value)).toBe(toE164(value) !== null);
		},
	);
});
