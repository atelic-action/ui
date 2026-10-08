/**
 * Read one cookie the page is allowed to see. Returns "" during prerender,
 * when the cookie is not set, and when its value is not valid percent
 * encoding, so a caller can treat all three as absent.
 */
export function readCookie(name: string): string {
	if (typeof document === "undefined") return "";
	const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
	if (!match) return "";
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return "";
	}
}
