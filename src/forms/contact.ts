/**
 * The contact form's endpoint. A site's `api/contact.ts` names its sender,
 * the fields its form sends, and any destination beside the office's inbox,
 * and exports the handler this file makes:
 *
 *   export const POST = createContact({
 *     from: "Summit Movement Studio <forms@atelic.me>",
 *   });
 *
 * The handler reads the body, drops a honeypot catch behind a quiet success,
 * checks each listed field by its kind, asks the site's guard whether a
 * person sent it (when the site names one), and hands the submission to the
 * form relay: the office's email through Resend first, then the site's other
 * destinations, all at once. The visitor is answered 200 when any
 * destination took the submission and 502 only when none did, 400 when a
 * field is refused, and 403 when the guard refused it. The fields are read
 * before the guard is asked, so a submission about to be refused costs no
 * check and spends no token. With a receipt turned on, a submission the guard
 * passed and a destination took gets a copy sent back to the visitor.
 *
 * Env (set on the Vercel project):
 * - RESEND_API_KEY        sending only Resend API key
 * - CONTACT_TO            the inbox for inquiries, or several split by commas
 * - CONTACT_CANARY_TOKEN  shared secret the contact canary presents
 * - CONTACT_CANARY_TO     where canary submissions land (the practice's
 *                         inbox, never the client's)
 * - TURNSTILE_SECRET_KEY  the Turnstile widget's secret, read by
 *                         `turnstileGuard` when a site names that guard
 *
 * A submission whose `canary` field matches CONTACT_CANARY_TOKEN goes to
 * CONTACT_CANARY_TO by email and to no other destination, and its answer
 * carries the configured inbox and Resend's message id so the canary can
 * assert both. A canary skips the guard, since a token cannot be made
 * without a browser, and never gets a receipt.
 *
 * Time: the endpoint holds the guard to what the guard says its one try
 * takes and half a second more (3.5 seconds for Turnstile's 3), the relay to
 * 8, and the receipt's one try to 3, so a visitor waits 14.5 seconds in the
 * worst case, inside the 15 a site states to the platform. A report sent
 * after that worst case answer may still be cut short by the limit, as the
 * README's Form Relay chapter says.
 *
 * Errors: an unset RESEND_API_KEY or TURNSTILE_SECRET_KEY, or a canary with
 * no CONTACT_CANARY_TO, is reported on the production deploy alone (an
 * unset CONTACT_TO is no fault: inquiries go to the practice's inbox until a
 * site names its own). A guard that could not answer for any other reason
 * is reported, and the submission is let through rather than lost. A
 * destination that fails is reported by the relay, a receipt that fails is
 * reported while the visitor is still answered 200, and anything else the
 * handler throws is reported before the platform answers it. A report
 * carries the method, the path, and the user agent, never the submission,
 * never a token, and never an address.
 *
 * Built with the gate (`@atelic-action/ui/forms/contact`).
 */
import { EMAIL_PATTERN, toE164 } from "../lib/contactLinks.js";
import { escapeHTML } from "../lib/escapeHTML.js";
import { isHoneypotFilled } from "../lib/honeypot.js";
import { within } from "../lib/within.js";
import { reportServerErrorLater, scrub, withErrorReporting } from "../monitoring/server.js";
import { fieldRows, LOOK, rowsTable, shownWords, words } from "./emailParts.js";
import { type Guard, type GuardVerdict, TURNSTILE_TOKEN_KEY } from "./guard.js";
import { DEFAULT_RECEIPT_TIMEOUT_MS, type ReceiptOptions, receiptEmail } from "./receipt.js";
import { type Destination, type DestinationResult, down, relay, type Submission } from "./relay.js";
import { type Email, resendDestination } from "./resend.js";

/**
 * What a field holds, which decides how it is read, checked, and written
 * into the office's email.
 *
 * - `text`: words. Anything that is not a string reads as empty.
 * - `email`: an address; one that is not well formed is refused.
 * - `phone`: a number. Required, it must be one a phone can dial.
 * - `list`: several choices, each of them text.
 * - `choice`: one answer out of the field's `options`. An answer not on the
 *   list is read as not given, never refused.
 * - `address`: `{ street, city, state, zip }`.
 * - `checkbox`: true or false.
 */
