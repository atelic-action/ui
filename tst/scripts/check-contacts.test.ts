import { contactProblems } from "../../src/scripts/check-contacts";

/* Fictional numbers in the 555-01xx range, on real area codes so Google's plan reads them. */
const good = {
	email: "hello@kestrelhollow.example.com",
	phone: { e164: "+13035550142", display: "(303) 555-0142" },
	header: {
		phones: [
			{ e164: "+13035550142", display: "303-555-0142", label: "The shop" },
			{ e164: "+19705550143", display: "(970) 555-0143", label: "Wholesale" },
		],
	},
	gate: { contactEmail: "orders@kestrelhollow.example.com" },
	contactDock: {
		items: [
			{ label: "Call", href: "tel:+13035550142" },
			{ label: "Write", href: "mailto:hello@kestrelhollow.example.com?subject=Hi" },
		],
	},
};

describe("contactProblems", () => {
	it("passes a sound config", () => {
		expect(contactProblems(good)).toEqual([]);
	});

	it("reads a vanity display by its keypad digits, and refuses one that dials another number", () => {
		expect(contactProblems({ phone: { e164: "+18003569377", display: "1-800-FLOWERS" } })).toEqual(
			[],
		);
		expect(contactProblems({ phone: { e164: "+18003569377", display: "1-800-FLOWERX" } })).toEqual([
			'site.phone: display "1-800-FLOWERX" does not read as +18003569377',
		]);
	});

	it("refuses an e164 that is not a valid number, naming the field", () => {
		const site = { ...good, phone: { e164: "+1303555014", display: "(303) 555-014" } };
		expect(contactProblems(site)).toEqual([
			expect.stringMatching(/^site\.phone: e164 "\+1303555014" is not a valid number/),
		]);
	});

	it("refuses an e164 written with spaces, or without its +", () => {
		const spaced = { phone: { e164: "+1 303 555 0142", display: "(303) 555-0142" } };
		const bare = { phone: { e164: "13035550142", display: "(303) 555-0142" } };
		expect(contactProblems(spaced)).toHaveLength(1);
		expect(contactProblems(bare)).toHaveLength(1);
	});

	it("refuses a display that reads as another number, naming the line", () => {
		const site = {
			...good,
			header: {
				phones: [good.header.phones[0], { e164: "+19705550143", display: "(970) 555-0144" }],
			},
		};
		expect(contactProblems(site)).toEqual([
			'site.header.phones[1]: display "(970) 555-0144" does not read as +19705550143',
		]);
	});

	it("refuses a bad email, wherever it sits", () => {
		const site = {
			...good,
			email: "hello@kestrelhollow",
			gate: { contactEmail: "orders at example" },
		};
		expect(contactProblems(site)).toEqual([
			'site.email: "hello@kestrelhollow" is not an email address',
			'site.gate.contactEmail: "orders at example" is not an email address',
		]);
	});

	it("refuses a tel: or mailto: href that does not dial or write", () => {
		const site = { contactDock: { items: [{ href: "tel:call-us" }, { href: "mailto:hello" }] } };
		expect(contactProblems(site)).toEqual([
			'site.contactDock.items[0].href: "tel:call-us" does not dial a number',
			'site.contactDock.items[1].href: "mailto:hello" does not write to an address',
		]);
	});

	it("takes a tel: href written with RFC 3966's visual separators, and a parameter", () => {
		const site = {
			contactDock: {
				items: [
					{ href: "tel:+1-303-555-0142" },
					{ href: "tel:+1.303.555.0142" },
					{ href: "tel:+1(303)555-0142;ext=12" },
				],
			},
		};
		expect(contactProblems(site)).toEqual([]);
	});

	it("leaves words alone: a label reading Email is not an address", () => {
		const site = {
			...good,
			labels: { email: "Email", confirmEmail: "Confirm your email" },
			form: { email: "Your email" },
			contactForm: { errorText: { email: "Please enter a valid email." } },
		};
		expect(contactProblems(site)).toEqual([]);
	});

	it("judges an address at the config's known paths", () => {
		const site = { ...good, analytics: { identify: { token: "t", email: "nobody" } } };
		expect(contactProblems(site)).toEqual([
			'site.analytics.identify.email: "nobody" is not an email address',
		]);
	});

	it("checks a Locations entry's phoneE164 and phoneDisplay, wherever it sits", () => {
		const site = {
			locations: [
				{ name: "Alder", phoneE164: "+13035550142", phoneDisplay: "(303) 555-0142" },
				{ name: "Birch", phoneE164: "13035550143", phoneDisplay: "(303) 555-0143" },
			],
		};
		expect(contactProblems(site)).toEqual([
			expect.stringMatching(/^site\.locations\[1\]: e164 "13035550143" is not a valid number/),
		]);
	});

	it("reads a national tel: href against the config's country, else the US", () => {
		const us = {
			contactDock: { items: [{ href: "tel:303-555-0100" }, { href: "tel:3035550100" }] },
		};
		expect(contactProblems(us)).toEqual([]);
		const canada = {
			address: { country: "CA" },
			contactDock: { items: [{ href: "tel:604-555-0100" }] },
		};
		expect(contactProblems(canada)).toEqual([]);
		const unknown = {
			address: { country: "United States" },
			contactDock: { items: [{ href: "tel:303-555-0100" }] },
		};
		expect(contactProblems(unknown)).toEqual([]);
	});

	it("fails a tel: href that is no plausible number at all", () => {
		expect(contactProblems({ contactDock: { items: [{ href: "tel:12" }] } })).toEqual([
			'site.contactDock.items[0].href: "tel:12" does not dial a number',
		]);
	});

	it("takes a percent encoded tel: href and a mailto: to several addresses", () => {
		const site = {
			contactDock: {
				items: [
					{ href: "tel:+1%20303%20555%200142" },
					{ href: "mailto:hello@example.com,orders@example.com?subject=Hi" },
					{ href: "mailto:hello%40example.com" },
				],
			},
		};
		expect(contactProblems(site)).toEqual([]);
	});

	it("takes an empty address as none, and a mailto: whose recipients are in its query", () => {
		const site = {
			...good,
			email: "",
			contactDock: { items: [{ href: "mailto:?to=hello@example.com&subject=Hi" }] },
		};
		expect(contactProblems(site)).toEqual([]);
		expect(contactProblems({ x: { href: "mailto:?subject=Hi" } })).toHaveLength(1);
	});

	it("leaves a React element in the config alone: it is copy", () => {
		const note = { $$typeof: Symbol.for("react.element"), props: { href: "tel:12", email: "x" } };
		expect(contactProblems({ ...good, footer: { note } })).toEqual([]);
	});

	it("walks a config that refers to itself once, without running out of stack", () => {
		const site: Record<string, unknown> = { ...good };
		site.self = site;
		site.header = { phones: good.header.phones, parent: site };
		expect(contactProblems(site)).toEqual([]);
	});

	it("checks a site's own props, outside its config, under the path it is given", () => {
		const phones = [{ role: "Front desk", e164: "+13035550142", display: "(303) 555-0199" }];
		expect(contactProblems({ phones }, "contactCard")).toEqual([
			'contactCard.phones[0]: display "(303) 555-0199" does not read as +13035550142',
		]);
	});
});
