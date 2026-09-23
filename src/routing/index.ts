/**
 * The router options that keep a not found page alive on a statically
 * prerendered TanStack Start site. Spread them into createRouter:
 *
 *   createRouter({ routeTree, ...staticNotFoundRouting(NotFoundPage) })
 *
 * The static host serves the /404 prerender for every unknown path, and it
 * takes a catch all route (src/routes/$.tsx rendering the same page) plus
 * these two options to survive hydration:
 *
 * - The splat gives the client a match below the root. With a dedicated
 *   /404 route instead, an unknown path matches only the root, hydrate takes
 *   its SPA branch, throws, and the page goes blank.
 * - The splat's match id still carries the path, so it differs from the
 *   dehydrated /404 match and hydrate renders the pending state first.
 *   Pending as the page itself keeps that first render identical to the
 *   server HTML; the default null is a hydration mismatch.
 *
 * Static sites only. On a live app the pending state is a real loading
 * moment, and this would flash the not found page through every slow load;
 * an app sets defaultNotFoundComponent alone.
 *
 * Generic over the page so the router checks it against its own component
 * type; the package stays free of any router import.
 */
export function staticNotFoundRouting<Page>(page: Page) {
	return {
		defaultNotFoundComponent: page,
		defaultPendingComponent: page,
	};
}
