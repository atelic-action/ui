// @vitest-environment node
import { type ContactField, officeEmail, PLAIN_FIELDS } from "../../src/forms/contact";
import {
	DEFAULT_RECEIPT_NEXT,
	DEFAULT_RECEIPT_NOTE,
	DEFAULT_RECEIPT_SUBJECT,
	displayName,
	noReplySender,
	receiptEmail,
	receiptSender,
} from "../../src/forms/receipt";
import { sourceField } from "../../src/forms/source";

const FROM = "Summit Movement Studio <forms@example.com>";

const SPLIT: ContactField[] = [
	{ key: "name", label: "Name", required: true },
	{ key: "firstName", label: "First name", show: false },
	{ key: "email", label: "Email", kind: "email", required: true },
	{ key: "phone", label: "Phone", kind: "phone" },
	{ key: "topic", label: "Topic" },
	sourceField({ label: "How did you hear about us?", options: ["Google", "A friend"] }),
	{ key: "message", label: "Message", required: true, limit: 5000 },
];

describe("receiptEmail without a copy, the default", () => {
	const read = {
		name: "Jane Doe",
		firstName: "Jane",
		email: "jane@example.com",
		phone: "(303) 555-0142",
		topic: "Saturday class",
		source: "A friend",
		message: "Do you have room on Saturday?",
	};
	const pieces = [
		"Jane",
		"Doe",
		"jane@example.com",
		"303",
		"555-0142",
		"5550142",
		"Saturday",
		"A friend",
		"room",
	];

	it("holds nothing the visitor wrote, in its subject, its HTML, or its text", () => {
		const email = receiptEmail(read, SPLIT, { endpointFrom: FROM });
		for (const piece of pieces) {
			expect(email.subject).not.toContain(piece);
			expect(email.html).not.toContain(piece);
			expect(email.text).not.toContain(piece);
		}
		expect(email.text).toBe(
			[
				"We have your message.",
				"",
				DEFAULT_RECEIPT_NEXT,
				"",
				"Summit Movement Studio",
				"",
				DEFAULT_RECEIPT_NOTE,
			].join("\n"),
		);
		expect(email.html).not.toContain("What you sent");
		// A no-reply receipt carries no reply address at all.
		expect(email).not.toHaveProperty("replyTo");
	});

	it("holds nothing the visitor wrote with copy set false, and the site's own words still", () => {
		const email = receiptEmail(read, SPLIT, {
			endpointFrom: FROM,
			copy: false,
			subject: "Thanks for writing",
			next: "We call back within a day.",
		});
		for (const piece of pieces)
			expect(`${email.subject}${email.html}${email.text}`).not.toContain(piece);
		expect(email.subject).toBe("Thanks for writing");
		expect(email.text).toContain("We call back within a day.");
	});
});

