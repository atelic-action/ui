import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "../primitives/Button";

/**
 * PBKDF2 work factor and hash. Mirrored by scripts/build-gate-payload.mjs;
 * the two must agree exactly or every sealed payload stops opening.
 */
const PBKDF2_ITERATIONS = 200000;
const PBKDF2_HASH = "SHA-256";

declare global {
	interface Window {
		/** HubSpot tracking queue; the loader drains anything pushed before it loads. */
		_hsq?: unknown[];
	}
}

export interface GatePerson {
	/** Stable handle for the reader, used in the payload and in `onUnlock`. */
	id: string;
	/**
	 * The reader's email address: the secret their key derives from, and,
	 * when it matches `identifyDomain`, the identity pushed to HubSpot.
	 */
	email: string;
	/** Base64: this reader's PBKDF2 salt, GCM nonce, and wrapped content key. */
	salt: string;
	iv: string;
	wrapped: string;
}

export interface GatePayload {
	/** Base64: the document's GCM nonce and ciphertext. */
	civ: string;
	ct: string;
	people: GatePerson[];
}

export interface GateProps {
	/** Built by scripts/build-gate-payload.mjs. Carries no plaintext. */
	payload: GatePayload;
	/** localStorage key holding the reader's email, so a return visit walks straight in. */
	storageKey?: string;
	/**
	 * Query parameter a sent link may carry the reader's email in, so the
	 * link opens the document in one click. Checked once on mount and
	 * stripped from the address bar either way.
	 */
	queryParam?: string;
	/**
	 * When set, a reader whose email ends with this domain is pushed to
	 * HubSpot on unlock, so the open lands on their contact timeline.
	 * Readers on another domain identify nobody. Leave it unset and the
	 * gate tracks no one.
	 */
	identifyDomain?: string;
	/** Gate copy. Defaults are neutral; a client document overrides what it needs. */
	kicker?: string;
	heading?: string;
	sub?: string;
	placeholder?: string;
	inputLabel?: string;
	errorText?: string;
	/** Fired once, after a successful unlock. */
	onUnlock?: (person: GatePerson) => void;
}

/**
 * An email is its letters and digits, uppercased, so "Dana@Example.com",
 * "dana@example.com" and even a stray space all open the same document.
 * Mirrored in the build script.
 */
