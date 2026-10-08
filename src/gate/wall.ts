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
 * anything else); plus the two sign in functions under /api/auth/, the login page itself,
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

/**
 * Whether a request for this path needs a session when the wall is armed.
 * The path is read the way a file server would read it (decoded, repeated
 * slashes collapsed) so an encoded or doubled slash cannot walk a held file
 * out through an open prefix; anything that will not decode, or still climbs
 * a directory once decoded, is held. Case is folded for the held corner
 * alone, so no spelling of it slips out, while an open path opens only as
 * written: the host serves files by exact case, and a path that merely looks
 * like an open one names some other file.
 */
export function needsSession(pathname: string): boolean {
	let path: string;
	try {
		path = decodeURIComponent(pathname);
	} catch {
		return true;
	}
	path = path.replace(/\/{2,}/g, "/");
	if (path.includes("..") || path.includes("\\")) return true;
	const folded = path.toLowerCase();
	if (HELD_PREFIXES.some((prefix) => folded.startsWith(prefix))) return true;
	if (OPEN_EXACT.has(path)) return false;
	return !OPEN_PREFIXES.some((prefix) => path.startsWith(prefix));
}
