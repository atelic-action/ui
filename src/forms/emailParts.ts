/**
 * The pieces the office's email and the visitor's receipt are both made of:
 * the look the two share, a field's value in words, as a table cell, and as
 * a row. Each has one implementation here, so the two emails never escape
 * or link a visitor's words differently.
 *
 * Built with the gate, beside the contact endpoint that uses it. It is not
 * an entry of its own: `forms/contact` and `forms/receipt` are.
 */
import { toE164 } from "../lib/contactLinks.js";
import { escapeHTML } from "../lib/escapeHTML.js";
import type { Address, ContactField, ContactFields, FieldValue } from "./contact.js";

/**
 * The look both emails wear. Gmail renders inline styles only, no style
 * blocks, so these are written into each element.
 */
export const LOOK = {
	font: "Helvetica, Arial, sans-serif",
	ink: "#211c17",
	quiet: "#6b6257",
	faint: "#9a9084",
};

/** "418 Alder Street, Fairhaven, CO 80000", skipping the empty parts. */
export function addressLine(address: Address): string {
	const place = [address.state, address.zip].filter(Boolean).join(" ");
	return [address.street, address.city, place].filter(Boolean).join(", ");
}

/** A field's value in words, or empty when it holds nothing to show. */
export function words(value: FieldValue): string {
	if (value === null || value === "") return "";
	if (typeof value === "boolean") return value ? "Checked" : "Not checked";
	if (Array.isArray(value)) return value.join(", ");
	if (typeof value === "string") return value;
	return addressLine(value);
}

/** A field's value as the HTML of its table cell: an address or a number to act on is a link. */
export function cell(field: ContactField, value: FieldValue): string {
	const shown = escapeHTML(words(value));
	if (typeof value !== "string") return shown;
	if (field.kind === "email") {
		// The characters that would start a mailto link's own parameters are
		// encoded, so an address can never set the subject or the body of the
		// reply the office opens.
		const address = value.replace(/[?&=#%]/g, (character) => encodeURIComponent(character));
		return `<a href="mailto:${escapeHTML(address)}">${shown}</a>`;
	}
	if (field.kind === "phone") {
		// A number to dial is a link; anything else is the visitor's words alone.
		const number = toE164(value);
		return number ? `<a href="tel:${escapeHTML(number)}">${shown}</a>` : shown;
	}
	return shown;
}

/** One labeled row of an email's table; the value is HTML already escaped. */
export function row(label: string, value: string): string {
	return `<tr><td style="padding: 4px 16px 4px 0; color: ${LOOK.quiet}; vertical-align: top; white-space: nowrap;">${escapeHTML(label)}</td><td style="padding: 4px 0; vertical-align: top;">${value}</td></tr>`;
}

/** A field's words when the site shows it in an email, else empty. */
export function shownWords(read: ContactFields, fields: ContactField[], key: string): string {
	return fields.some((field) => field.key === key && field.show !== false) &&
		typeof read[key] === "string"
		? String(read[key])
		: "";
}

/** One row of an email's table, in HTML and in plain text. */
export interface FieldRow {
	html: string;
	text: string;
}

/**
 * The rows of an email's table: every shown field but the name and the
 * message, in the order the site listed them, each that holds something.
 * With `blank` true, an empty field that names `blank` words prints them
 * (the office's email), unless it is a choice the form did not send at
 * all; without it, an empty field prints no row (the visitor's receipt).
 */
export function fieldRows(
	read: ContactFields,
	fields: ContactField[],
	options: { blank?: boolean } = {},
): FieldRow[] {
	return fields
		.filter((field) => field.show !== false && field.key !== "name" && field.key !== "message")
		.flatMap((field) => {
			const value = read[field.key] ?? null;
			if (words(value) !== "") {
				return [
					{ html: row(field.label, cell(field, value)), text: `${field.label}: ${words(value)}` },
				];
			}
			// Blank words stand for a field the form sent empty; a choice the
			// form did not send at all (null) prints nothing.
			if (options.blank && field.blank && !(field.kind === "choice" && value === null)) {
				return [
					{
						html: row(field.label, escapeHTML(field.blank)),
						text: `${field.label}: ${field.blank}`,
					},
				];
			}
			return [];
		});
}

/** The rows as the HTML table both emails set them in. */
export function rowsTable(rows: FieldRow[]): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 20px;">${rows.map((one) => one.html).join("")}</table>`;
}
