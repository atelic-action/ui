/**
 * The build time check on a site's phone numbers and email addresses: every
 * number the package draws as a link has an `e164` that is a real number
 * for its country, and a `display` that reads as the same number; every
 * address matches the form's pattern. A number that fails ships as a dead or
 * wrong call link on every page, so the build stops and names the field.
 *
 * Google's numbering plan (`libphonenumber-js`, its complete `max` metadata)
 * runs here and in tests only, never in a page: nothing a page bundles
 * imports this file (tst/phone-library-stays-out.test.ts holds that). The
 * browser keeps its light check (`toE164`, `src/lib/contactLinks.ts`).
 *
 * `atelic-check-base-path`, a marketing site's last build step and the one
 * that already reads its config, runs `contactProblems` over the `site`
 * export. A site passing numbers as props outside its config (a contact
 * card's `phones`) calls the same function from its own test:
 *
 *   import { contactProblems } from "@atelic-action/ui/scripts/contacts";
 *   expect(contactProblems({ phones })).toEqual([]);
 */
import parsePhoneNumber from "libphonenumber-js/max";
import { isEmail } from "../lib/contactLinks";

/** The problem with one number, or null when it is sound. */
function phoneProblem(e164: string, display: string): string | null {
	const number = e164.startsWith("+") ? parsePhoneNumber(e164) : undefined;
	if (!number?.isValid() || number.number !== e164) {
		return `e164 "${e164}" is not a valid number in E.164 (a + and the country code, digits only)`;
	}
	const shown = parsePhoneNumber(display, number.country ?? undefined);
	if (shown?.number !== e164) {
		return `display "${display}" does not read as ${e164}`;
	}
	return null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Every problem with the numbers and addresses anywhere in `value`, each
 * naming its field (`site.header.phones[1].display`). Walks the whole
 * value, so it needs no list of where numbers live: a phone is any object
 * with a string `e164` and `display` (the package's `Phone`, `HeaderPhone`,
 * a contact card's line); an address is any string under a key named
 * `email` or ending in `Email`; and a `tel:` or `mailto:` `href` is checked
 * as the number or address it names. Empty when all is sound.
 */
export function contactProblems(value: unknown, path = "site"): string[] {
	if (Array.isArray(value)) {
		return value.flatMap((item, index) => contactProblems(item, `${path}[${index}]`));
	}
	if (!isRecord(value)) return [];
	const problems: string[] = [];
	if (typeof value.e164 === "string" && typeof value.display === "string") {
		const problem = phoneProblem(value.e164, value.display);
		if (problem) problems.push(`${path}: ${problem}`);
	}
	for (const [key, item] of Object.entries(value)) {
		const field = `${path}.${key}`;
		if (typeof item === "string") {
			if ((key === "email" || key.endsWith("Email")) && !isEmail(item)) {
				problems.push(`${field}: "${item}" is not an email address`);
			}
			if (key === "href" && item.startsWith("tel:")) {
				const e164 = item.slice("tel:".length);
				const number = parsePhoneNumber(e164);
				if (!number?.isValid() || number.number !== e164) {
					problems.push(`${field}: "${item}" does not dial a valid number in E.164`);
				}
			}
			if (key === "href" && item.startsWith("mailto:")) {
				const address = item.slice("mailto:".length).split("?")[0] ?? "";
				if (!isEmail(address)) problems.push(`${field}: "${item}" does not write to an address`);
			}
		} else {
			problems.push(...contactProblems(item, field));
		}
	}
	return problems;
}
