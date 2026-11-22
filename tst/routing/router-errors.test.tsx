import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "../../src/artifact";
import { installCatcher, readCatcher } from "../../src/monitoring/catcher";
import { RouteErrorFallback, routerErrorOptions } from "../../src/routing";

function clear() {
	const catcher = readCatcher(window);
	if (catcher) {
		window.removeEventListener("error", catcher.onError);
		window.removeEventListener("unhandledrejection", catcher.onRejection);
	}
	delete (window as { __atelicErrors?: unknown }).__atelicErrors;
}

/** A route's own error page, with no `onCatch` of its own. */
function OwnErrorPage() {
	return <p>The route's own error page</p>;
}

/**
 * A site's router as the template builds it: the root route wraps its outlet
 * in `AppErrorBoundary`, and the route at / throws as it renders, with its own
 * `errorComponent` when asked.
 */
function siteRouter({
	options = {},
	ownErrorPage = false,
}: {
	options?: Partial<ReturnType<typeof routerErrorOptions>>;
	ownErrorPage?: boolean;
} = {}) {
	const rootRoute = createRootRoute({
		component: () => (
			<AppErrorBoundary>
				<Outlet />
			</AppErrorBoundary>
		),
	});
	const home = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: function Home(): never {
			throw new Error("route crash");
		},
		...(ownErrorPage ? { errorComponent: OwnErrorPage } : {}),
	});
	return createRouter({
		routeTree: rootRoute.addChildren([home]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
		...options,
	});
}

/** Renders the router with a reporter installed, and hands back the reporter. */
function renderSite(router: ReturnType<typeof siteRouter>) {
	const report = vi.fn();
	installCatcher(window).report = report;
	render(<RouterProvider router={router} />);
	return report;
}

describe("routerErrorOptions", () => {
	beforeEach(() => {
		clear();
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => {
		clear();
		vi.restoreAllMocks();
	});

	it("names the catch handler and the package's error page", () => {
		expect(routerErrorOptions().defaultErrorComponent).toBe(RouteErrorFallback);
		expect(typeof routerErrorOptions().defaultOnCatch).toBe("function");
	});

	it("without them, a route with no errorComponent rises to AppErrorBoundary, reported once", async () => {
		const report = renderSite(siteRouter());
		expect(
			await screen.findByRole("heading", { name: "Something went wrong" }),
		).toBeInTheDocument();
		expect(report).toHaveBeenCalledOnce();
		expect((report.mock.calls[0]?.[0] as Error | undefined)?.message).toBe("route crash");
	});

	it("without them, a route's own errorComponent catches the crash and nobody reports it", async () => {
		const report = renderSite(siteRouter({ ownErrorPage: true }));
		expect(await screen.findByText("The route's own error page")).toBeInTheDocument();
		expect(report).not.toHaveBeenCalled();
	});

	it("with them, a route with no errorComponent is caught by its own boundary, reported once", async () => {
		const report = renderSite(siteRouter({ options: routerErrorOptions() }));
		expect(
			await screen.findByRole("heading", { name: "Something went wrong" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
		expect(report).toHaveBeenCalledOnce();
		expect(report.mock.calls[0]?.[1]).toBe("boundary");
	});

	it("with them, a route's own errorComponent still draws, and the crash is reported once", async () => {
		const report = renderSite(siteRouter({ options: routerErrorOptions(), ownErrorPage: true }));
		expect(await screen.findByText("The route's own error page")).toBeInTheDocument();
		expect(report).toHaveBeenCalledOnce();
		expect((report.mock.calls[0]?.[0] as Error | undefined)?.message).toBe("route crash");
	});
});

describe("RouteErrorFallback", () => {
	it("reloads on Try Again, without resetting the boundary again", () => {
		const reload = vi.fn();
		const reset = vi.fn();
		render(<RouteErrorFallback error={new Error("loader failed")} reset={reset} reload={reload} />);
		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
		expect(reload).toHaveBeenCalledOnce();
		expect(reset).not.toHaveBeenCalled();
	});
});
