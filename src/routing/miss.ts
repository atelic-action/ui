/** One of the router's matches, by the plain fields `isMiss` reads. */
export interface MissMatch {
	routeId: string;
	params: Record<string, string>;
	staticData?: { missing?: (params: Record<string, string>) => boolean };
	/** The match's state; `notFound` once a route's loader has thrown `notFound()`. */
	status?: string;
	/** Set on the match that renders a not found nothing below it handled. */
	globalNotFound?: boolean;
}

/** The catch all route's id in a TanStack file route tree. */
export const CATCH_ALL_ROUTE_ID = "/$";

/**
 * Whether the router's matches are a miss: the catch all route took the
 * path (an unknown page), a route with params says its params name a page
 * it does not have (a blog slug nobody wrote) through `staticData.missing`,
 * or the router already reports a match not found (a loader's `notFound()`,
 * 8.3.0). The one predicate the root's 404 head and the not found pending
 * view both ask, so the two never disagree.
 * Router free: it reads the plain fields every TanStack match carries, so a
 * site's root route asks it from `head` and from `useMatches`.
 *
 * Under `staticNotFoundRouting` a miss is still pending while the page
 * hydrates, and a route's `notFound()` lands as late, so the question is
 * answered from the matches alone, before anything has loaded. A site's root
 * uses it twice: to emit the 404's head tags from the root (tags on the
 * pending catch all route would be emitted twice), and to draw a miss inside
 * the site's shell from the root layout, so the shell stays mounted while
 * the not found body swaps from its pending render to its own.
 */
export function isMiss(
	matches: ReadonlyArray<MissMatch>,
	catchAllId: string = CATCH_ALL_ROUTE_ID,
): boolean {
	return matches.some(
		(match) =>
			match.routeId === catchAllId ||
			match.staticData?.missing?.(match.params) === true ||
			match.status === "notFound" ||
			match.globalNotFound === true,
	);
}
