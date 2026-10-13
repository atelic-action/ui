/**
 * The base path: the prefix a site is served under when it does not own the
 * root of its host (a website build previewed at `/proto` on the business's
 * artifact host). A site sets it once; `BasePathProvider` hands it to every
 * component below, and `marketingConfig` turns it into Vite's `base` and the
 * router's `basepath`.
 *
 * Normalized form: "" for the root, otherwise a leading slash and no trailing
 * slash ("/proto"). These helpers are pure and take the base explicitly, so
 * the Vite config, the build commands, and the tests use them as they are.
 * Plain TypeScript with no imports, since the built Vite entry imports it.
 */

const SEGMENT = /^(\/[A-Za-z0-9._~-]+)+$/;

/** Turns a configured value ("", "/", "proto", "/proto/") into "" or "/proto". Throws on anything else. */
export function normalizeBasePath(raw: string | undefined): string {
	const trimmed = (raw ?? "").trim();
	if (trimmed === "" || trimmed === "/") return "";
	const base = `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
	if (!SEGMENT.test(base)) {
		throw new Error(
			`basePath must be a path such as "/proto" (letters, digits, dot, dash, underscore, tilde): got ${JSON.stringify(raw)}`,
		);
	}
	return base;
}

/** True for a path the base applies to: root absolute, not protocol relative. */
function isRootAbsolute(path: string): boolean {
	return path.startsWith("/") && !path.startsWith("//");
}

/** True when the path already carries the base (so applying it again is a no op). */
export function hasBase(base: string, path: string): boolean {
	if (!base) return true;
	if (!path.startsWith(base)) return false;
	const next = path.charAt(base.length);
	return next === "" || next === "/" || next === "?" || next === "#";
}

/**
 * Prefixes a root absolute path with the base. External URLs, protocol links
 * (mailto:, tel:), fragments, relative paths, and paths that already carry the
 * base come back unchanged, so it is safe on any href and idempotent.
 */
export function joinBase(base: string, path: string): string {
	if (!base || !isRootAbsolute(path) || hasBase(base, path)) return path;
	return `${base}${path}`;
}

/** Removes the base from a path that carries it ("/proto/faqs" to "/faqs", "/proto" to "/"). */
export function stripBase(base: string, path: string): string {
	if (!base || !isRootAbsolute(path) || !path.startsWith(base) || !hasBase(base, path)) return path;
	const rest = path.slice(base.length);
	return rest === "" || !rest.startsWith("/") ? `/${rest}` : rest;
}
