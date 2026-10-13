import {
	createHashHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppLayout, AppProvider, AuthGuard, configureApp } from "../../src/app";
import "./app.css";
import { appConfig, navItems } from "./data";
import { KitPage } from "./kit";
import {
	AccountPage,
	BakesPage,
	IndexPage,
	OrdersPage,
	PublicProfilePage,
	RecipesPage,
	StatesPage,
	WholesalePage,
} from "./pages";
import { galleryQueryClient, signIn } from "./session";

/**
 * The app shell's gallery: a made up bakery's ops app running on the shell
 * from the repo's own source. The root route is what an app's __root.tsx
 * holds (the guard and the frame); AppProvider sits above the router, as it
 * does in an app's main.tsx. Hash history keeps every page reachable on a
 * static host.
 */
const rootRoute = createRootRoute({
	component: () => (
		<AuthGuard>
			<AppLayout>
				<Outlet />
			</AppLayout>
		</AuthGuard>
	),
});

const page = (path: string, component: () => ReactNode) =>
	createRoute({ getParentRoute: () => rootRoute, path, component });

const routeTree = rootRoute.addChildren([
	page("/", IndexPage),
	page("/orders", OrdersPage),
	page("/orders/wholesale", WholesalePage),
	page("/bakes", BakesPage),
	page("/bakes/recipes", RecipesPage),
	page("/kit", KitPage),
	page("/states", StatesPage),
	page("/profile", AccountPage),
	page("/u/$username", PublicProfilePage),
]);

const router = createRouter({ routeTree, history: createHashHistory() });

// Every visit opens signed in; the States page signs out to show the guard.
configureApp(appConfig);
signIn();

const root = document.getElementById("root");
if (!root) throw new Error("The gallery needs a #root element to mount into.");

createRoot(root).render(
	<StrictMode>
		<AppProvider config={appConfig} nav={navItems} queryClient={galleryQueryClient}>
			<RouterProvider router={router} />
		</AppProvider>
	</StrictMode>,
);
