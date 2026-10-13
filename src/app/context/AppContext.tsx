import { createContext, type ReactNode, useContext, useMemo, useRef } from "react";
import { type AppConfig, getAppConfig } from "../config";
import { configureApp } from "../configure";
import type { NavItem } from "../layout/nav";

interface AppContextValue {
	config: AppConfig;
	nav: NavItem[];
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppConfigProviderProps {
	/** The app's facts: name, mark, storage prefix, public routes, api base URL. */
	config: AppConfig;
	/** The sections and sub pages, in nav order: the one place a destination is declared. */
	nav: NavItem[];
	children: ReactNode;
}

/**
 * The app's config and nav, and nothing else: what the frame (the rail, the
 * tab bar, the menu sheet, a section's cards) reads. `AppProvider` wraps it
 * with the query client, the rail state, the signed in user, and the toaster;
 * a test that mounts one surface can use it alone.
 */
export function AppConfigProvider({ config, nav, children }: AppConfigProviderProps) {
	// Configure synchronously on the first render, and again if the config
	// object changes, so the stores hydrate under the app's prefix before any
	// child reads them.
	const configured = useRef<AppConfig | null>(null);
	if (configured.current !== config) {
		configureApp(config);
		configured.current = config;
	}
	const value = useMemo(() => ({ config, nav }), [config, nav]);
	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** The app's config, from the nearest provider, or as configured with `configureApp`. */
export function useAppConfig(): AppConfig {
	return useContext(AppContext)?.config ?? getAppConfig();
}

/** The app's nav items. Throws outside an `AppProvider` or `AppConfigProvider`. */
export function useNav(): NavItem[] {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useNav must be used within an AppProvider");
	}
	return context.nav;
}
