import { type AnchorHTMLAttributes, isValidElement, type ReactNode } from "react";
import { dialable, toE164 } from "../lib/contactLinks";
import type { Phone } from "../types";

export interface PhoneLinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "children"> {
	/**
	 * The number: the site's phone (`e164` and `display`), or a number as a
	 * visitor typed it, which is read into E.164 (`toE164`).
	 */
	phone: Pick<Phone, "e164" | "display"> | string;
	/** The visible words; the number as displayed, or as typed, when left out. */
	children?: ReactNode;
}

const warned = new Set<string>();

/** Says once, in development only, that a number was left unlinked. */
function warnOnce(number: string) {
	if (!import.meta.env?.DEV || warned.has(number)) return;
	warned.add(number);
	console.warn(`[atelic-ui] "${number}" is not a number to dial; it is shown without a tel: link.`);
}

/** Whether a value holds a digit to dial. */
const hasDigits = (value: string) => /\d/.test(value);

/**
 * The `tel:` href for a number, the one place it is built. A configured
 * phone links its `e164` exactly as given, as every link drew it before
 * 8.5.0: the browser is never stricter than it was, and a loose `e164` is
 * the build guard's to catch (`contactProblems`). A typed number is read
 * into E.164 (`toE164`), or failing that dials what a dialer can take
 * (`dialable`: the digits, a typed + kept, an extension dropped). Either
 * with no digit at all has no href (8.6.0), so nothing draws a call that
 * dials nothing.
 */
export function phoneHref(phone: Pick<Phone, "e164"> | string): string | undefined {
	if (typeof phone !== "string") {
		return hasDigits(phone.e164 ?? "") ? `tel:${phone.e164}` : undefined;
	}
	const number = toE164(phone) ?? dialable(phone);
	return number ? `tel:${number}` : undefined;
}

/** The words a node shows, gathered through its elements; an icon alone shows none. */
function textOf(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join("");
	if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
	return "";
}

/**
 * A phone number as a link that dials it (Component Rules 17), the one way
 * the package draws one. It never opens a new tab (Component Rules 12). Its
 * href is `phoneHref`'s. A number with no digit to dial is shown as plain
 * words rather than a dead link, with a warning in development, and as
 * nothing at all when it has no words to show (an icon alone).
 */
export function PhoneLink({ phone, children, className, ...anchor }: PhoneLinkProps) {
	const href = phoneHref(phone);
	const words = children ?? (typeof phone === "string" ? phone : phone.display);
	if (!href) {
		warnOnce(typeof phone === "string" ? phone : phone.e164);
		return textOf(words).trim() ? <span className={className}>{words}</span> : null;
	}
	return (
		<a className={className} href={href} {...anchor}>
			{words}
		</a>
	);
}
