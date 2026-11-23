import type { AnchorHTMLAttributes, ReactNode } from "react";
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

/**
 * The `mailto:` href for an address, the one place it is built: the address
 * exactly as given, as every link drew it before 8.5.0, so the browser is
 * never stricter than it was; a malformed configured address is the build
 * guard's to catch (`contactProblems`). An empty one has no href.
 */
export function emailHref(email: string): string | undefined {
	// A config written in plain JavaScript can hand over anything; only words link.
	return typeof email === "string" && email.trim() ? `mailto:${email}` : undefined;
}

/**
 * An email address as a link that writes to it (Component Rules 17), the
 * one way the package draws one. It never opens a new tab (Component Rules
 * 12). Its href is `emailHref`'s; only an empty address is shown as plain
 * words, with a warning in development.
 */
export function EmailLink({ email, children, className, ...anchor }: EmailLinkProps) {
	const href = emailHref(email);
	const words = children ?? (typeof email === "string" ? breakableEmail(email) : null);
	if (!href) {
		warnOnce(String(email));
		return <span className={className}>{words}</span>;
	}
	return (
		<a className={className} href={href} {...anchor}>
			{words}
		</a>
	);
}
