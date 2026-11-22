import type { ReactNode } from "react";

/** A run that reads as a phone number: seven digits or more, with the usual separators. */
const PHONE = /(\+?\(?\d[\d\s().-]{5,}\d)/;

/** Whether a link calls: a `tel:` href. */
export function isTel(href: string | undefined): boolean {
	return href?.startsWith("tel:") ?? false;
}

/**
 * Wraps each phone number in a run of words in `.tel-number`, which never
 * breaks, so a call link holding more than the number (a dock row's label
 * and line, a menu row) wraps its words and holds its number whole.
 * Anything that is not a string passes through as it is.
 *
 * The run comes back inside one plain inline span, so a flex parent (a
 * button, a row) sees the words as the one item a bare string was: split
 * into separate items, the space before the number was dropped at an
 * item's edge and the parent's gap stood in its place, wider than a space.
 */
export function holdPhoneNumbers(content: ReactNode): ReactNode {
	if (typeof content !== "string") return content;
	const parts = content.split(PHONE);
	if (parts.length === 1) return content;
	return (
		<span>
			{parts.map((part, at) =>
				at % 2 === 1 && (part.match(/\d/g)?.length ?? 0) >= 7 ? (
					// biome-ignore lint/suspicious/noArrayIndexKey: the runs of one string never reorder
					<span key={at} className="tel-number">
						{part}
					</span>
				) : (
					part
				),
			)}
		</span>
	);
}

/**
 * The words of a link, with any phone number in them held whole when the
 * link calls (`holdPhoneNumbers` on a `tel:` href), and as given otherwise.
 * The one way a component sets a link's words that may hold a number.
 */
export function telText(href: string | undefined, content: ReactNode): ReactNode {
	return isTel(href) ? holdPhoneNumbers(content) : content;
}
