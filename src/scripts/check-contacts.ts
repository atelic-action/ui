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
 * It is sure of what it judges: phones by their shape (an `e164` beside a
 * `display`), addresses only at the config's known paths, and `tel:` and
 * `mailto:` hrefs anywhere, so a site's words are never mistaken for a
 * contact and a valid site never fails.
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
 * The config's known email addresses, by path from the walk's root (a
 * `SiteConfig` or an `ArtifactConfig`). A string is judged as an address
 * only here or as a `mailto:` href, never by its key's name alone, so words
 * such as a label reading "Email" are left alone.
 */
const EMAIL_PATHS = new Set([
	"email",
	"gate.contactEmail",
	"contactEmail",
	"analytics.identify.email",
]);

/**
 * A `tel:` href's number, with RFC 3966's visual separators (- . ( ) and
 * spaces) and any parameters (";ext=12") taken out.
 */
const telNumber = (href: string) =>
	href
		.slice("tel:".length)
		.split(";")[0]
		?.replace(/[-.()\s]/g, "") ?? "";

/** A percent encoded address, decoded; one too malformed to decode, as given. */
function decoded(address: string): string {
	try {
		return decodeURIComponent(address);
	} catch {
		return address;
	}
}

/**
 * Every problem with the numbers and addresses in `value`, each naming its
 * field (`site.header.phones[1].display`), empty when all is sound. Judges
 * only what it is sure is a contact:
 *
 * - a phone is any object holding a string `e164` and `display` (the
 *   package's `Phone`, `HeaderPhone`, `ContactPhone`) or `phoneE164` and
 *   `phoneDisplay` (a `Locations` entry), wherever it sits: the number must
 *   be valid in E.164 for its country and the display must read as it;
 * - an address is a string at one of the config's known address paths
 *   (`email`, `gate.contactEmail`, `analytics.identify.email`);
 * - a `tel:` href must reduce, separators aside, to a valid number, and a
 *   `mailto:` href must write to an address.
 *
 * A value seen twice (a config that refers to itself) is walked once.
 */
export function contactProblems(value: unknown, path = "site"): string[] {
	return walk(value, path, "", new WeakSet());
}

function walk(value: unknown, path: string, at: string, seen: WeakSet<object>): string[] {
	if (typeof value === "object" && value !== null) {
		if (seen.has(value)) return [];
		seen.add(value);
	}
	if (Array.isArray(value)) {
		return value.flatMap((item, index) => walk(item, `${path}[${index}]`, at, seen));
	}
	if (!isRecord(value)) return [];
	const problems: string[] = [];
	for (const [e164Key, displayKey] of [
		["e164", "display"],
		["phoneE164", "phoneDisplay"],
	] as const) {
		const e164 = value[e164Key];
		const display = value[displayKey];
		if (typeof e164 === "string" && typeof display === "string") {
			const problem = phoneProblem(e164, display);
			if (problem) problems.push(`${path}: ${problem}`);
		}
	}
	for (const [key, item] of Object.entries(value)) {
		const field = `${path}.${key}`;
		const where = at ? `${at}.${key}` : key;
		if (typeof item !== "string") {
			// An array keeps its parent's place: header.phones[0] is under header.phones.
			problems.push(...walk(item, field, where, seen));
			continue;
		}
		if (EMAIL_PATHS.has(where) && !isEmail(item)) {
			problems.push(`${field}: "${item}" is not an email address`);
		}
		if (item.startsWith("tel:")) {
			const number = parsePhoneNumber(telNumber(item));
			if (!number?.isValid()) problems.push(`${field}: "${item}" does not dial a valid number`);
		}
		if (item.startsWith("mailto:")) {
			const address = item.slice("mailto:".length).split("?")[0] ?? "";
			if (!isEmail(decoded(address))) {
				problems.push(`${field}: "${item}" does not write to an address`);
			}
		}
	}
	return problems;
}
