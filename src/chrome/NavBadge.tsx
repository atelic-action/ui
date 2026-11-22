/**
 * A short word in a pill after a nav link's label ("Popular"), drawn the
 * same on the desktop panel and in the phone's menu, each with its own
 * class for the surface it sits on. Nothing without words.
 */
export function NavBadge({ text, className }: { text?: string; className: string }) {
	return text ? <span className={className}>{text}</span> : null;
}
