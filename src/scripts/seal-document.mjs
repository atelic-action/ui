/**
 * Seals a document into the payload the `Gate` component reads.
 *
 * One content key encrypts the document once (AES-GCM). That key is then
 * wrapped once per reader, under a key derived from that reader's own email
 * address with PBKDF2. So every reader opens the same document with the one
 * thing they always know, and the emitted payload carries no plaintext: not
 * the document, and not even a hash the reader list could be checked
 * against. Nor a reader's address: it is the secret their key derives from,
 * so listing it beside their wrapped key would hand the document to anyone
 * who reads the page's script. Payloads sealed before 2026-10-08 did list
 * it; the gate now tells HubSpot who opened the document from the address
 * the reader typed. The secret is still never anything beyond that address,
 * which is the gate's deliberate, documented security tier. See GATE.md.
 *
 * Node's webcrypto is the same algorithm surface the browser exposes, so the
 * two sides are byte compatible by construction rather than by agreement.
 * The parameters below are the contract; changing one here without changing
 * the matching constant in `Gate` (@atelic-action/ui/artifact) makes every
 * existing payload unopenable.
 *
 * CLI (bin/atelic-seal-document.mjs runs this file's `main` under Node):
 *   atelic-seal-document <config.json> [out.json]
 *   bun run seal <config.json> [out.json]   (the form a site offers)
 *
 * Config shape (paths resolve relative to the config file):
 *   { "content": "./proposal.html",
 *     "people": [{ "id": "kyle", "email": "kyle@example.com" }] }
 */
import { webcrypto } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { argv, exit, stderr, stdout } from "node:process";

/** PBKDF2 work factor. Mirrored by Gate; changing it breaks old payloads. */
export const PBKDF2_ITERATIONS = 200000;
export const PBKDF2_HASH = "SHA-256";
/** Byte lengths: content key, GCM nonce, per person PBKDF2 salt. */
export const KEY_BYTES = 32;
export const IV_BYTES = 12;
export const SALT_BYTES = 16;

const encoder = new TextEncoder();

/**
 * The one normalization both sides share: an email is its letters and
 * digits, uppercased. So "Dana@Example.com", "dana@example.com" and a stray
 * space are all the same key, and a reader typing their own address cannot
 * miss by punctuation or case. Mirrored in Gate; the two implementations
 * must agree exactly.
 */
export function normalizeEmail(email) {
	return String(email ?? "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");
}

function toBase64(bytes) {
	return Buffer.from(bytes).toString("base64");
}

function randomBytes(length) {
	return webcrypto.getRandomValues(new Uint8Array(length));
}

/** Derive one reader's wrapping key from their email and their own salt. */
async function deriveKey(email, salt) {
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

/**
 * Encrypt `contentHtml` once and wrap the content key for each person.
 * `people` is [{ id, email }]. The email is the reader's secret, the thing
 * their key derives from, so it never reaches the payload; nor does the id,
 * which is often a first name. A sealed reader is an ordinal (`r1`, `r2`)
 * and their wrap, and nothing that says who they are.
 */
export async function sealDocument(contentHtml, people) {
	if (typeof contentHtml !== "string" || contentHtml.length === 0) {
		throw new Error("contentHtml is empty; nothing to seal");
	}
	if (!Array.isArray(people) || people.length === 0) {
		throw new Error("no people; a payload nobody can open is not worth building");
	}

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

	const seen = new Set();
	const sealed = [];
	for (const person of people) {
		const id = person?.id;
		if (!id) throw new Error("every person needs an id");
		if (seen.has(id)) throw new Error(`duplicate person id: ${id}`);
		seen.add(id);
		if (!person.email || !normalizeEmail(person.email)) {
			throw new Error(`person ${id} has no email (or none that survives normalization)`);
		}

		const salt = randomBytes(SALT_BYTES);
		const iv = randomBytes(IV_BYTES);
		const key = await deriveKey(person.email, salt);
		const wrapped = new Uint8Array(
			await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, contentKeyBytes),
		);
		// The id a config gives a reader is often their first name, which
		// beside the site's domain all but spells the address that is their
		// key. So the payload carries a plain ordinal, and the config's id
		// stays in the config, where it names a reader in an error message.
		sealed.push({
			id: `r${sealed.length + 1}`,
			salt: toBase64(salt),
			iv: toBase64(iv),
			wrapped: toBase64(wrapped),
		});
	}

	return { civ: toBase64(civ), ct: toBase64(ct), people: sealed };
}

/**
 * The command: `args` is the command line after the command's own name.
 * Both paths resolve against the working directory.
 */
export async function main(args = argv.slice(2)) {
	const [configPath, outPath] = args;
	if (!configPath) {
		stderr.write("usage: atelic-seal-document <config.json> [out.json]\n");
		exit(1);
	}

	const configFile = resolve(configPath);
	const config = JSON.parse(readFileSync(configFile, "utf8"));
	if (!config.content) throw new Error(`${configPath} has no "content" path`);

	const contentHtml = readFileSync(resolve(dirname(configFile), config.content), "utf8");
	const payload = await sealDocument(contentHtml, config.people);

	const out = resolve(outPath ?? "gate-payload.json");
	writeFileSync(out, `${JSON.stringify(payload, null, "\t")}\n`);
	stdout.write(`[gate] ${out} (${payload.people.length} readers)\n`);
}

/** Runs `main` and turns a failure into the one line the command prints. */
export function cli(args = argv.slice(2)) {
	return main(args).catch((error) => {
		stderr.write(`[gate] ${error.message}\n`);
		exit(1);
	});
}
