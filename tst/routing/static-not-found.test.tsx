import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
	useMatches,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { type MissMatch, staticNotFoundRouting } from "../../src/routing";

function NotFoundPage() {
	return <h1>Nothing at this address</h1>;
}

/** A stand in for the router's hook, answering from the matches it is given. */
const matchesOf =
	(matches: MissMatch[]) =>
	({ select }: { select: (matches: ReadonlyArray<MissMatch>) => boolean }) =>
		select(matches);

describe("staticNotFoundRouting", () => {
	// jsdom has no scrolling; a navigation asks for it.
	beforeEach(() => {
		vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it("renders the page for both a miss and the pending state a miss hydrates through", () => {
		const Page = () => null;
		expect(staticNotFoundRouting(Page)).toEqual({
			defaultNotFoundComponent: Page,
			defaultPendingComponent: Page,
		});
	});

	it("given the router's useMatches, the pending view draws the page on a miss alone", () => {
		const onMiss = staticNotFoundRouting(NotFoundPage, {
			useMatches: matchesOf([
				{ routeId: "__root__", params: {} },
				{ routeId: "/$", params: {} },
			]),
		});
		expect(onMiss.defaultNotFoundComponent).toBe(NotFoundPage);
		const Miss = onMiss.defaultPendingComponent;
		const { unmount } = render(<Miss />);
		expect(screen.getByRole("heading", { name: "Nothing at this address" })).toBeInTheDocument();
		unmount();

		const missing = (params: Record<string, string>) => params.slug === "unwritten";
		const Slug = staticNotFoundRouting(NotFoundPage, {
			useMatches: matchesOf([
				{ routeId: "/blog/$slug", params: { slug: "unwritten" }, staticData: { missing } },
			]),
		}).defaultPendingComponent;
		const { unmount: unmountSlug } = render(<Slug />);
		expect(screen.getByRole("heading", { name: "Nothing at this address" })).toBeInTheDocument();
		unmountSlug();

		const Elsewhere = staticNotFoundRouting(NotFoundPage, {
			useMatches: matchesOf([{ routeId: "/menu", params: {} }]),
		}).defaultPendingComponent;
		const { container } = render(<Elsewhere />);
		expect(container).toBeEmptyDOMElement();
	});

	it("on a real router, a slow route's pending state shows no 404 body", async () => {
		const rootRoute = createRootRoute({ component: () => <Outlet /> });
		const slow = createRoute({
			getParentRoute: () => rootRoute,
			path: "/menu",
			loader: () => new Promise<void>(() => {}),
			component: () => <p>The menu</p>,
		});
		const catchAll = createRoute({
			getParentRoute: () => rootRoute,
			path: "$",
			component: NotFoundPage,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([slow, catchAll]),
			history: createMemoryHistory({ initialEntries: ["/menu"] }),
			defaultPendingMs: 0,
			defaultPendingMinMs: 0,
			...staticNotFoundRouting(NotFoundPage, { useMatches }),
		});
		render(<RouterProvider router={router} />);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(screen.queryByText("The menu")).toBeNull();
		expect(screen.queryByRole("heading", { name: "Nothing at this address" })).toBeNull();

		await router.navigate({ to: "/nowhere" });
		expect(
			await screen.findByRole("heading", { name: "Nothing at this address" }),
		).toBeInTheDocument();
	});

	it("the page itself as the pending view, as before, would flash the 404 body there", async () => {
		const rootRoute = createRootRoute({ component: () => <Outlet /> });
		const slow = createRoute({
			getParentRoute: () => rootRoute,
			path: "/menu",
			loader: () => new Promise<void>(() => {}),
			component: () => <p>The menu</p>,
		});
		const router = createRouter({
			routeTree: rootRoute.addChildren([slow]),
			history: createMemoryHistory({ initialEntries: ["/menu"] }),
			defaultPendingMs: 0,
			defaultPendingMinMs: 0,
			...staticNotFoundRouting(NotFoundPage),
		});
		render(<RouterProvider router={router} />);
		expect(
			await screen.findByRole("heading", { name: "Nothing at this address" }),
		).toBeInTheDocument();
	});
});
