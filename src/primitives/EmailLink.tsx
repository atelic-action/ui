import type { AnchorHTMLAttributes, ReactNode } from "react";
import { isEmail } from "../lib/contactLinks";
import { breakableEmail } from "../lib/emailText";

export interface EmailLinkProps
	extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "children"> {
	email: string;
	/**
	 * The visible words. Left out, the address itself, marked to break after
	 * its @ and before each dot of the domain (`breakableEmail`), never
	 * inside a word.
	 */
	children?: ReactNode;
}

const warned = new Set<string>();

/** Says once, in development only, that an address was left unlinked. */
function warnOnce(email: string) {
	if (!import.meta.env?.DEV || warned.has(email)) return;
	warned.add(email);
	console.warn(
		`[atelic-ui] "${email}" is not an address to write to; it is shown without a mailto: link.`,
	);
}

/** The `mailto:` href for an address, or undefined when it is not one. The one place it is built. */
export function emailHref(email: string): string | undefined {
	return isEmail(email) ? `mailto:${email.trim()}` : undefined;
}

/**
 * An email address as a link that writes to it (Component Rules 17), the
 * one way the package draws one. It never opens a new tab (Component Rules
 * 12). An address that is not one to write to is shown as plain words
 * rather than a dead link, with a warning in development.
 */
export function EmailLink({ email, children, className, ...anchor }: EmailLinkProps) {
	const href = emailHref(email);
	const words = children ?? breakableEmail(email);
	if (!href) {
		warnOnce(email);
		return <span className={className}>{words}</span>;
	}
	return (
		<a className={className} href={href} {...anchor}>
			{words}
		</a>
	);
}