export type FieldKind = "text" | "email" | "phone" | "list" | "choice" | "address" | "checkbox";

/** One field a form sends. */
export interface ContactField {
	/** The key the form sends it under. */
	key: string;
	/** What the office's email, and a refusal, call it. */
	label: string;
	/** Defaults to "text". */
	kind?: FieldKind;
	/** Whether a submission without it is refused. */
	required?: boolean;
	/**
	 * The most it may hold: characters for words (200 by default, 320 for an
	 * email, 40 for a phone), choices for a list (20 by default).
	 */
	limit?: number;
	/**
	 * False keeps it out of the office's email. It is still checked and still
	 * handed to every destination (a first name a CRM wants beside the whole
	 * name the email already shows).
	 */
	show?: boolean;
	/** The answers a `choice` accepts, in order. Required for a choice. */
	options?: string[];
	/**
	 * The words the office's email prints for the field when it holds
	 * nothing ("Not given"). Without them an empty field prints no row.
	 */
	blank?: string;
}

export interface Address {
	street: string;
	city: string;
	state: string;
	zip: string;
}

/** A field as read: words, choices, a checkbox's answer, an address, or nothing. */
export type FieldValue = string | string[] | boolean | Address | null;

/** A submission's fields by key, as every destination receives them. */
export type ContactFields = Record<string, FieldValue>;

export interface ContactOptions {
	/** The sender: `Display Name <forms@a-verified-domain>`. */
	from: string;
	/** The fields the form sends. Defaults to `PLAIN_FIELDS`. */
	fields?: ContactField[];
	/**
	 * The keys the subject is taken from, the first that holds anything
	 * winning. Defaults to `["topic"]`.
	 */
	subject?: string[];
	/** Destinations beside the office's email, each tried alongside it. */
	destinations?: Destination<ContactFields>[];
	/** How long one try of the email may take, in milliseconds. Defaults to 3000. */
	emailTimeoutMs?: number;
	/** The wait before a down destination's second try. Defaults to 1000. */
	retryWaitMs?: number;
	/** The longest the whole relay may run. Defaults to 8000. */
	deadlineMs?: number;
	/** The `route` tag on this endpoint's reports. Defaults to "contact". */
	route?: string;
	/**
	 * The spam check every submission but a canary passes before it is
	 * delivered (`turnstileGuard()`). A check that answers no refuses the
	 * submission; one that cannot answer lets it through and is reported.
	 */
	guard?: Guard;
	/**
	 * A copy back to the visitor, sent only when the guard passed the
	 * submission and a destination took it. Requires `guard`.
	 */
	receipt?: ReceiptOptions;
}

/** The fields of the form with no opt in: a name, an email, a topic, a message. */
export const PLAIN_FIELDS: ContactField[] = [
	{ key: "name", label: "Name", required: true },
	{ key: "email", label: "Email", kind: "email", required: true },
	// Room for a services picker's choices joined, which the form sends as
	// the topic: twenty of a hundred characters, and what joins them.
	{ key: "topic", label: "Topic", limit: 2100 },
	{ key: "message", label: "Message", required: true, limit: 5000 },
];

/** Where inquiries go until a site names its own inbox: the practice's. */
export const DEFAULT_CONTACT_TO = "matt@atelic.me";

/**
 * CONTACT_TO as the addresses to send to: one, or several split by commas.
 * Unset or holding no address, it is the practice's inbox alone.
 */
export function recipients(value: string | undefined): string[] {
	const named = addresses(value);
	return named.length > 0 ? named : [DEFAULT_CONTACT_TO];
}

/** A variable's addresses: one, or several split by commas; none when unset. */
function addresses(value: string | undefined): string[] {
	return (value ?? "")
		.split(",")
		.map((address) => address.trim())
		.filter(Boolean);
}

const TEXT_LIMITS: Record<"text" | "email" | "phone", number> = {
	text: 200,
	email: 320,
	phone: 40,
};
const LIST_LIMIT = 20;
/** The most one choice of a list may hold. */
const CHOICE_LIMIT = 100;
const ADDRESS_PARTS: [keyof Address, string, number][] = [
	["street", "The street", 200],
	["city", "The city", 100],
	["state", "The state", 40],
	["zip", "The ZIP", 20],
];

