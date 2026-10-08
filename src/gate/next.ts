/**
 * The post sign in destination, held to a path on this host. A value that
 * starts with one slash is not enough: a browser reads `//host` as protocol
 * relative and `/\host` the same way, and drops tabs and newlines before it
 * parses, so `/\t/host` arrives as `//host`. The value also becomes a
 * Location header, which throws on anything outside Latin 1, so the path is
 * held to printable ASCII. Anything else falls back to the root.
 */
export function safeNext(value: unknown): string {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
	for (let i = 0; i < value.length; i++) {
		const code = value.charCodeAt(i);
		if (code === 0x5c || code <= 0x20 || code >= 0x7f) return "/";
	}
	return value;
}