export function normalizeEmail(email: string): string {
	return email.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

interface Opened {
	person: GatePerson;
	html: string;
}

/**
 * Try the entered email against every reader in the payload. An email that
 * matches nobody fails the GCM tag check on each attempt and returns null,
 * which is the only signal the gate ever gives: it never reveals who is on
 * the list or how close a guess came.
 */
async function openDocument(payload: GatePayload, rawEmail: string): Promise<Opened | null> {
	const subtle = globalThis.crypto?.subtle;
	if (!subtle) return null;
	const normalized = normalizeEmail(rawEmail);
	if (!normalized) return null;

	const material = await subtle.importKey(
		"raw",
		new TextEncoder().encode(normalized),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	for (const person of payload.people) {
		try {
			const wrapper = await subtle.deriveKey(
				{
					name: "PBKDF2",
					salt: fromBase64(person.salt) as BufferSource,
					iterations: PBKDF2_ITERATIONS,
					hash: PBKDF2_HASH,
				},
				material,
				{ name: "AES-GCM", length: 256 },
				false,
				["decrypt"],
			);
			const contentKeyBytes = await subtle.decrypt(
				{ name: "AES-GCM", iv: fromBase64(person.iv) as BufferSource },
				wrapper,
				fromBase64(person.wrapped) as BufferSource,
			);
			const contentKey = await subtle.importKey(
				"raw",
				contentKeyBytes,
				{ name: "AES-GCM" },
				false,
				["decrypt"],
			);
			const plain = await subtle.decrypt(
				{ name: "AES-GCM", iv: fromBase64(payload.civ) as BufferSource },
				contentKey,
				fromBase64(payload.ct) as BufferSource,
			);
			return { person, html: new TextDecoder().decode(plain) };
		} catch {
			// Wrong email for this reader. Try the next one; say nothing.
		}
	}
	return null;
}

function identifyReader(person: GatePerson, domain: string | undefined) {
	if (!domain || !person.email) return;
	if (!person.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) return;
	window._hsq = window._hsq || [];
	window._hsq.push(["identify", { email: person.email }]);
	window._hsq.push(["setPath", window.location.pathname]);
	window._hsq.push(["trackPageView"]);
}

function readStored(key: string): string {
	try {
		return globalThis.localStorage?.getItem(key) ?? "";
	} catch {
		return ""; // Storage blocked (private mode); the reader just retypes their email.
	}
}

function writeStored(key: string, value: string) {
	try {
		globalThis.localStorage?.setItem(key, value);
	} catch {
		// Same: persistence is a courtesy, never a requirement.
	}
}

/** Read and strip the gate's query parameter in one motion. */
function takeQueryParam(name: string): string {
	try {
		const url = new URL(window.location.href);
		const value = url.searchParams.get(name) ?? "";
		if (value) {
			url.searchParams.delete(name);
			window.history.replaceState(window.history.state, "", url.toString());
		}
		return value;
	} catch {
		return "";
	}
}

/**
 * The gate: an email field standing in front of a sealed document.
 *
 * The document ships as ciphertext inside the page, so there is no server to
 * ask and nothing to gate at the edge. The reader's own email address derives
 * the key that unwraps the content key, the document decrypts in the browser,
 * and the gate replaces itself with it. Wrong emails get one line of copy and
 * no hint. A sent link can carry the email in a query parameter (`?email=`)
 * to open the document in one click.
 *
 * Sized for a document sent to named people: the reader types the one thing
 * they always know, no sign in, no inbox round trip. The access gate
 * (ACCESS-GATE.md, GateLogin in this folder) is the other shape, for a whole
 * site preview behind an email tied session with inbox verified identity.
 */
export function Gate({
	payload,
	storageKey = "gate-email",
	queryParam = "email",
	identifyDomain,
	kicker = "Private Document",
	heading = "Enter Your Email",
	sub = "This document opens with the email address it was sent to.",
	placeholder = "you@company.com",
	inputLabel = "Your email",
	errorText = "That email does not open this document. Use the address it was sent to.",
	onUnlock,
}: GateProps) {
	const [html, setHtml] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [busy, setBusy] = useState(false);
	const [value, setValue] = useState("");

	// Held in a ref so a caller passing an inline function cannot re-run the
	// auto unlock effect on every render.
	const onUnlockRef = useRef(onUnlock);
	onUnlockRef.current = onUnlock;

	// Silent auto unlock, in order: a sent link's query parameter first, then
	// the stored email of a reader who has been here before. A value that no
	// longer opens anything (the payload was rebuilt) fails quietly; a failed
	// query value pre fills the field and surfaces the error, since the
	// reader arrived expecting the door to open.
	useEffect(() => {
		let cancelled = false;

		async function attempt() {
			const fromQuery = takeQueryParam(queryParam);
			if (fromQuery) {
				const opened = await openDocument(payload, fromQuery);
				if (cancelled) return;
				if (opened) {
					writeStored(storageKey, fromQuery);
					identifyReader(opened.person, identifyDomain);
					setHtml(opened.html);
					onUnlockRef.current?.(opened.person);
					return;
				}
				setValue(fromQuery);
				setFailed(true);
				return;
			}

			const stored = readStored(storageKey);
			if (!stored) return;
			const opened = await openDocument(payload, stored);
			if (cancelled || !opened) return;
			identifyReader(opened.person, identifyDomain);
			setHtml(opened.html);
			onUnlockRef.current?.(opened.person);
		}

		attempt();
		return () => {
			cancelled = true;
		};
	}, [payload, storageKey, identifyDomain, queryParam]);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (busy) return;
		setBusy(true);
		setFailed(false);
		const opened = await openDocument(payload, value);
		setBusy(false);
		if (!opened) {
			setFailed(true);
			return;
		}
		writeStored(storageKey, value);
		identifyReader(opened.person, identifyDomain);
		setHtml(opened.html);
		onUnlockRef.current?.(opened.person);
	}

	if (html !== null) {
		return (
			<div className="gate-doc">
				<div className="wrap">
					{/* biome-ignore lint/security/noDangerouslySetInnerHtml: the document is the practice's own HTML, sealed at build time and decrypted here. Injecting it is the whole point of the component. */}
					<div className="gate-content" dangerouslySetInnerHTML={{ __html: html }} />
				</div>
			</div>
		);
	}

	return (
		<div className="gate-hall">
			<div className="wrap">
				<div className="gate-card">
					{kicker && <p className="gate-eyebrow">{kicker}</p>}
					<h1 className="gate-headline">{heading}</h1>
					{sub && <p className="gate-lead">{sub}</p>}
					<form className="gate-form" onSubmit={handleSubmit} noValidate>
						<input
							className="gate-input"
							type="email"
							inputMode="email"
							name="email"
							value={value}
							onChange={(event) => setValue(event.target.value)}
							placeholder={placeholder}
							aria-label={inputLabel}
							autoComplete="email"
							autoCapitalize="none"
							spellCheck={false}
						/>
						<Button type="submit" size="lg">
							{busy ? "Opening…" : "Open Document"}
						</Button>
					</form>
					{failed && (
						<p className="gate-error" role="alert">
							{errorText}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
