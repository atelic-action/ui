import { peekAppConfig } from "../config";

/**
 * Which paths a signed out visitor may load, read from the app's config.
 *
 * Two kinds. A **public route** is an exact path the shell renders bare:
 * the landing at "/" and the OAuth callback. A **public page** is a pattern,
 * a prefix ending in "/*", for pages that stand on their own signed out and
 * render inside the public chrome (a brand bar with a sign in link): a
 * person's public activity or recipe under "/u/<username>/...". Signed in,
 * a public page renders inside the normal app shell like any other page.
 */

// Before the app configures the shell nothing is public, so a guard that
// runs early holds the page rather than opening it.
const exact = (pathname: string) => (peekAppConfig()?.publicRoutes ?? []).includes(pathname);

const matchesPattern = (pathname: string, pattern: string) => {
	if (!pattern.endsWith("/*")) return pathname === pattern;
	const prefix = pattern.slice(0, -1); // keep the trailing slash: "/u/" never matches "/users"
	return pathname.startsWith(prefix) && pathname.length > prefix.length;
};

/** Whether the path is a public page: one that renders in the public chrome signed out. */
export function isPublicPage(pathname: string): boolean {
	const pages = peekAppConfig()?.publicPages ?? [];
	return pages.some((pattern) => matchesPattern(pathname, pattern));
}

/** Whether a signed out visitor may load the path at all. */
export function isPublicRoute(pathname: string): boolean {
	return exact(pathname) || isPublicPage(pathname);
}
