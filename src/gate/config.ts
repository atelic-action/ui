/**
 * How the gate reads its settings from the environment. Shared by the two
 * sign in functions and the middleware, so each reads a value the same way.
 */

/** Whether an address is on the comma separated allowlist. */
export function isAllowed(email: string, allowlist: string | undefined): boolean {
	const wanted = email.trim().toLowerCase();
	if (!wanted) return false;
	return (allowlist ?? "")
		.split(",")
		.map((entry) => entry.trim().toLowerCase())
		.includes(wanted);
}

/**
 * A setting that has to be a positive, finite number, or its default. A
 * lifetime of zero, a negative one, or Infinity would mint a token that is
 * already dead or that cannot be signed at all. A fraction is allowed (half
 * a day), so a caller rounds what it derives to whole seconds.
 */
export function positive(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
