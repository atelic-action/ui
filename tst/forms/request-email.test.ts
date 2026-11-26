// @vitest-environment node
import {
	type RequestEmailRequest,
	requestEmail,
	type ScheduleConfig,
} from "../../src/forms/schedule";

const CONFIG: ScheduleConfig = {
	kinds: [{ id: "repair", label: "A repair", visit: 30, call: 20 }],
	hours: { open: "08:00", close: "17:00" },
	timeZone: "America/Denver",
	phone: { display: "(555) 555-0100", e164: "+15555550100" },
};

const VISIT: RequestEmailRequest = {
	kindLabel: "A repair",
	materialLabel: "Shingle",
	mode: "visit",
	minutes: 30,
	day: "2026-12-02",
	time: "09:00",
	firstName: "Dana",
	phone: "(555) 555-0142",
	where: "418 Alder Street, Fairhaven, CO 80000",
};

const brand = { brandName: "Alder Roofing" };

describe("the customer's confirmation", () => {
	it("says it is a request, not a booked appointment, and when the office confirms", () => {
		const email = requestEmail(VISIT, CONFIG, brand);
		expect(email.subject).toBe("We have your request for Wednesday, December 2");
		expect(email.text.split("\n")).toEqual([
			"We have your request.",
			"",
			"This is a request, not a booked appointment yet. Our office will confirm your time within 2 business days, by phone or text.",
			"",
			"What: A repair, Shingle",
			"How: A visit at your property, about 30 minutes",
			"Asked for: Wednesday, December 2 at 9:00 am",
			"",
			"What Happens Next",
			"1. Our office confirms your time within 2 business days, by phone or text.",
			"2. We come out at the confirmed time and take a look.",
			"",
			"Need to change this request, or need us sooner? Call our office at (555) 555-0100.",
			"",
			"Alder Roofing",
			"You are getting this because you sent a request on our website.",
		]);
	});

	it("never promises an appointment that is set", () => {
		for (const mode of ["visit", "call"] as const) {
			const { html, text, subject } = requestEmail({ ...VISIT, mode }, CONFIG, brand);
			for (const words of [html, text, subject]) {
				expect(words).not.toMatch(
					/\b(is|are) (booked|confirmed|scheduled)\b|your appointment is|see you (on|at)/i,
				);
				expect(words).not.toMatch(/add to calendar/i);
			}
		}
	});

	it("repeats nothing the visitor typed unless the site turns on the copy", () => {
		const plain = requestEmail(VISIT, CONFIG, brand);
		expect(plain.html).not.toContain("Dana");
		expect(plain.html).not.toContain("418 Alder Street");
		const copy = requestEmail(VISIT, CONFIG, { ...brand, copy: true });
		expect(copy.text).toContain("We have your request, Dana.");
		expect(copy.text).toContain("Where: 418 Alder Street, Fairhaven, CO 80000");
		const call = requestEmail({ ...VISIT, mode: "call", minutes: 20 }, CONFIG, {
			...brand,
			copy: true,
		});
		expect(call.text).toContain("Call you at: (555) 555-0142");
		expect(call.text).not.toContain("Where:");
		expect(call.text).toContain("We call you at the confirmed time.");
	});

	it("links the office's number and escapes every word", () => {
		const email = requestEmail(
			{ ...VISIT, firstName: "<b>Dana</b>" },
			{ ...CONFIG, confirmWithin: "one day" },
			{ ...brand, copy: true, address: ["100 Main Street"], look: { accent: "#123456" } },
		);
		expect(email.html).toContain('href="tel:+15555550100"');
		expect(email.html).toContain("&lt;b&gt;Dana&lt;/b&gt;");
		expect(email.html).not.toContain("<b>Dana");
		expect(email.html).toContain("within one day");
		expect(email.html).toContain("background:#123456");
		expect(email.html).toContain("100 Main Street");
	});
});

describe("a font stack with quotes", () => {
	it("stays inside its style attribute", () => {
		const email = requestEmail(VISIT, CONFIG, {
			...brand,
			look: { font: '"Inter", Arial, sans-serif' },
		});
		expect(email.html).not.toContain('font-family:"Inter"');
		expect(email.html).toContain("font-family:&quot;Inter&quot;, Arial, sans-serif;");
	});
});