describe("receiptEmail with a copy", () => {
	it("greets by the shown name, the hidden first name unused, and reads back what was sent", () => {
		const email = receiptEmail(
			{
				name: "Jane Doe",
				firstName: "Jane",
				email: "jane@example.com",
				phone: "(303) 555-0142",
				topic: "",
				source: "",
				message: "Do you have room on Saturday?",
			},
			SPLIT,
			{ endpointFrom: FROM, copy: true },
		);
		expect(email.subject).toBe(DEFAULT_RECEIPT_SUBJECT);
		// A no-reply receipt carries no reply address at all.
		expect(email).not.toHaveProperty("replyTo");
		// An empty field prints no row here, its blank words included.
		expect(email.text).toBe(
			[
				"We have your message, Jane Doe.",
				"",
				DEFAULT_RECEIPT_NEXT,
				"",
				"What you sent",
				"Email: jane@example.com",
				"Phone: (303) 555-0142",
				"",
				"Message:",
				"Do you have room on Saturday?",
				"",
				"Summit Movement Studio",
				"",
				DEFAULT_RECEIPT_NOTE,
			].join("\n"),
		);
		expect(email.text).not.toContain("Not given");
		expect(email.html).not.toContain("Not given");
		expect(email.html).toContain('<a href="tel:+13035550142">(303) 555-0142</a>');
		expect(email.html).toContain("What you sent");
	});

	it("greets by the whole name when no first name is listed or it is empty", () => {
		const plain = receiptEmail(
			{ name: "Jane Doe", email: "jane@example.com", topic: "", message: "Hi" },
			PLAIN_FIELDS,
			{ endpointFrom: FROM, copy: true },
		);
		expect(plain.text.split("\n")[0]).toBe("We have your message, Jane Doe.");
		const empty = receiptEmail(
			{ name: "Jane Doe", firstName: "", email: "jane@example.com", message: "Hi" },
			SPLIT,
			{ endpointFrom: FROM, copy: true },
		);
		expect(empty.text.split("\n")[0]).toBe("We have your message, Jane Doe.");
	});

	it("greets by a first name the site shows", () => {
		const shown = SPLIT.map((field) =>
			field.key === "firstName" ? { ...field, show: true } : field,
		);
		const email = receiptEmail(
			{ name: "Jane Doe", firstName: "Jane", email: "jane@example.com", message: "Hi" },
			shown,
			{ endpointFrom: FROM, copy: true },
		);
		expect(email.text.split("\n")[0]).toBe("We have your message, Jane.");
	});

	it("greets no one when every name field is kept out of the emails", () => {
		const hidden = [
			{ key: "name", label: "Name", required: true, show: false },
			{ key: "firstName", label: "First name", show: false },
			{ key: "email", label: "Email", kind: "email" as const, required: true },
			{ key: "message", label: "Message", required: true },
		];
		const email = receiptEmail(
			{ name: "Jane Doe", firstName: "Jane", email: "jane@example.com", message: "Hi" },
			hidden,
			{ endpointFrom: FROM, copy: true },
		);
		expect(email.text.split("\n")[0]).toBe("We have your message.");
		expect(email.text).not.toContain("Jane");
		expect(email.html).not.toContain("Jane");
	});

	it("greets no one when the form asks no name", () => {
		const email = receiptEmail(
			{ email: "jane@example.com", message: "Hi" },
			[
				{ key: "email", label: "Email", kind: "email", required: true },
				{ key: "message", label: "Message", required: true },
			],
			{ endpointFrom: FROM },
		);
		expect(email.text.split("\n")[0]).toBe("We have your message.");
	});

	it("takes the site's subject, next line, and signature", () => {
		const email = receiptEmail(
			{ name: "Jane", email: "jane@example.com", topic: "", message: "Hi" },
			PLAIN_FIELDS,
			{
				endpointFrom: FROM,
				subject: "Thanks for writing",
				next: "We call back within a day.",
				signature: "The front desk",
				note: "This inbox is not read. Call us at (555) 555-0142.",
			},
		);
		expect(email.subject).toBe("Thanks for writing");
		expect(email.text).toContain("We call back within a day.");
		expect(email.text).toContain("The front desk");
		expect(email.text.endsWith("This inbox is not read. Call us at (555) 555-0142.")).toBe(true);
		expect(email.html).toContain("This inbox is not read.");
		expect(email.html).toContain("The front desk");
	});

	it("signs with nothing when the sender has no display name", () => {
		const email = receiptEmail(
			{ name: "Jane", email: "jane@example.com", topic: "", message: "Hi" },
			PLAIN_FIELDS,
			{ endpointFrom: "forms@example.com", copy: true, note: "" },
		);
		// An empty note prints none.
		expect(email.text.endsWith("Hi")).toBe(true);
		expect(email.html).not.toContain("not monitored");
	});

	it("escapes everything a visitor wrote exactly as the office's email does", () => {
		const hostile = '<img src=x onerror="pwn()">';
		const read = {
			name: hostile,
			email: "x@example.com?subject=Invoice&body=Wire%20it",
			topic: hostile,
			message: hostile,
		};
		const receipt = receiptEmail(read, PLAIN_FIELDS, { endpointFrom: FROM, copy: true });
		const office = officeEmail(read, PLAIN_FIELDS);
		for (const html of [receipt.html, office.html]) {
			expect(html).not.toContain("<img");
			expect(html).toContain("&lt;img src=x onerror=&quot;pwn()&quot;&gt;");
			expect(html).toContain(
				'href="mailto:x@example.com%3Fsubject%3DInvoice%26body%3DWire%2520it"',
			);
		}
	});
});

describe("displayName", () => {
	it.each([
		["Summit Movement Studio <forms@example.com>", "Summit Movement Studio"],
		['"Summit Movement Studio" <forms@example.com>', "Summit Movement Studio"],
		["forms@example.com", ""],
		["<forms@example.com>", ""],
	])("reads %j as %j", (from, name) => {
		expect(displayName(from)).toBe(name);
	});
});

describe("noReplySender", () => {
	it.each([
		["Summit Movement Studio <forms@atelic.me>", "Summit Movement Studio <no-reply@atelic.me>"],
		[
			'"Summit Movement Studio" <forms@example.com>',
			'"Summit Movement Studio" <no-reply@example.com>',
		],
		["forms@atelic.me", "no-reply@atelic.me"],
		["  forms@example.com ", "no-reply@example.com"],
		["no address here", "no address here"],
	])("makes %j %j", (from, sender) => {
		expect(noReplySender(from)).toBe(sender);
	});

	it("is the receipt's sender unless the site names its own", () => {
		expect(receiptSender({}, FROM)).toBe("Summit Movement Studio <no-reply@example.com>");
		expect(receiptSender({ from: "Front Desk <desk@example.com>" }, FROM)).toBe(
			"Front Desk <desk@example.com>",
		);
	});
});
