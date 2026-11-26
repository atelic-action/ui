import { type ComponentType, createElement, type ReactElement } from "react";
import { CATCH_ALL_ROUTE_ID, isMiss, type MissMatch } from "./miss";

/** What the pending view needs from the site's router, handed in so this entry imports none. */
export interface StaticNotFoundOptions {
	/**
	 * The router's own `useMatches` (`import { useMatches } from
	 * "@tanstack/react-router"`). With it, the pending view draws the not
	 * found page on a miss alone and nothing on any other route's pending
	 * state, so a slow client navigation never flashes a bare 404 body. A
	 * miss is the catch all route's match, a route whose
	 * `staticData.missing(params)` says its params name no page, or a match
	 * the router already reports as not found.
	 */
	useMatches: (options: { select: (matches: ReadonlyArray<MissMatch>) => boolean }) => boolean;
	/** The catch all route's id, when it is not `/$`. */
	catchAllId?: string;
}

/**
 * The router options that keep a not found page alive on a statically
 * prerendered TanStack Start site. Spread them into createRouter:
 *
 *   createRouter({ routeTree, ...staticNotFoundRouting(NotFoundPage, { useMatches }) })
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
 *   server HTML; a pending view of plain null is a hydration mismatch (React
 *   error 418) and a blank body on every miss.
 *
 * Given the router's `useMatches` (8.2.0), the pending view draws the page
 * on a miss (`isMiss`) and nothing otherwise, so another route's pending
 * state on a slow client navigation shows no bare 404 body. Without it the
 * pending view is the page itself, as before.
 *
 * What a route must set: a route with params that can claim a path with no
 * page behind it (a blog slug nobody wrote) sets `staticData.missing(params)`.
 * The static host serves such a path the 404 prerender, and it hydrates
 * through the pending state before the route's loader has run, so its
 * `notFound()` arrives too late for that first render: without `missing`,
 * the pending view draws nothing where the server drew the page, and the
 * page hydrates blank. A loader's `notFound()` is still honored once the
 * router reports it (a client navigation to the slug).
 *
 * The options also set `defaultPendingMs: Infinity` (9.7.0), so an
 * ordinary client navigation never times out into the pending view: the
 * page being read stays on screen, header and all, until the next one is
 * ready, and a miss is drawn by the catch all route's own component, or by
 * the not found page once a loader's `notFound()` arrives. Before, a
 * navigation that took longer than the router's pending time (a second by
 * default) drew the pending view in place of the page, and the router hides
 * a match's content (display: none) beside its pending view, so the null
 * drawn for a route that is not a miss left the page blank. An infinite
 * pending time is how TanStack Router (1.81 on, the range this package's
 * peer allows) turns that timed pending view off: router-core 1.170's
 * `offerPending` presents no pending view for a match still loading when
 * its pending time is Infinity. Hydration marks its boundary pending
 * itself, so a miss still hydrates through the pending view as the page it
 * was prerendered as. A suspending pending view would only hand the fallback
 * up to the next boundary, and a route by route `pendingComponent` would
 * need the site to name every slow route.
 *
 * What it does not cover: `offerPending` shows the pending view at once,
 * whatever the pending time, for a match marked invalid (what
 * `router.invalidate()` marks, which no site and no code in this package
 * calls) and for a match that finished loading while it is still presented
 * pending. On an ordinary navigation nothing is presented pending but a
 * boundary hydration left pending (a miss, whose pending view is the page)
 * or one an earlier offer presented, which under Infinity only an
 * invalidated match gets, so neither blanks a page a visitor navigates
 * from. The infinite pending time silences a route's own
 * `pendingComponent` too: a route that wants its own pending view on a slow
 * navigation sets `pendingMs` on itself, which wins for that route (no site
 * has one as of 9.7.0). A site's own `defaultPendingMs` goes before the
 * spread, or it is overridden.
 *
 * Static sites only. On a live app the pending state is a real loading
 * moment; an app sets defaultNotFoundComponent alone.
 *
 * Generic over the page so the router checks it against its own component
 * type; the package stays free of any router import.
 */
export function staticNotFoundRouting<Page>(page: Page): {
	defaultNotFoundComponent: Page;
	defaultPendingComponent: Page;
	defaultPendingMs: number;
};
export function staticNotFoundRouting<Page extends ComponentType>(
	page: Page,
	options: StaticNotFoundOptions,
): {
	defaultNotFoundComponent: Page;
	defaultPendingComponent: () => ReactElement | null;
	defaultPendingMs: number;
};
export function staticNotFoundRouting<Page>(page: Page, options?: StaticNotFoundOptions) {
	// The pending view is for hydration alone: a navigation never times out
	// into it, so the page being read stays until the next is ready.
	const defaultPendingMs = Number.POSITIVE_INFINITY;
	if (!options) {
		return { defaultNotFoundComponent: page, defaultPendingComponent: page, defaultPendingMs };
	}
	const { useMatches, catchAllId = CATCH_ALL_ROUTE_ID } = options;
	// The one miss predicate the root's 404 head asks too, so the two agree.
	const select = (matches: ReadonlyArray<MissMatch>) => isMiss(matches, catchAllId);
	function NotFoundPending(): ReactElement | null {
		const miss = useMatches({ select });
		return miss ? createElement(page as ComponentType) : null;
	}
	return {
		defaultNotFoundComponent: page,
		defaultPendingComponent: NotFoundPending,
		defaultPendingMs,
	};
}
