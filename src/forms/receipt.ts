/**
 * The visitor's receipt: a short email back to whoever wrote, saying the
 * message arrived, with replies going to the office. The contact endpoint
 * sends it when a site turns it on (`receipt`), only behind a guard that
 * passed, and only once a destination took the submission, so a receipt
 * never goes to an address a bot typed and never promises a message nobody
 * has.
 *
 * By default it carries nothing the visitor wrote. The address it goes to
 * is whatever was typed into the form, so a receipt that repeated the
 * visitor's words would let anyone who solves the challenge send their own
 * text, under the business's name, to any inbox: an open relay. A solved
 * challenge proves a browser, not that the address belongs to the person
 * who typed it. `copy: true` adds the name and what was sent, for a site
 * that accepts that.
 *
 * Built with the gate (`@atelic-action/ui/forms/receipt`): plain TypeScript,
 * no React, relative imports carrying `.js`.
 */
import { escapeHTML } from "../lib/escapeHTML.js";
import type { ContactField, ContactFields } from "./contact.js";
import { fieldRows, LOOK, rowsTable, shownWords } from "./emailParts.js";
import type { Email } from "./resend.js";

/** A site's words for its receipt, each with a neutral default. */
export interface ReceiptOptions {
	/**
	 * Whether the receipt repeats what the visitor wrote: the greeting by
	 * name, a table of what was sent, and the message. Defaults to false,
	 * when the receipt holds nothing the visitor wrote, only the site's own
	 * words. The address is whatever was typed, so a copy would let anyone
	 * who solves the challenge send their own words, under the business's
	 * name, to any inbox. Turn it on only when that is acceptable.
	 */
	copy?: boolean;
	/** The subject. Defaults to "We have your message". */
	subject?: string;
	/** The line saying what happens next. Defaults to "Someone from our office will be in touch soon." */
	next?: string;
	/** The name it is signed with. Defaults to the display name of the endpoint's `from`. */
	signature?: string;
	/** How long the one try may take, in milliseconds. Defaults to 3000. */
	timeoutMs?: number;
}

export const DEFAULT_RECEIPT_SUBJECT = "We have your message";
export const DEFAULT_RECEIPT_NEXT = "Someone from our office will be in touch soon.";
export const DEFAULT_RECEIPT_TIMEOUT_MS = 3_000;

/**
 * The display name of a sender written `Display Name <address>`, its quotes
 * taken off. Empty for a bare address, which has no name to sign with.
 */
export function displayName(from: string): string {
	const match = from.match(/^\s*(.*?)\s*<[^>]*>\s*$/);
	return (match?.[1] ?? "").replace(/^"(.*)"$/, "$1").trim();
}

/**
 * Who the receipt greets: the `firstName` field when the site lists one and
 * it holds something, else the `name` field, else no one.
 */
function greetingName(read: ContactFields, fields: ContactField[]): string {
	for (const key of ["firstName", "name"]) {
		const value = read[key];
		if (fields.some((field) => field.key === key) && typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}
	return "";
}

/**
 * The receipt. By default, the site's words alone: "We have your message.",
 * what happens next, and the signature. With `copy`, the greeting names the
 * visitor, and a table of what was sent in the site's order (the name and
 * the message aside, and no row for a field left empty) and the message
 * follow, everything the visitor wrote escaped as the office's email
 * escapes it, by the same code. `replyTo` is the office's inboxes.
 */
export function receiptEmail(
	read: ContactFields,
	fields: ContactField[],
	options: ReceiptOptions & { from: string; replyTo?: string[] },
): Email {
	const copy = options.copy === true;
	const name = copy ? greetingName(read, fields) : "";
	const greeting = name ? `We have your message, ${name}.` : "We have your message.";
	const next = options.next ?? DEFAULT_RECEIPT_NEXT;
	const signature = options.signature ?? displayName(options.from);
	const rows = copy ? fieldRows(read, fields) : [];
	const message = copy ? shownWords(read, fields, "message") : "";
	const messageLabel = fields.find((field) => field.key === "message")?.label ?? "Message";

	const html = `
		<div style="font-family: ${LOOK.font}; color: ${LOOK.ink}; line-height: 1.6;">
			<p style="margin: 0 0 12px; font-size: 18px;"><strong>${escapeHTML(greeting)}</strong></p>
			<p style="margin: 0 0 20px;">${escapeHTML(next)}</p>
			${rows.length > 0 || message ? `<p style="margin: 0 0 8px; color: ${LOOK.quiet};">What you sent</p>` : ""}
			${rows.length > 0 ? rowsTable(rows) : ""}
			${message ? `<p style="margin: 0 0 4px; color: ${LOOK.quiet};">${escapeHTML(messageLabel)}</p><p style="white-space: pre-wrap; margin: 0;">${escapeHTML(message)}</p>` : ""}
			${signature ? `<p style="margin: 24px 0 0;">${escapeHTML(signature)}</p>` : ""}
		</div>`;
	const plain = [
		greeting,
		"",
		next,
		...(rows.length > 0 || message ? ["", "What you sent"] : []),
		...rows.map((one) => one.text),
		...(message ? ["", `${messageLabel}:`, message] : []),
		...(signature ? ["", signature] : []),
	].join("\n");

	return {
		subject: options.subject ?? DEFAULT_RECEIPT_SUBJECT,
		html,
		text: plain,
		replyTo: options.replyTo,
	};
}
