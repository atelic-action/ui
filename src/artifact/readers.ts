import type { ArtifactReader } from "./artifactConfig.js";

/**
 * Who opened it. An artifact reports every open to the practice's HubSpot
 * portal, and an open lands on a person's contact record only when the visit
 * says who they are. A visit says so one of two ways:
 *
 * - **Their link.** Every link sent to a named person carries
 *   `?k=<their token>`, and site.config.ts lists that reader.
 * - **The wall.** A reader who signed in on a private host is known by the
 *   email they signed in with, read from the `gate_email` cookie.
 *
 * site.config.ts ships in the script every page loads, so a reader is listed
 * sealed, never in the clear: `id` is a digest of the token, and `sealed` is
 * the email encrypted under a key derived from the token. Only the link can
 * open it, and the link is in one person's inbox. Reading the page's source
 * gives nobody's address.
 *
 * Nothing here touches the page or the network, so it tests without a
 * browser. The root route does the one impure thing, the push to HubSpot.
 *
 * This file is also built to dist/ and exported on its own as
 * `@atelic-action/ui/artifact/readers`, because a site's browser tests and
 * its reader script import it under Node, which runs no TypeScript inside
 * node_modules. So it keeps the built corner's rules: no JSX, and `.js` on
 * its relative imports.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
	const padded = text.replaceAll("-", "+").replaceAll("_", "/");
	return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function digest(text: string): Promise<ArrayBuffer> {
	return crypto.subtle.digest("SHA-256", encoder.encode(text));
}

/** What a config lists a token under: a digest, so the token itself never ships. */
export async function readerId(token: string): Promise<string> {
	const bytes = new Uint8Array(await digest(`id:${token}`));
	return Array.from(bytes.slice(0, 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function keyFor(token: string): Promise<CryptoKey> {
	return crypto.subtle.importKey("raw", await digest(`key:${token}`), "AES-GCM", false, [
		"encrypt",
		"decrypt",
	]);
}

/** A fresh token for one reader's links: twelve characters, safe in a URL. */
export function mintToken(): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(9)));
}

/** Seal a reader's email under their token: the entry site.config.ts lists. */
export async function sealReader(email: string, token: string): Promise<ArtifactReader> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const sealed = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			await keyFor(token),
			encoder.encode(email),
		),
	);
	const packed = new Uint8Array(iv.length + sealed.length);
	packed.set(iv);
	packed.set(sealed, iv.length);
	return { id: await readerId(token), sealed: toBase64Url(packed) };
}

/** The email a link's token opens, or undefined when it opens nobody's. */
export async function openReader(
	readers: ArtifactReader[] | undefined,
	token: string | null | undefined,
): Promise<string | undefined> {
	if (!token || !readers?.length) return undefined;
	const id = await readerId(token);
	const reader = readers.find((entry) => entry.id === id);
	if (!reader) return undefined;
	try {
		const packed = fromBase64Url(reader.sealed);
		const opened = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: packed.slice(0, 12) },
			await keyFor(token),
			packed.slice(12),
		);
		return decoder.decode(opened);
	} catch {
		return undefined;
	}
}

function domainOf(email: string): string {
	return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

/**
 * The email this visit should be identified as, or undefined to leave it
 * anonymous.
 *
 * On a private artifact the sign in decides, and a link's token never
 * overrides it: the wall checked who this is, and a token only says who a
 * link was sent to. So a signed in reader is identified by their own email,
 * and a reader on the sender's domain is nobody's open even through someone
 * else's link, since that is the practice reading its own document. A
 * visit with no sign in (the wall not armed, as in local dev) falls back to
 * the link.
 *
 * A public artifact has no wall, so a `gate_email` cookie there proves
 * nothing and is never read: the link's token is the only identity.
 */
export async function whoIsReading(visit: {
	readers: ArtifactReader[] | undefined;
	search: string;
	access: "public" | "private";
	gateEmail: string;
	senderEmail: string;
}): Promise<string | undefined> {
	if (visit.access === "private") {
		const signedIn = visit.gateEmail.trim();
		if (signedIn.includes("@")) {
			if (domainOf(signedIn) === domainOf(visit.senderEmail)) return undefined;
			return signedIn;
		}
	}
	const token = new URLSearchParams(visit.search).get("k");
	return openReader(visit.readers, token);
}

/** The link to send a reader: the artifact's page with their token on it. */
export function readerLink(siteUrl: string, token: string, path = "/writeup"): string {
	const url = new URL(path, siteUrl);
	url.searchParams.set("k", token);
	return url.toString();
}
