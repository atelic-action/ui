import { webcrypto } from "node:crypto";
import { normalizeEmail, sealDocument } from "../../src/scripts/build-gate-payload.mjs";

/**
 * The payload builder is one half of a contract; Gate in the browser is the
 * other. These parameters are copied from the component deliberately rather
 * than imported from the script, so a change on either side shows up here as
 * a failing round trip instead of two files quietly agreeing on a value that
 * no longer opens the payloads already sent.
 */
const ITERATIONS = 200000;
const HASH = "SHA-256";

const HTML = "<h1>A Proposal</h1><p>Three tiers, one number each.</p>";
const PEOPLE = [
	{ id: "kyle", email: "kyle@example.com" },
	{ id: "dana", email: "dana@example.net" },
];

function fromBase64(value: string): Uint8Array {
	return new Uint8Array(Buffer.from(value, "base64"));
}

interface Payload {
	civ: string;
	ct: string;
	people: Array<{ id: string; salt: string; iv: string; wrapped: string }>;
}

/**
 * The browser's half of the contract, written out: normalize the email,
 * derive each reader's wrapping key, unwrap the content key, decrypt the
 * document. Returns "" when the email opens nothing, which is all the gate
 * ever knows.
 */
async function open(payload: Payload, rawEmail: string): Promise<string> {
	const normalized = rawEmail.toUpperCase().replace(/[^A-Z0-9]/g, "");
	const material = await webcrypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(normalized),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	for (const person of payload.people) {
		try {
			const wrapper = await webcrypto.subtle.deriveKey(
				{ name: "PBKDF2", salt: fromBase64(person.salt), iterations: ITERATIONS, hash: HASH },
				material,
				{ name: "AES-GCM", length: 256 },
				false,
				["decrypt"],
			);
			const contentKeyBytes = await webcrypto.subtle.decrypt(
				{ name: "AES-GCM", iv: fromBase64(person.iv) },
				wrapper,
				fromBase64(person.wrapped),
			);
			const contentKey = await webcrypto.subtle.importKey(
				"raw",
				contentKeyBytes,
				{ name: "AES-GCM" },
				false,
				["decrypt"],
			);
			const plain = await webcrypto.subtle.decrypt(
				{ name: "AES-GCM", iv: fromBase64(payload.civ) },
				contentKey,
				fromBase64(payload.ct),
			);
			return new TextDecoder().decode(plain);
		} catch {
			// Wrong reader for this email. Try the next.
		}
	}
	return "";
}

describe("build-gate-payload", () => {
	describe("normalizeEmail", () => {
		it("reads an email by its letters and digits alone", () => {
			expect(normalizeEmail("kyle@example.com")).toBe("KYLEEXAMPLECOM");
			expect(normalizeEmail("Kyle@Example.COM")).toBe("KYLEEXAMPLECOM");
			expect(normalizeEmail(" kyle@example.com ")).toBe("KYLEEXAMPLECOM");
		});

		it("keeps two different emails different", () => {
			expect(normalizeEmail("kyle@example.com")).not.toBe(normalizeEmail("dana@example.net"));
		});
	});

	describe("sealDocument", () => {
		it("round trips the document for every reader it was sealed for", async () => {
			const payload = (await sealDocument(HTML, PEOPLE)) as Payload;

			expect(await open(payload, "kyle@example.com")).toBe(HTML);
			expect(await open(payload, "dana@example.net")).toBe(HTML);
		});

		it("opens on any spelling of the same email", async () => {
			const payload = (await sealDocument(HTML, PEOPLE)) as Payload;

			expect(await open(payload, "Kyle@Example.COM")).toBe(HTML);
			expect(await open(payload, " kyle@example.com ")).toBe(HTML);
		});

		it("gives an email that belongs to nobody nothing at all", async () => {
			const payload = (await sealDocument(HTML, PEOPLE)) as Payload;

			expect(await open(payload, "stranger@example.com")).toBe("");
			expect(await open(payload, "")).toBe("");
		});

		it("emits no plaintext document", async () => {
			const payload = (await sealDocument(HTML, PEOPLE)) as Payload;
			const serialized = JSON.stringify(payload);

			expect(serialized).not.toContain("A Proposal");
			expect(serialized).not.toContain("Three tiers");
			// Nor a reader's email: it is the key, so the payload names no one.
			for (const person of payload.people) {
				expect(Object.keys(person).sort()).toEqual(["id", "iv", "salt", "wrapped"]);
			}
			expect(serialized).not.toContain("kyle@example.com");
			expect(serialized).not.toContain("dana@example.net");
			expect(serialized.toLowerCase()).not.toContain("example");
		});

		it("seals each reader under their own salt and nonce", async () => {
			const payload = (await sealDocument(HTML, PEOPLE)) as Payload;

			expect(payload.people[0].salt).not.toBe(payload.people[1].salt);
			expect(payload.people[0].iv).not.toBe(payload.people[1].iv);
			expect(payload.people[0].wrapped).not.toBe(payload.people[1].wrapped);
		});

		it("refuses a payload nobody could open", async () => {
			await expect(sealDocument(HTML, [])).rejects.toThrow(/no people/);
			await expect(sealDocument(HTML, [{ id: "kyle", email: "@." }])).rejects.toThrow(/no email/);
			await expect(
				sealDocument(HTML, [
					{ id: "kyle", email: "a@example.com" },
					{ id: "kyle", email: "b@example.com" },
				]),
			).rejects.toThrow(/duplicate/);
		});
	});
});

describe("sealDocument, what a payload calls a reader", () => {
	it("numbers the readers in order and writes no id a config gave", async () => {
		const payload = (await sealDocument("<p>A document</p>", [
			{ id: "kyle", email: "kyle@example.com" },
			{ id: "dana", email: "dana@example.net" },
		])) as { people: Array<{ id: string }> };
		expect(payload.people.map((person) => person.id)).toEqual(["r1", "r2"]);
		expect(JSON.stringify(payload)).not.toMatch(/kyle|dana/);
	});

	it("still refuses two readers a config gave the same id", async () => {
		await expect(
			sealDocument("<p>A document</p>", [
				{ id: "kyle", email: "a@example.com" },
				{ id: "kyle", email: "b@example.com" },
			]),
		).rejects.toThrow(/duplicate/);
	});
});
