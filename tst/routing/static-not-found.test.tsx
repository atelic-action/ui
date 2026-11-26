import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	notFound,
	Outlet,
	RouterProvider,
	useMatches,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { isMiss, type MissMatch, staticNotFoundRouting } from "../../src/routing";

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
			// A navigation never times out into the pending view (9.7.0).
			defaultPendingMs: Number.POSITIVE_INFINITY,
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

	/** A site: a header in the root, a fast home page, a slow menu, a blog with a missing slug, and the catch all. */
	function site(options: { start: string; withMatches?: boolean }) {
		const rootRoute = createRootRoute({
			component: () => (
				<>
					<header>The header</header>
					<Outlet />
				</>
			),
		});
		const home = createRoute({
			getParentRoute: () => rootRoute,
			path: "/",
			component: () => <p>The home page</p>,
		});
		const slow = createRoute({
			getParentRoute: () => rootRoute,
			path: "/menu",
			loader: () => new Promise<void>((resolve) => setTimeout(resolve, 1500)),
			component: () => <p>The menu</p>,
		});
		const post = createRoute({
			getParentRoute: () => rootRoute,
			path: "/blog/$slug",
			staticData: { missing: (params: Record<string, string>) => params.slug === "unwritten" },
			loader: ({ params }) =>
				new Promise<void>((resolve, reject) =>
					setTimeout(() => (params.slug === "unwritten" ? reject(notFound()) : resolve()), 1500),
				),
			component: () => <p>A post</p>,
		});
		const catchAll = createRoute({
			getParentRoute: () => rootRoute,
			path: "$",
			component: NotFoundPage,
		});
		return createRouter({
			routeTree: rootRoute.addChildren([home, slow, post, catchAll]),
			history: createMemoryHistory({ initialEntries: [options.start] }),
			...(options.withMatches === false
				? staticNotFoundRouting(NotFoundPage)
				: staticNotFoundRouting(NotFoundPage, { useMatches })),
		});
	}
	const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	it.each([true, false])(
		"keeps the header and the page on screen through a slow navigation past the pending time (useMatches given: %s)",
		async (withMatches) => {
			const router = site({ start: "/", withMatches });
			render(<RouterProvider router={router} />);
			expect(await screen.findByText("The home page")).toBeInTheDocument();
			void router.navigate({ to: "/menu" });
			// Past the router's default pending time of a second, the loader still running.
			await wait(1200);
			// Shown, not only in the document: a pending view stands in for a
			// match by hiding it (display: none) beside the fallback.
			expect(screen.getByText("The header")).toBeVisible();
			expect(screen.getByText("The home page")).toBeVisible();
			expect(screen.queryByRole("heading", { name: "Nothing at this address" })).toBeNull();
			expect(await screen.findByText("The menu", {}, { timeout: 1000 })).toBeVisible();
			expect(screen.getByText("The header")).toBeVisible();
		},
	);

	it("still shows the not found page on a miss, and never the page before it as one", async () => {
		const router = site({ start: "/" });
		render(<RouterProvider router={router} />);
		expect(await screen.findByText("The home page")).toBeInTheDocument();
		await router.navigate({ to: "/nowhere" });
		expect(await screen.findByRole("heading", { name: "Nothing at this address" })).toBeVisible();
		expect(screen.queryByText("The home page")).toBeNull();
		expect(screen.getByText("The header")).toBeVisible();

		// A slug nobody wrote: the page before stays as itself while the loader
		// runs, never drawn as the 404, and the 404 replaces it once the router
		// reports the miss.
		void router.navigate({ to: "/" });
		expect(await screen.findByText("The home page")).toBeInTheDocument();
		void router.navigate({ to: "/blog/$slug", params: { slug: "unwritten" } });
		await wait(1200);
		expect(screen.getByText("The home page")).toBeVisible();
		expect(screen.queryByRole("heading", { name: "Nothing at this address" })).toBeNull();
		expect(
			await screen.findByRole("heading", { name: "Nothing at this address" }, { timeout: 1000 }),
		).toBeInTheDocument();
		expect(screen.queryByText("The home page")).toBeNull();
	});

	it("the page itself as the pending view, with a pending time a site set after the spread, would flash the 404 body there", async () => {
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
			defaultPendingMinMs: 0,
			...staticNotFoundRouting(NotFoundPage),
			defaultPendingMs: 0,
		});
		render(<RouterProvider router={router} />);
		expect(
			await screen.findByRole("heading", { name: "Nothing at this address" }),
		).toBeInTheDocument();
	});
});

describe("the pending view on a parameter route", () => {
	it("draws the page once the router reports the match not found, or a not found nothing below handled", () => {
		for (const match of [
			{ routeId: "/blog/$slug", params: { slug: "unwritten" }, status: "notFound" },
			{ routeId: "/blog/$slug", params: { slug: "unwritten" }, globalNotFound: true },
		]) {
			const Pending = staticNotFoundRouting(NotFoundPage, {
				useMatches: matchesOf([{ routeId: "__root__", params: {} }, match]),
			}).defaultPendingComponent;
			const { unmount } = render(<Pending />);
			expect(screen.getByRole("heading", { name: "Nothing at this address" })).toBeInTheDocument();
			unmount();
		}
	});

	it("draws nothing for a route still loading with no missing of its own, which is why such a route sets one", () => {
		const Pending = staticNotFoundRouting(NotFoundPage, {
			useMatches: matchesOf([
				{ routeId: "/blog/$slug", params: { slug: "unwritten" }, status: "pending" },
			]),
		}).defaultPendingComponent;
		const { container } = render(<Pending />);
		expect(container).toBeEmptyDOMElement();
	});
});

describe("the root's 404 head and the pending view", () => {
	it("agree on every kind of match, each against an answer written out by hand", () => {
		// The answer for each case is written here, not asked of isMiss, so a
		// change to the predicate that the pending view did not follow (or the
		// other way round) fails one side against the table.
		const cases: Array<[label: string, matches: MissMatch[], miss: boolean]> = [
			["the catch all took the path", [{ routeId: "/$", params: {} }], true],
			[
				"a route's missing says no such page",
				[{ routeId: "/blog/$slug", params: { slug: "x" }, staticData: { missing: () => true } }],
				true,
			],
			[
				"a route's missing says the page is there",
				[{ routeId: "/blog/$slug", params: { slug: "x" }, staticData: { missing: () => false } }],
				false,
			],
			[
				"a loader threw notFound()",
				[{ routeId: "/blog/$slug", params: { slug: "x" }, status: "notFound" }],
				true,
			],
			[
				"a not found nothing below handled",
				[{ routeId: "/blog/$slug", params: { slug: "x" }, globalNotFound: true }],
				true,
			],
			[
				"a parameter route still loading",
				[{ routeId: "/blog/$slug", params: { slug: "x" }, status: "pending" }],
				false,
			],
			["an ordinary page", [{ routeId: "/menu", params: {}, status: "success" }], false],
			["no matches at all", [], false],
		];
		for (const [label, matches, miss] of cases) {
			expect(isMiss(matches), label).toBe(miss);
			const Pending = staticNotFoundRouting(NotFoundPage, {
				useMatches: matchesOf(matches),
			}).defaultPendingComponent;
			const { container, unmount } = render(<Pending />);
			expect(container.textContent === "Nothing at this address", label).toBe(miss);
			unmount();
		}
	});
});