/** The most of the subject's words it carries before it is cut. */
export const SUBJECT_LIMIT = 120;

/**
 * Words for an email's subject: control characters (a CR or LF above all,
 * which would break the header) become spaces, runs of space collapse, and
 * anything past SUBJECT_LIMIT is cut at it with an ellipsis.
 */
export function subjectText(value: string): string {
	const flat = value
		.replace(/\p{Cc}+/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
	// Counted and cut by character, never by code unit, so a pictograph at
	// the cut is kept whole or dropped whole.
	const characters = Array.from(flat);
	if (characters.length <= SUBJECT_LIMIT) return flat;
	return `${characters
		.slice(0, SUBJECT_LIMIT - 1)
		.join("")
		.trimEnd()}\u2026`;
}

/**
 * A field's words, trimmed. Anything that is not a string (a number, an
 * object, a list) reads as empty, so it is never written into an email as
 * "[object Object]", and a required field holding one is refused as missing.
 */
function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** How many characters a visitor would count, a pictograph being one. */
function count(value: string): number {
	return Array.from(value).length;
}

/** The address, or none when no part of it was written. */
function readAddress(value: unknown): Address | null {
	if (!isRecord(value)) return null;
	const address = {
		street: text(value.street),
		city: text(value.city),
		state: text(value.state),
		zip: text(value.zip),
	};
	// A state alone is a select's default, not an address anyone wrote.
	return address.street || address.city || address.zip ? address : null;
}

/** A refusal, in the visitor's words. */
type Refusal = string;

/**
 * One field read from the body, or the reason the submission is refused.
 * `offList` marks a choice whose answer was not on its list and was read as
 * not given.
 */
function readField(
	field: ContactField,
	raw: unknown,
): { value: FieldValue; offList?: true } | { refusal: Refusal } {
	const kind = field.kind ?? "text";
	if (kind === "checkbox") return { value: typeof raw === "boolean" ? raw : null };
	if (kind === "choice") {
		// A tab left open across an edit to the list can send an answer the
		// list no longer holds: it is read as not given, never refused, so a
		// visitor never loses a message over a question about how they heard.
		const answer = text(raw);
		if (!answer) return { value: "" };
		// The options are compared trimmed, as the answer is, so an option
		// written with a stray space still matches; the trimmed one is kept.
		const option = field.options?.map((one) => one.trim()).find((one) => one === answer);
		if (option !== undefined) return { value: option };
		return { value: "", offList: true };
	}
	if (kind === "address") {
		const address = readAddress(raw);
		const over = address && ADDRESS_PARTS.find(([part, , limit]) => address[part].length > limit);
		if (over) return { refusal: `${over[1]} is over ${over[2]} characters.` };
		return { value: address };
	}
	if (kind === "list") {
		// The length is checked before the list is read, and a list holding
		// anything but words is not what a form sends.
		const listed: unknown[] = Array.isArray(raw) ? raw : [];
		const limit = field.limit ?? LIST_LIMIT;
		if (listed.length > limit) return { refusal: `${field.label}: choose ${limit} or fewer.` };
		if (listed.some((choice) => typeof choice !== "string")) {
			return { refusal: `${field.label}: each choice must be text.` };
		}
		const choices = listed.map(text).filter(Boolean);
		if (choices.some((choice) => count(choice) > CHOICE_LIMIT)) {
			return { refusal: `${field.label}: a choice is over ${CHOICE_LIMIT} characters.` };
		}
		return { value: choices };
	}
	const words = text(raw);
	const limit = field.limit ?? TEXT_LIMITS[kind];
	if (count(words) > limit) return { refusal: `${field.label} is over ${limit} characters.` };
	if (kind === "email" && words && !EMAIL_PATTERN.test(words)) {
		return { refusal: `${field.label} is not an email address we can write to.` };
	}
	return { value: words };
}

/** Whether a field holds nothing a required field must hold. */
function isMissing(field: ContactField, value: FieldValue): boolean {
	const kind = field.kind ?? "text";
	if (kind === "checkbox") return value !== true;
	if (kind === "list") return !Array.isArray(value) || value.length === 0;
	if (kind === "address") {
		const address = value as Address | null;
		return !address || ADDRESS_PARTS.some(([part]) => !address[part]);
	}
	if (kind === "phone") return typeof value !== "string" || toE164(value) === null;
	return !value;
}

/** "name", "name and email", "name, email, and message". */
function wordList(words: string[]): string {
	if (words.length <= 2) return words.join(" and ");
	return `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]}`;
}

/**
 * Reads the listed fields from a body. A key the site did not list is never
 * read. `checkRequired` false (a canary, which sends the plain form's four
 * fields whatever the site's form asks) skips the required check and keeps
 * every other one. `offList` names each choice whose answer was not on its
 * list, read as not given.
 */
export function readFields(
	body: Record<string, unknown>,
	fields: ContactField[],
	checkRequired = true,
): { fields: ContactFields; offList: string[] } | { refusal: Refusal } {
	const read: ContactFields = {};
	const offList: string[] = [];
	for (const field of fields) {
		const result = readField(field, body[field.key]);
		if ("refusal" in result) return result;
		read[field.key] = result.value;
		if (result.offList) offList.push(field.key);
	}
	if (checkRequired) {
		// A choice answered off its list was answered, by a form showing an
		// older list, so it is never refused as missing.
		const missing = fields.filter(
			(field) =>
				field.required && !offList.includes(field.key) && isMissing(field, read[field.key] ?? null),
		);
		// A phone that is there but cannot be dialed gets its own words.
		const undialable = missing.find(
			(field) => field.kind === "phone" && typeof read[field.key] === "string" && read[field.key],
		);
		if (undialable && missing.length === 1) {
			return { refusal: "Please add a phone number we can call." };
		}
		if (missing.length > 0) {
			const labels = missing.map((field) => field.label.toLowerCase());
			return { refusal: `Please fill in your ${wordList(labels)}.` };
		}
	}
	return { fields: read, offList };
}

/**
 * The office's email: an `Email` whose reply goes to one address, the
 * visitor's, as it always has. `Email.replyTo` took a list in 9.2.0 for the
 * receipt; this stays a string, so code that read it as one still compiles.
 */
export type OfficeEmail = Omit<Email, "replyTo"> & { replyTo?: string };

/** The footer line of a submission the guard could not vouch for. */
export const UNCHECKED_LINE = "This one was not checked for spam.";

/** The first email field's address, when the submission holds one. */
function visitorAddress(read: ContactFields, fields: ContactField[]): string | undefined {
	const field = fields.find((one) => one.kind === "email" && read[one.key]);
	return field ? String(read[field.key]) : undefined;
}

/**
 * The office's email: who wrote, a table of what they sent in the order the
 * site listed it, then the message. The `name` field is the heading and the
 * `message` field the body; every other shown field that holds something is
 * a row, and an empty one that names `blank` words prints them. A reply
 * goes to the first email field's address. `checked` false (a guard that
 * could not answer) adds a line to the footer saying so.
 */
export function officeEmail(
	read: ContactFields,
	fields: ContactField[],
	options: { subject?: string[]; canary?: boolean; checked?: boolean } = {},
): OfficeEmail {
	const name = shownWords(read, fields, "name");
	const message = shownWords(read, fields, "message");
	const messageLabel = fields.find((field) => field.key === "message")?.label ?? "Message";
	const rows = fieldRows(read, fields, { blank: true });

	// A key the site did not list was never read, so it holds nothing here.
	const topic = (options.subject ?? ["topic"]).map((key) => words(read[key] ?? null)).find(Boolean);
	const subject = `${options.canary ? "[Canary] " : ""}Website inquiry: ${subjectText(topic ?? "") || "General"}`;

	const replyTo = visitorAddress(read, fields);
	const unchecked = options.checked === false;

	const html = `
		<div style="font-family: ${LOOK.font}; color: ${LOOK.ink}; line-height: 1.6;">
			${name ? `<p style="margin: 0 0 12px; font-size: 18px;"><strong>${escapeHTML(name)}</strong></p>` : ""}
			${rowsTable(rows)}
			${message ? `<p style="margin: 0 0 4px; color: ${LOOK.quiet};">${escapeHTML(messageLabel)}</p><p style="white-space: pre-wrap; margin: 0;">${escapeHTML(message)}</p>` : ""}
			<p style="margin: 24px 0 0; font-size: 12px; color: ${LOOK.faint};">Sent from the website contact form.${replyTo ? " Reply goes straight to the sender." : ""}${unchecked ? ` ${UNCHECKED_LINE}` : ""}</p>
		</div>`;
	const plain = [
		...(name ? [name] : []),
		...rows.map((one) => one.text),
		...(message ? ["", `${messageLabel}:`, message] : []),
		...(unchecked ? ["", UNCHECKED_LINE] : []),
	].join("\n");

	return { subject, html, text: plain, replyTo };
}

function json(status: number, body: Record<string, unknown>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * An unset variable is a fault on the production deploy alone. A preview
 * built before its keys are set answers every submission 500 by design, and
 * reporting each one would bury the reports that matter.
 */
function isProduction(): boolean {
	return process.env.VERCEL_ENV === "production";
}

/**
 * Whether two secrets are the same, in time that does not depend on where
 * they first differ, so the canary's token cannot be felt out by timing.
 */
function sameSecret(given: string, secret: string): boolean {
	const encoder = new TextEncoder();
	const a = encoder.encode(given);
	const b = encoder.encode(secret);
	let difference = a.length ^ b.length;
	for (let index = 0; index < b.length; index++) {
		difference |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index] ?? 0);
	}
	return difference === 0;
}

