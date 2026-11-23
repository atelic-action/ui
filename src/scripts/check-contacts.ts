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
import parsePhoneNumber, {
	type CountryCode,
	isSupportedCountry,
	type PhoneNumber,
} from "libphonenumber-js/max";
import { isEmail, keypadDigits } from "../lib/contactLinks.js";

/** A number read against a country, or undefined when it is not one; never throws. */
function parse(text: string, country: CountryCode): PhoneNumber | undefined {
	try {
		return parsePhoneNumber(text, country);
	} catch {
		return undefined;
	}
}

/**
 * The country a number written without its + is read against: the
 * config's own (`address.country`, a two letter code), else the US, where
 * every site so far does business.
 */
function countryOf(value: unknown): CountryCode {
	const country = isRecord(value) && isRecord(value.address) ? value.address.country : undefined;
	const code = typeof country === "string" ? country.trim().toUpperCase() : "";
	return isSupportedCountry(code) ? code : "US";
}

/** The problem with one number, or null when it is sound. */
function phoneProblem(e164: string, display: string, country: CountryCode): string | null {
	const number = e164.startsWith("+") ? parse(e164, country) : undefined;
	if (!number?.isValid() || number.number !== e164) {
		return `e164 "${e164}" is not a valid number in E.164 (a + and the country code, digits only)`;
	}
	const shown = parse(display, number.country ?? country);
	// A vanity display ("1-800-FLOWERS") reads as its letters dialed on the keypad.
	const vanity = /[A-Za-z]/.test(display)
		? parse(
				`${display.trim().startsWith("+") ? "+" : ""}${keypadDigits(display)}`,
				number.country ?? country,
			)
		: undefined;
	if (shown?.number !== e164 && vanity?.number !== e164) {
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
 * A `tel:` href's number, decoded, with RFC 3966's visual separators (- .
 * ( ) and spaces) and any parameters (";ext=12") taken out.
 */
const telNumber = (href: string) =>
	decoded(href.slice("tel:".length))
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
	return walk(value, path, "", new WeakSet(), countryOf(value));
}

function walk(
	value: unknown,
	path: string,
	at: string,
	seen: WeakSet<object>,
	country: CountryCode,
): string[] {
	if (typeof value === "object" && value !== null) {
		if (seen.has(value)) return [];
		seen.add(value);
	}
	if (Array.isArray(value)) {
		return value.flatMap((item, index) => walk(item, `${path}[${index}]`, at, seen, country));
	}
	// A React element (words a config may hold as JSX) is copy, never a contact.
	if (!isRecord(value) || "$$typeof" in value) return [];
	const problems: string[] = [];
	for (const [e164Key, displayKey] of [
		["e164", "display"],
		["phoneE164", "phoneDisplay"],
	] as const) {
		const e164 = value[e164Key];
		const display = value[displayKey];
		if (typeof e164 === "string" && typeof display === "string") {
			const problem = phoneProblem(e164, display, country);
			if (problem) problems.push(`${path}: ${problem}`);
		}
	}
	for (const [key, item] of Object.entries(value)) {
		const field = `${path}.${key}`;
		const where = at ? `${at}.${key}` : key;
		if (typeof item !== "string") {
			// An array keeps its parent's place: header.phones[0] is under header.phones.
			problems.push(...walk(item, field, where, seen, country));
			continue;
		}
		// An empty address is none (a site without a public one), not a bad one.
		if (EMAIL_PATHS.has(where) && item.trim() && !isEmail(item)) {
			problems.push(`${field}: "${item}" is not an email address`);
		}
		if (item.startsWith("tel:")) {
			// A national number (no +) is read against the config's country, as a
			// dialer reads it; only one that is not a plausible number fails.
			const number = parse(telNumber(item), country);
			if (!number?.isPossible()) problems.push(`${field}: "${item}" does not dial a number`);
		}
		if (item.startsWith("mailto:")) {
			// RFC 6068: one address or several, comma separated, before the query,
			// or in its to= when nothing comes before it.
			const [head = "", query = ""] = item.slice("mailto:".length).split("?");
			const to = decoded(head) || (new URLSearchParams(query).get("to") ?? "");
			if (!to.split(",").every((address) => isEmail(address))) {
				problems.push(`${field}: "${item}" does not write to an address`);
			}
		}
	}
	return problems;
}
