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
const EXTENSION = /\s*(?:,|;|#|x|ext\.?|extension)\s*\d+\s*$/i;

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
