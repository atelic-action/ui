/**
 * How the gate reads its settings from the environment. Shared by the two
 * sign in functions and the middleware, so each reads a value the same way.
 */

/**
 * Whether an address is on the comma separated allowlist. An entry is either
 * a full address, which matches that address exactly, or the business's
 * domain, written bare (`example.com`) or with a leading at (`@example.com`),
 * which admits every address whose part after the `@` is that domain (the
 * business's own people, whoever the page is forwarded to). A domain never
 * admits its subdomains, and everything is compared case folded. An entry
 * that is empty, or is no address and holds no dot, matches nothing.
 */
export function isAllowed(email: string, allowlist: string | undefined): boolean {
	const wanted = email.trim().toLowerCase();
	// Only one plain address is ever admitted (one `@`, a local part, no
	// whitespace or list and quoting characters), so a crafted string such as
	// `a@evil.example,b@widget.example` can never ride a domain match into a send.
	const plain = /^[^@\s,;<>()"\\]+@[^@\s,;<>()"\\]+$/.test(wanted);
	if (!plain) return false;
	const domain = wanted.slice(wanted.lastIndexOf("@") + 1);
	return (allowlist ?? "")
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.some((entry) => {
			if (entry.length === 0) return false;
			const named = domainOf(entry);
			return named === undefined ? entry === wanted : named === domain;
		});
}

/**
 * The domain a domain entry names, or undefined when the entry is a full
 * address. A domain entry has to look like one (labels joined by dots), so a
 * stray word or a bare `@` names a domain no address can be on.
 */
function domainOf(entry: string): string | undefined {
	const bare = entry.startsWith("@") ? entry.slice(1) : entry;
	if (bare.includes("@")) return undefined;
	return /^[^.\s@]+(\.[^.\s@]+)+$/.test(bare) ? bare : "";
}

/**
 * A setting that has to be a positive, finite number, or its default. A
 * lifetime of zero, a negative one, or Infinity would mint a token that is
 * already dead or that cannot be signed at all. A fraction is allowed (half
 * a day), so a caller rounds what it derives to whole seconds. Anything past
 * the ceiling is held to it: a lifetime of 1e308 days is a typo, and the
 * seconds it works out to cannot be signed.
 */
export function positive(value: string | undefined, fallback: number, ceiling: number): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
	return Math.min(parsed, ceiling);
}