/**
 * The keys `ContactForm` sends when a site turns on one of its opt in
 * fields. One of these arriving unlisted is a site whose form and function
 * disagree, which is reported; any other unlisted key is a stranger's and
 * is ignored without a word.
 */
const FORM_KEYS = ["firstName", "lastName", "phone", "address", "services", "consent", "source"];

/**
 * The keys the endpoint reads for itself: `company` is the honeypot, whose
 * any value drops the submission, `canary` carries the canary's token, and
 * `turnstile` the guard's token. A site's field under any of them would be
 * lost without a word.
 */
export const RESERVED_KEYS = ["company", "canary", TURNSTILE_TOKEN_KEY];

/** The words a visitor reads when the guard refused the submission. */
export const GUARD_REFUSAL =
	"We could not confirm this came from a person. Please call us instead.";

/**
 * The longest the endpoint waits on any guard: the time a guard that names
 * none is held to, and the ceiling on one that names more.
 */
export const DEFAULT_GUARD_BOUND_MS = 3_500;

/** What the endpoint allows beyond the time a guard says it takes. */
const GUARD_GRACE_MS = 500;

/**
 * The guard's verdict, held to what the guard says its one try takes and
 * half a second more, never past 3.5 seconds, since a site may pass its own
 * guard: a cutoff, and a throw, are read as a guard that could not answer.
 */
