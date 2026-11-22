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
 * The router options that report a route's render crash. TanStack Router
 * wraps every route in its own catch boundary, which catches a crash before
 * any boundary of the site's sees it, and React keeps a caught crash away
 * from the window's handlers, so without these a crash reaches nobody.
 * Spread them into `createRouter`:
 *
 *   createRouter({ routeTree, ...routerErrorOptions() })
 *
 * `defaultOnCatch` reports what the boundary caught, and
 * `defaultErrorComponent` draws the package's error page in its place. A
 * route with its own `onCatch` or `errorComponent` keeps its own; a not
 * found is never caught here, since the router rethrows it to its not found
 * handling first. Like the rest of this entry, it imports no router.
 */
export function routerErrorOptions() {
	return {
		defaultOnCatch: reportRouteError,
		defaultErrorComponent: RouteErrorFallback,
	};
}
