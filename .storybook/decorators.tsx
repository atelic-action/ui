import type { Decorator } from "@storybook/react-vite";
import { QueryClient } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { type ComponentType, createContext, useContext, useEffect, useState } from "react";
import { AppProvider } from "../src/app";
import { EmailThemeProvider } from "../src/email";
import { atelicPalette } from "../src/tokens";
import { storyAppConfig, storyAppNav } from "../stories/fixtures/app";
import appCSS from "./app.css?inline";

/**
 * Which frame a story is mounted in follows the first segment of its title,
 * which mirrors its folder under `stories/`: `App/...` gets the app shell's
 * provider and a router, `Email/...` the email theme, and everything else the
 * site root a page wears.
 */
function kindOf(title: string): "app" | "email" | "site" {
	const head = title.split("/")[0];
	if (head === "App") return "app";
	if (head === "Email") return "email";
	return "site";
}

/**
 * The site root: the `.atelic-ui` class every package sheet answers to, with
 * the density toolbar's setting on it. A story whose component renders its own
 * root (`SiteShell`) sets `parameters: { root: false }` and passes the density
 * through itself, since a second root would reset the setting.
 */
export const withSiteRoot: Decorator = (Story, context) => {
	if (kindOf(context.title) !== "site" || context.parameters.root === false) return <Story />;
	const density = context.globals.density as string | undefined;
	return (
		<div
			className="atelic-ui"
			data-density={density && density !== "default" ? density : undefined}
		>
			<Story />
		</div>
	);
};

/** An email story renders rows: the theme, a table for them, on the email's ground. */
export const withEmail: Decorator = (Story, context) => {
	if (kindOf(context.title) !== "email") return <Story />;
	return (
		<div style={{ background: atelicPalette.ground, padding: "24px 12px", minHeight: "100vh" }}>
			<EmailThemeProvider>
				<table
					role="presentation"
					cellPadding="0"
					cellSpacing="0"
					style={{ width: "100%", maxWidth: "680px", margin: "0 auto" }}
				>
					<tbody>
						<Story />
					</tbody>
				</table>
			</EmailThemeProvider>
		</div>
	);
};

/** The story the router's one route renders, handed down past the router. */
const StorySlot = createContext<ComponentType | null>(null);

function SlotRoute() {
	const Story = useContext(StorySlot);
	return Story ? <Story /> : null;
}

/** The app shell's Tailwind sheet, mounted while an app story shows and removed after. */
function useAppSheet() {
	useEffect(() => {
		const style = document.createElement("style");
		style.dataset.storybookApp = "";
		style.textContent = appCSS;
		document.head.append(style);
		return () => style.remove();
	}, []);
}

function AppFrame({ Story, path }: { Story: ComponentType; path: string }) {
	useAppSheet();
	// One router and one query client per mounted story, so no state crosses stories.
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
	);
	const [router] = useState(() =>
		createRouter({
			routeTree: createRootRoute({ component: SlotRoute }),
			history: createMemoryHistory({ initialEntries: [path] }),
		}),
	);
	return (
		<AppProvider
			config={storyAppConfig}
			nav={storyAppNav}
			queryClient={queryClient}
			toaster={false}
		>
			<StorySlot.Provider value={Story}>
				<RouterProvider router={router} />
			</StorySlot.Provider>
		</AppProvider>
	);
}

/**
 * An app story runs inside `AppProvider` with the fixture app's config and
 * nav, under a memory router at `parameters.app.path` (default "/"), with
 * the app's Tailwind sheet mounted. Signed out: a story that needs a user
 * signs one in itself.
 */
export const withApp: Decorator = (Story, context) => {
	if (kindOf(context.title) !== "app") return <Story />;
	const path = (context.parameters.app as { path?: string } | undefined)?.path ?? "/";
	return <AppFrame Story={Story} path={path} />;
};
