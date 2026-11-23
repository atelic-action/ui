import {
	addressLine,
	type ContactFormShape,
	checkContactForm,
	contactFormBody,
	firstRefused,
	isPhoneNumber,
	isZIP,
	PLAIN_SHAPE,
	readContactForm,
	telHref,
} from "../../src/lib/contactForm";

const FULL: ContactFormShape = {
	splitName: true,
	phone: "required",
	address: "optional",
	services: true,
	consent: true,
};

function data(entries: [string, string][]): FormData {
	const form = new FormData();
	for (const [key, value] of entries) form.append(key, value);
	return form;
}

const plainEntries: [string, string][] = [
	["name", " Robin Ash "],
	["email", "robin@example.com"],
	["topic", "A cake"],
	["message", " A round cake. "],
	["company", ""],
];

const fullEntries: [string, string][] = [
	["firstName", "Robin"],
	["lastName", "Ash"],
	["phone", "(555) 555-0142"],
	["email", "robin@example.com"],
	["street", "418 Alder Street"],
	["city", "Fairhaven"],
	["state", "CO"],
	["zip", "80000"],
	["services", "Wedding cakes"],
	["services", "Wholesale"],
	["message", "Two tiers."],
	["consent", "yes"],
	["company", ""],
];

describe("the plain form, as it was before 8.5.0", () => {
	it("reads, checks, and posts exactly the five keys it always did", () => {
		const values = readContactForm(data(plainEntries), PLAIN_SHAPE);
		expect(checkContactForm(values, PLAIN_SHAPE)).toEqual({});
		expect(contactFormBody(values, PLAIN_SHAPE)).toEqual({
			name: "Robin Ash",
			email: "robin@example.com",
			topic: "A cake",
			message: "A round cake.",
			company: "",
		});
	});

	it("refuses a missing name, a bad email, and an empty message, in the page's order", () => {
		const values = readContactForm(
			data([
				["email", "robin@"],
				["message", "  "],
			]),
			PLAIN_SHAPE,
		);
		const refused = checkContactForm(values, PLAIN_SHAPE);
		expect(refused).toEqual({ name: true, email: true, message: true });
		expect(firstRefused(refused)).toBe("name");
	});

	it("relays the honeypot verbatim, untrimmed", () => {
		const bot = readContactForm(data([["company", " Spam Co "]]), PLAIN_SHAPE);
		expect(contactFormBody(bot, PLAIN_SHAPE).company).toBe(" Spam Co ");
	});
});

