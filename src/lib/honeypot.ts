/**
 * The contact form's honeypot. Humans never see the "company" field, so any
 * value in it marks a bot. The relay a site runs (its api/contact.ts) drops
 * such a submission behind the same quiet success a real send gets, so the
 * bot learns nothing, and ContactForm, holding the value it just sent, skips
 * the lead event that success would otherwise earn. A site's relay applies
 * this same predicate, so the two never disagree about a bot.
 */
export function isHoneypotFilled(value: unknown): boolean {
	return String(value ?? "").trim() !== "";
}
