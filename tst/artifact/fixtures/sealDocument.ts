import { webcrypto } from "node:crypto";
import type { GatePayload } from "../../../src/artifact/Gate";

/**
 * Seals a document the way a site's own sealing script does, so the Gate's
 * tests open a real payload. The script itself stays with the artifact
 * template (scripts/build-gate-payload.mjs); this is its sealing function,
 * copied. The parameters are the contract with Gate.tsx: change one on
 * either side alone and every payload stops opening.
 */
const PBKDF2_ITERATIONS = 200000;
const PBKDF2_HASH = "SHA-256";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const SALT_BYTES = 16;

const encoder = new TextEncoder();

function normalizeEmail(email: string): string {
	return String(email ?? "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");
}

function toBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
	return webcrypto.getRandomValues(new Uint8Array(length));
}

async function deriveKey(email: string, salt: Uint8Array<ArrayBuffer>) {
	const material = await webcrypto.subtle.importKey(
		"raw",
		encoder.encode(normalizeEmail(email)),
		"PBKDF2",
		false,
		["deriveKey"],
	);
	return webcrypto.subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
		material,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

/** Encrypt `contentHtml` once and wrap the content key for each person. */
export async function sealDocument(
	contentHtml: string,
	people: { id: string; email: string }[],
): Promise<GatePayload> {
	const contentKeyBytes = randomBytes(KEY_BYTES);
	const contentKey = await webcrypto.subtle.importKey(
		"raw",
		contentKeyBytes,
		{ name: "AES-GCM" },
		false,
		["encrypt"],
	);
	const civ = randomBytes(IV_BYTES);
	const ct = new Uint8Array(
		await webcrypto.subtle.encrypt(
			{ name: "AES-GCM", iv: civ },
			contentKey,
			encoder.encode(contentHtml),
		),
	);

	const sealed = [];
	for (const person of people) {
		const salt = randomBytes(SALT_BYTES);
		const iv = randomBytes(IV_BYTES);
		const key = await deriveKey(person.email, salt);
		const wrapped = new Uint8Array(
			await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, contentKeyBytes),
		);
		sealed.push({
			id: person.id,
			email: person.email,
			salt: toBase64(salt),
			iv: toBase64(iv),
			wrapped: toBase64(wrapped),
		});
	}

	return { civ: toBase64(civ), ct: toBase64(ct), people: sealed };
}
