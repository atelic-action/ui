/**
 * Read one cookie the page is allowed to see. Returns "" during prerender,
 * when the cookie is not set, and when its value is not valid percent
 * encoding, so a caller can treat all three as absent. The name is matched
 * as written, never as a pattern, so one holding a dot or a bracket reads
 * its own cookie and nothing else.
 */
export function readCookie(name: string): string {
	if (typeof document === "undefined" || !name) return "";
	for (const pair of document.cookie.split(";")) {
		const split = pair.indexOf("=");
		if (split === -1 || pair.slice(0, split).trim() !== name) continue;
		try {
			return decodeURIComponent(pair.slice(split + 1).trim());
		} catch {
			return "";
		}
	}
	return "";
}
