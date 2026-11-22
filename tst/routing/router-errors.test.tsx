import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
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

/** A site's router with one route at / whose component throws as it renders. */
function brokenRouter(options: Partial<ReturnType<typeof routerErrorOptions>> = {}) {
	const rootRoute = createRootRoute({ component: () => <Outlet /> });
	const home = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: function Home(): never {
			throw new Error("route crash");
		},
	});
	return createRouter({
		routeTree: rootRoute.addChildren([home]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
		...options,
	});
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

	it("reports a route's render crash once and draws the package's error page", async () => {
		const report = vi.fn();
		installCatcher(window).report = report;
		render(<RouterProvider router={brokenRouter(routerErrorOptions())} />);
		expect(
			await screen.findByRole("heading", { name: "Something went wrong" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
		expect(report).toHaveBeenCalledOnce();
		expect((report.mock.calls[0]?.[0] as Error | undefined)?.message).toBe("route crash");
		expect(report.mock.calls[0]?.[1]).toBe("boundary");
	});

	it("is what reports it: the router's own boundary alone reports nothing", async () => {
		const report = vi.fn();
		installCatcher(window).report = report;
		render(<RouterProvider router={brokenRouter()} />);
		expect((await screen.findAllByText(/route crash/)).length).toBeGreaterThan(0);
		expect(report).not.toHaveBeenCalled();
	});
});