async function ask(
	guard: Guard,
	token: string,
	id: string,
	request: Request,
): Promise<GuardVerdict> {
	const bound =
		guard.timeoutMs === undefined
			? DEFAULT_GUARD_BOUND_MS
			: Math.min(guard.timeoutMs + GUARD_GRACE_MS, DEFAULT_GUARD_BOUND_MS);
	try {
		return await within<GuardVerdict>(
			bound,
			() => guard.check(token, { id, request }),
			() => ({
				status: "unanswered",
				cause: new Error(`${guard.name} sent no verdict within ${bound} ms`),
			}),
		);
	} catch (error) {
		return { status: "unanswered", cause: new Error(`${guard.name} threw`, { cause: error }) };
	}
}

/**
 * The handler a site's `api/contact.ts` exports as `POST`. Throws at once,
 * when the function loads, for a field list that names a reserved key, the
 * guard's token key, or the same key twice, for a choice with no options,
 * and for a receipt with no guard: a mistake in a site's settings should
 * stop its tests and its first request, never lose a visitor's words
 * quietly, and a receipt is only ever sent behind a guard.
 */
export function createContact(options: ContactOptions): (request: Request) => Promise<Response> {
	const fields = options.fields ?? PLAIN_FIELDS;
	const keys = fields.map((field) => field.key);
	const reserved = keys.find((key) => RESERVED_KEYS.includes(key));
	if (reserved) {
		throw new Error(
			`createContact: "${reserved}" is a key the endpoint reads for itself (${RESERVED_KEYS.join(", ")}); give the field another key`,
		);
	}
	const { guard, receipt } = options;
	if (guard && keys.includes(guard.tokenKey)) {
		throw new Error(
			`createContact: "${guard.tokenKey}" is the key the guard's token arrives under; give the field another key`,
		);
	}
	const twice = keys.find((key, index) => keys.indexOf(key) !== index);
	if (twice) throw new Error(`createContact: the field "${twice}" is listed twice`);
	const bare = fields.find((field) => field.kind === "choice" && !field.options?.length);
	if (bare) throw new Error(`createContact: the choice "${bare.key}" lists no options`);
	if (receipt && !guard) {
		throw new Error(
			"createContact: a receipt is only ever sent behind a guard; name one (turnstileGuard()) or drop the receipt",
		);
	}
	const tags = { route: options.route ?? "contact" };

	return withErrorReporting(
		async (request: Request): Promise<Response> => {
			let data: unknown;
			try {
				data = await request.json();
			} catch {
				return json(400, { ok: false, error: "Invalid request body." });
			}
			// A body of JSON that is not an object (null, a number, a list) is as
			// malformed as one that does not parse, and must not reach the field
			// reads below.
			if (!isRecord(data)) return json(400, { ok: false, error: "Invalid request body." });

			// Honeypot: a bot that fills it gets the same quiet success a real
			// send without a receipt gets, so it never adapts. It is caught
			// before the guard, so a bot that fills it costs no check.
			// ContactForm runs the same predicate to keep the catch out of the
			// lead event.
			if (isHoneypotFilled(data.company)) return json(200, { ok: true, receipt: false });

			const canaryToken = process.env.CONTACT_CANARY_TOKEN;
			const canary =
				Boolean(canaryToken) && sameSecret(String(data.canary ?? ""), canaryToken ?? "");
			const id = crypto.randomUUID();

			// The fields first: a submission about to be refused for what was
			// written costs no check and spends no token.
			const read = readFields(data, fields, !canary);
			if ("refusal" in read) return json(400, { ok: false, error: read.refusal });

			// The guard: a canary skips it, since a token cannot be made without
			// a browser. A check that answers no refuses the submission before
			// any destination sees it; one that cannot answer lets it through,
			// marked unchecked so no receipt goes out, and is reported.
			let checked: boolean | undefined;
			if (guard && !canary) {
				const token = data[guard.tokenKey];
				const verdict = await ask(guard, typeof token === "string" ? token : "", id, request);
				if (verdict.status === "failed") {
					return json(403, { ok: false, code: "guard", error: GUARD_REFUSAL });
				}
				checked = verdict.status === "passed";
				// A missing token is quiet: the form reported a real visitor whose
				// browser could not run the check, and a bot that leaves it out
				// would otherwise file a report for every submission.
				if (
					verdict.status === "unanswered" &&
					!verdict.quiet &&
					(!verdict.unset || isProduction())
				) {
					reportServerErrorLater(
						new Error(
							`Form guard: ${guard.name} could not answer, and the submission was let through: ${scrub(verdict.cause.message)}`,
							{ cause: verdict.cause },
						),
						{ request, tags: { ...tags, guard: guard.name, reason: "guard-unanswered" } },
					);
				}
			}

			// A choice answered off its list was read as not given. The visitor
			// is never refused for it, and the practice hears that the form and
			// the list disagree.
			if (read.offList.length > 0 && isProduction()) {
				for (const key of read.offList) {
					reportServerErrorLater(
						new Error(
							`Contact form sent a ${key} answer that is not on its list, and it was recorded as not given`,
						),
						{ request, tags },
					);
				}
			}

			// The form sent a field this function does not list, so the office
			// and every destination would never see it. The submission goes on,
			// and the practice hears that the list is short.
			const unlisted = FORM_KEYS.filter((key) => key in data && !keys.includes(key));
			if (unlisted.length > 0 && isProduction()) {
				reportServerErrorLater(
					new Error(
						`Contact form sends ${unlisted.join(", ")}, which the endpoint's fields do not list, so it is dropped`,
					),
					{ request, tags },
				);
			}

			// The form runs the spam check and the function names no guard, so
			// every token goes unread. The submission goes on, and the practice
			// hears that the check is on in one half alone.
			const token = data[TURNSTILE_TOKEN_KEY];
			if (!guard && typeof token === "string" && token && isProduction()) {
				reportServerErrorLater(
					new Error(
						"Contact form sends a spam check token and the endpoint names no guard, so nothing is checked",
					),
					{ request, tags },
				);
			}

			const apiKey = process.env.RESEND_API_KEY;
			const to = recipients(process.env.CONTACT_TO);
			const others = canary ? [] : (options.destinations ?? []);
			if (!apiKey) {
				if (isProduction()) {
					reportServerErrorLater(new Error("Contact form not configured: RESEND_API_KEY unset"), {
						request,
						tags,
					});
				}
				// With no key there is no email to send, but a destination beside
				// it is independent of it and still gets the submission.
				if (others.length === 0) {
					return json(500, { ok: false, error: "The contact form isn't configured yet." });
				}
			}
			const canaryTo = addresses(process.env.CONTACT_CANARY_TO);
			if (canary && canaryTo.length === 0) {
				if (isProduction()) {
					reportServerErrorLater(
						new Error("Contact canary not configured: CONTACT_CANARY_TO unset"),
						{ request, tags },
					);
				}
				return json(500, { ok: false, error: "The contact canary isn't configured yet." });
			}

			const email = !apiKey
				? null
				: resendDestination<ContactFields>({
						apiKey,
						from: options.from,
						to: canary ? canaryTo : to,
						timeoutMs: options.emailTimeoutMs,
						compose: (submission) =>
							officeEmail(submission.fields, fields, {
								subject: options.subject,
								canary,
								checked: submission.checked,
							}),
					});
			const submission: Submission<ContactFields> = {
				id,
				fields: read.fields,
				...(checked !== undefined && { checked }),
			};
			// A canary proves the email and nothing else: no other destination
			// ever sees one.
			const destinations = [...(email ? [email] : []), ...others];
			const result = await relay(submission, destinations, {
				retryWaitMs: options.retryWaitMs,
				deadlineMs: options.deadlineMs,
				request,
				tags,
			});

			if (!result.taken) {
				return json(502, { ok: false, error: "Sending failed. Please try again in a moment." });
			}
			if (canary) {
				const sent = result.legs[0]?.result;
				const id = sent && sent.status !== "failed" ? (sent.reference ?? null) : null;
				return json(200, { ok: true, id, to: to.join(", ") });
			}

			// The receipt: only behind a guard that passed, never for a canary,
			// and only once a destination took the submission, so it never goes
			// to an address a bot typed and never promises a message nobody has.
			const address = visitorAddress(read.fields, fields);
			let sentReceipt = false;
			if (receipt && checked === true && apiKey && address) {
				const timeoutMs = receipt.timeoutMs ?? DEFAULT_RECEIPT_TIMEOUT_MS;
				const copy = resendDestination<ContactFields>({
					apiKey,
					from: options.from,
					to: [address],
					name: "receipt",
					timeoutMs,
					compose: (taken) =>
						receiptEmail(taken.fields, fields, { ...receipt, from: options.from, replyTo: to }),
				});
				// One try, its own idempotency key, cut off at its limit.
				const answer = await within<DestinationResult>(
					timeoutMs,
					(signal) =>
						copy
							.send({ id: `${id}-receipt`, fields: read.fields }, { signal, attempt: 1 })
							.catch((error: unknown) => down(error)),
					() => down(new Error(`receipt sent no answer within ${timeoutMs} ms`)),
				);
				sentReceipt = answer.status !== "failed";
				if (answer.status === "failed") {
					reportServerErrorLater(
						new Error(
							`Form receipt: the copy to the visitor was not sent, though the submission was: ${scrub(answer.cause.message)}`,
							{ cause: answer.cause },
						),
						{ request, tags: { ...tags, reason: "receipt" } },
					);
				}
			}
			return json(200, { ok: true, receipt: sentReceipt });
		},
		{ tags },
	);
}
