/**
 * What the access wall holds back. With the wall armed, every request needs
 * a session except what the login page itself needs to render: the practice's
 * FOOTPRINT.md says anything carrying a private signal is never hosted
 * publicly, and on a private artifact that includes the owner's screenshots
 * under /images/, the printed PDF, and the built chunks a document's content
 * compiles into.
 *
 * The open paths are read from what the built /login page actually loads:
 * its hashed CSS and JS under /assets/, the fonts its stylesheet declares,
 * the favicon in its head, and the brand marks the header draws, which every
 * prerendered page preloads because the router's pending page carries the
 * header (each site's e2e/wall.spec.ts fails when the login page asks for
 * anything else); plus everything under /api/auth/, where the two sign in functions
 * live and a host adds nothing private, the login page itself,
 * robots.txt, and the uptime monitor's health.json. /assets/doc/ is the one
 * part of /assets/ held back: the build writes every chunk carrying a
 * private content module there (the private chunks build plugin), so a document's
 * copy and numbers never sit in a file the login page can load.
 *
 * A logo is a brand mark and is not private; a screenshot is evidence and
 * may be. So brand marks, the sender's and the recipient's, live under
 * public/brand/ and stay open, so the header and the login page can draw
 * them, and the owner's screens live under public/images/ and are held. The
 * sender's mark at /logo.svg and the favicon stay open where they are,
 * because every cut already points at them there.
 *
 * The business's website build, when one is previewed, is proxied under
 * /proto by a rewrite in the host's vercel.json. It is a public thing by design and carries no private reading, so
 * it stays open on a private host too: a prospect reads the prototype
 * without a sign in while the documents beside it stay behind the wall.
 *
 * A marketing site's login page loads the same kinds of file (its hashed
 * assets, its fonts, its favicon), so the same lists hold a website by
 * default: any path they do not name, a page whose last segment carries a
 * dot (`/blog/release-2.0`) included, needs a session. A site with an open
 * file of its own names it through `createNeedsSession` (or the middleware's
 * `open` option), which adds to these lists and never opens the held corner.
 *
 * Pure and dependency free, so the middleware imports it and the tests call
 * it directly.
 */

const OPEN_EXACT = new Set([
	"/login",
	"/login/",
	"/favicon.svg",
	"/logo.svg",
	"/robots.txt",
	"/health.json",
	"/proto",
]);

const OPEN_PREFIXES = ["/api/auth/", "/assets/", "/brand/", "/fonts/", "/proto/"];

/** The one corner of an open prefix that stays behind the wall. */
const HELD_PREFIXES = ["/assets/doc/"];

/** What the wall leaves open with no session, exact paths and prefixes, before any a site adds. */
export const OPEN_PATHS: {
	readonly exact: readonly string[];
	readonly prefixes: readonly string[];
} = { exact: [...OPEN_EXACT], prefixes: [...OPEN_PREFIXES] };

/** Paths a site opens beyond the wall's own, for a file its login page needs. */
export interface WallOpenings {
	/** Paths opened as written, each starting with "/" (`/apple-touch-icon.png`). */
	exact?: readonly string[];
	/** Folders opened whole, each starting and ending with "/" and never "/" alone (`/icons/`). */
	prefixes?: readonly string[];
}

/**
 * Whether a request for this path needs a session when the wall is armed.
 * The path is read the way a file server would read it (decoded, repeated
 * slashes collapsed) so an encoded or doubled slash cannot walk a held file
 * out through an open prefix; anything that will not decode, or still climbs
 * a directory once decoded, is held, and so is one that still carries a
 * percent sign, since a second decode somewhere downstream would make it a
 * different path than the one judged here. Case is folded for the held corner
 * alone, so no spelling of it slips out, while an open path opens only as
 * written: the host serves files by exact case, and a path that merely looks
 * like an open one names some other file.
 */
export function needsSession(pathname: string): boolean {
	return judge(pathname, OPEN_EXACT, OPEN_PREFIXES);
}

function judge(pathname: string, exact: ReadonlySet<string>, prefixes: readonly string[]): boolean {
	let path: string;
	try {
		path = decodeURIComponent(pathname);
	} catch {
		return true;
	}
	path = path.replace(/\/{2,}/g, "/");
	if (path.includes("..") || path.includes("\\") || path.includes("%")) return true;
	const folded = path.toLowerCase();
	if (HELD_PREFIXES.some((prefix) => folded.startsWith(prefix))) return true;
	if (exact.has(path)) return false;
	return !prefixes.some((prefix) => path.startsWith(prefix));
}

/**
 * `needsSession` with a site's own open paths added to the wall's, read the
 * same way. Throws on an entry that is not a plain path, or a prefix that
 * would open the whole host, so a typo cannot quietly unlock a site.
 */
export function createNeedsSession(open: WallOpenings = {}): (pathname: string) => boolean {
	const extraExact = open.exact ?? [];
	const extraPrefixes = open.prefixes ?? [];
	for (const path of extraExact) {
		if (!path.startsWith("/") || path.includes("..") || path.includes("%")) {
			throw new Error(
				`An open path must be a plain path starting with "/": ${JSON.stringify(path)}`,
			);
		}
	}
	for (const prefix of extraPrefixes) {
		if (
			prefix === "/" ||
			!prefix.startsWith("/") ||
			!prefix.endsWith("/") ||
			prefix.includes("..")
		) {
			throw new Error(
				`An open prefix must be a folder such as "/icons/", never "/" alone: ${JSON.stringify(prefix)}`,
			);
		}
	}
	if (extraExact.length === 0 && extraPrefixes.length === 0) return needsSession;
	const exact = new Set([...OPEN_EXACT, ...extraExact]);
	const prefixes = [...OPEN_PREFIXES, ...extraPrefixes];
	return (pathname) => judge(pathname, exact, prefixes);
}
