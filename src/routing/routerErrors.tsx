import { ErrorFallback } from "../artifact/ErrorFallback";
import { reportError } from "../monitoring/catcher";

/** What a router hands its error component: the error and a way to try again. */
export interface RouteErrorProps {
	error: unknown;
	reset: () => void;
	/** Reloads the page; defaults to the window's own. For a test. */
	reload?: () => void;
}

/**
 * The package's `ErrorFallback` as a router's error component: the same
 * dependency free page `AppErrorBoundary` draws. Try Again reloads the page.
 * A loader or beforeLoad error stays on the router's match, so the boundary's
 * own reset throws it again (and reports it a second time), and recovering in
 * place takes the router's invalidate, which this entry cannot import. The
 * `reload` prop is there for a test; a router never passes it.
 */
export function RouteErrorFallback({ error, reload }: RouteErrorProps) {
	const retry = reload ?? (() => window.location.reload());
	return <ErrorFallback error={error} resetError={retry} />;
}

/**
 * Hands a crash a router's own boundary caught to error reporting, exactly
 * as `AppErrorBoundary` does (`reportError(error, "boundary")`).
 */
export function reportRouteError(error: unknown): void {
	reportError(error, "boundary");
}

/**
 * The router options that make a route's render crash reach error reporting
 * whichever boundary catches it. TanStack Router (1.170) gives a route its
 * own catch boundary only when an `errorComponent` applies to it; with none,
 * a crash rises to the site's `AppErrorBoundary`, which reports it. A route
 * or a site that sets its own `errorComponent` with no `onCatch` puts a
 * boundary in the way that catches the crash and reports it to nobody, since
 * React keeps a caught crash from the window's handlers. With these spread
 * into `createRouter`, every route has the boundary, `defaultOnCatch` reports
 * what it catches once, and `defaultErrorComponent` draws the package's error
 * page in its place, so the report no longer depends on which boundary is
 * nearest:
 *
 *   createRouter({ routeTree, ...routerErrorOptions() })
 *
 * A route's own `onCatch` or `errorComponent` wins over these; a not found
 * is never caught here, since the router rethrows it to its not found
 * handling first. Like the rest of this entry, it imports no router.
 */
export function routerErrorOptions() {
	return {
		defaultOnCatch: reportRouteError,
		defaultErrorComponent: RouteErrorFallback,
	};
}
