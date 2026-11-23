/**
 * Whether a phone number or an email address is well formed enough to link.
 * One check each, shared by the contact form (what it accepts) and the link
 * primitives (what they link), so the two never disagree. Light by design:
 * the build guard checks a site's configured numbers against Google's full
 * numbering plan (`checkSiteContacts`, in the scripts); a page carries none
 * of that.
 */

/** An email address: something, an @, something, a dot, something; no spaces. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether an address is one to send to, ignoring the space around it. */
export function isEmail(value: string): boolean {
	return EMAIL_PATTERN.test(value.trim());
}

/** A number in E.164: a + and 8 to 15 digits, never opening on 0. */
export function isE164(value: string): boolean {
	return /^\+[1-9]\d{7,14}$/.test(value);
}

/** An extension after the number ("x12", "ext. 12", "extension 12"), which no dialer takes in E.164. */
export const EXTENSION = /\s*(?:,|;|#|x|ext\.?|extension)\s*\d+\s*$/i;

/**
 * A typed number in E.164, or null when it is not one to dial. A number
 * typed with a + keeps its country code; ten digits, typed any common way,
 * take the North American +1 (an area code never opens on 0 or 1); eleven
 * that open on 1 take the +. An extension is dropped, so the link dials the
 * main line while the words still show it. Anything else, letters included,
 * is null.
 */
export function toE164(value: string): string | null {
	const number = value.trim().replace(EXTENSION, "");
	if (!number || /[^\d\s().+-]/.test(number) || number.lastIndexOf("+") > 0) return null;
	const digits = number.replace(/\D/g, "");
	if (number.startsWith("+")) {
		const e164 = `+${digits}`;
		return isE164(e164) ? e164 : null;
	}
	if (/^[2-9]\d{9}$/.test(digits)) return `+1${digits}`;
	if (/^1[2-9]\d{9}$/.test(digits)) return `+${digits}`;
	return null;
}

/** The keypad digit each letter dials, as a phone's keypad prints them. */
const KEYPAD: Record<string, string> = Object.fromEntries(
	["ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"].flatMap((letters, at) =>
		[...letters].map((letter) => [letter, String(at + 2)]),
	),
);

/**
 * A number's digits, its letters dialed as the keypad prints them, for a
 * vanity number ("1-800-FLOWERS" dials 18003569377). Only letters that are
 * part of the number are dialed: those in a run that also holds a digit or
 * a hyphen ("800-FLOWERS"), or a word in capitals beside the digits ("1 800
 * FLOWERS"). Any other word ("Call", "(cell)") is words, and text with no
 * digit at all dials nothing.
 */
export function keypadDigits(value: string): string {
	if (!/\d/.test(value)) return "";
	return value
		.split(/\s+/)
		.map((run) => {
			const letters = run.replace(/[^A-Za-z]/g, "");
			const partOfNumber =
				/[\d-]/.test(run) || (letters.length > 1 && letters === letters.toUpperCase());
			return partOfNumber
				? run.toUpperCase().replace(/[A-Z]/g, (letter) => KEYPAD[letter] ?? "")
				: run;
		})
		.join(" ")
		.replace(/\D/g, "");
}

/**
 * What a dialer can still take from a typed number `toE164` cannot read:
 * its digits, a vanity number's letters dialed as the keypad prints them,
 * its extension dropped and a typed leading + kept. Null when there is no
 * digit to dial.
 */
export function dialable(value: string): string | null {
	const number = value.trim().replace(EXTENSION, "");
	const digits = keypadDigits(number);
	if (!digits) return null;
	return number.startsWith("+") ? `+${digits}` : digits;
}
