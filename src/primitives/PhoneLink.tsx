import type { AnchorHTMLAttributes, ReactNode } from "react";
import { isE164, toE164 } from "../lib/contactLinks";
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

/** The `tel:` href for a number, or undefined when it is not one to dial. The one place it is built. */
export function phoneHref(phone: Pick<Phone, "e164"> | string): string | undefined {
	const e164 = typeof phone === "string" ? toE164(phone) : isE164(phone.e164) ? phone.e164 : null;
	return e164 ? `tel:${e164}` : undefined;
}

/**
 * A phone number as a link that dials it (Component Rules 17), the one way
 * the package draws one. It never opens a new tab (Component Rules 12). A
 * number that is not one to dial (an `e164` that is not E.164, a typed
 * number that cannot be read into one) is shown as plain words rather than
 * a dead link, with a warning in development.
 */
export function PhoneLink({ phone, children, className, ...anchor }: PhoneLinkProps) {
	const href = phoneHref(phone);
	const words = children ?? (typeof phone === "string" ? phone : phone.display);
	if (!href) {
		warnOnce(typeof phone === "string" ? phone : phone.e164);
		return <span className={className}>{words}</span>;
	}
	return (
		<a className={className} href={href} {...anchor}>
			{words}
		</a>
	);
}