describe("every opt in field", () => {
	it("adds its own keys and keeps the five, name and topic filled for an old relay", () => {
		const values = readContactForm(data(fullEntries), FULL);
		expect(checkContactForm(values, FULL)).toEqual({});
		expect(contactFormBody(values, FULL)).toEqual({
			name: "Robin Ash",
			email: "robin@example.com",
			topic: "Wedding cakes, Wholesale",
			message: "Two tiers.",
			company: "",
			firstName: "Robin",
			lastName: "Ash",
			phone: "(555) 555-0142",
			address: { street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" },
			services: ["Wedding cakes", "Wholesale"],
			consent: true,
		});
	});

	it("posts consent false when the box is left clear, and no services as an empty list", () => {
		const entries = fullEntries.filter(([key]) => key !== "consent" && key !== "services");
		const body = contactFormBody(readContactForm(data(entries), FULL), FULL);
		expect(body.consent).toBe(false);
		expect(body.services).toEqual([]);
		expect(body.topic).toBe("");
	});

	it("adds only the keys of the fields that are on", () => {
		const shape = { ...PLAIN_SHAPE, phone: "optional" as const };
		const body = contactFormBody(
			readContactForm(data([...plainEntries, ["phone", ""]]), shape),
			shape,
		);
		expect(Object.keys(body).sort()).toEqual([
			"company",
			"email",
			"message",
			"name",
			"phone",
			"topic",
		]);
	});

	it("ignores a field's data when the field is off", () => {
		const values = readContactForm(
			data([...plainEntries, ["phone", "555"], ["consent", "yes"]]),
			PLAIN_SHAPE,
		);
		expect(values.phone).toBe("");
		expect(values.consent).toBe(false);
	});
});

describe("checking the opt in fields", () => {
	const filled = (overrides: [string, string][]) => {
		const kept = fullEntries.filter(([key]) => !overrides.some(([k]) => k === key));
		return readContactForm(data([...kept, ...overrides]), FULL);
	};

	it("refuses a split name's empty halves, not the one name", () => {
		const refused = checkContactForm(
			filled([
				["firstName", " "],
				["lastName", ""],
			]),
			FULL,
		);
		expect(refused).toEqual({ firstName: true, lastName: true });
		expect(firstRefused(refused)).toBe("firstName");
	});

	it("refuses a required phone that is not ten digits", () => {
		expect(checkContactForm(filled([["phone", "555-0142"]]), FULL)).toEqual({ phone: true });
		expect(checkContactForm(filled([["phone", ""]]), FULL)).toEqual({ phone: true });
		expect(checkContactForm(filled([["phone", "+1 555 555 0142"]]), FULL)).toEqual({});
	});

	it("leaves an optional phone alone when empty, and refuses a bad one", () => {
		const shape = { ...FULL, phone: "optional" as const };
		expect(checkContactForm(filled([["phone", ""]]), shape)).toEqual({});
		expect(checkContactForm(filled([["phone", "12"]]), shape)).toEqual({ phone: true });
	});

	it("takes the site's own phone check", () => {
		const anything = () => true;
		expect(checkContactForm(filled([["phone", "12"]]), FULL, anything)).toEqual({});
	});

	it("drops the state of an optional address nobody wrote, and keeps it once anything is", () => {
		const empty = filled([
			["street", ""],
			["city", ""],
			["zip", ""],
			["state", "CO"],
		]);
		expect(empty.address).toEqual({ street: "", city: "", state: "", zip: "" });
		expect(contactFormBody(empty, FULL).address).toEqual({
			street: "",
			city: "",
			state: "",
			zip: "",
		});
		const cityOnly = filled([
			["street", ""],
			["city", "Fairhaven"],
			["zip", ""],
			["state", "CO"],
		]);
		expect(cityOnly.address.state).toBe("CO");
	});

	it("keeps the state of a required address, written or not", () => {
		const shape = { ...FULL, address: "required" as const };
		const kept = [...fullEntries.filter(([key]) => !["street", "city", "zip"].includes(key))];
		expect(readContactForm(data(kept), shape).address.state).toBe("CO");
	});

	it("never checks an optional address", () => {
		const blank = filled([
			["street", ""],
			["city", ""],
			["zip", "8"],
		]);
		expect(checkContactForm(blank, FULL)).toEqual({});
	});

	it("refuses every missing part of a required address, and a bad ZIP", () => {
		const shape = { ...FULL, address: "required" as const };
		const refused = checkContactForm(
			filled([
				["street", ""],
				["city", ""],
				["state", ""],
				["zip", "800"],
			]),
			shape,
		);
		expect(refused).toEqual({ street: true, city: true, state: true, zip: true });
		expect(firstRefused({ ...refused, email: true })).toBe("email");
	});
});

describe("the helpers", () => {
	it.each([
		["(555) 555-0142", true],
		["555.555.0142", true],
		["1-555-555-0142", true],
		["15555550142", true],
		["555-0142", false],
		["2-555-555-0142", false],
		["", false],
	])("isPhoneNumber(%j) is %s", (value, expected) => {
		expect(isPhoneNumber(value)).toBe(expected);
	});

	it.each([
		["80000", true],
		["80000-1234", true],
		["800001234", true],
		[" 80000 ", true],
		["8000", false],
		["80000-12", false],
		["ABCDE", false],
	])("isZIP(%j) is %s", (value, expected) => {
		expect(isZIP(value)).toBe(expected);
	});

	it.each([
		["(555) 555-0142", "tel:+15555550142"],
		["1-555-555-0142", "tel:+15555550142"],
		["+44 20 7946 0000", "tel:+442079460000"],
		["555-0142", "tel:5550142"],
	])("telHref(%j) is %s", (value, expected) => {
		expect(telHref(value)).toBe(expected);
	});

	it("writes an address on one line, skipping what is empty", () => {
		expect(
			addressLine({ street: "418 Alder Street", city: "Fairhaven", state: "CO", zip: "80000" }),
		).toBe("418 Alder Street, Fairhaven, CO 80000");
		expect(addressLine({ street: "", city: "Fairhaven", state: "CO", zip: "" })).toBe(
			"Fairhaven, CO",
		);
		expect(addressLine({ street: "", city: "", state: "", zip: "" })).toBe("");
	});
});
