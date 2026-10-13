import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppConfigProvider, type AppConfigProviderProps } from "./context/AppContext";
import { SidebarProvider } from "./context/SidebarContext";
import { UserProvider } from "./context/UserContext";
import { queryClient as defaultQueryClient } from "./lib/queryClient";

export interface AppProviderProps extends AppConfigProviderProps {
	/** The query client. Defaults to the shell's, whose mutation cache raises `meta.toast`. */
	queryClient?: QueryClient;
	/** The toaster the shell's toasts land in. Defaults to sonner's, top right; `false` renders none. */
	toaster?: ReactNode | false;
}

/**
 * Everything the shell needs above the router: the app's config and nav, the
 * query client, the rail state, the signed in user, and the toaster. Render
 * it once, around the `RouterProvider`, so the stores are hydrated before the
 * first route loads; the root route then renders `AuthGuard` and `AppLayout`.
 */
export function AppProvider({
	config,
	nav,
	queryClient = defaultQueryClient,
	toaster,
	children,
}: AppProviderProps) {
	return (
		<AppConfigProvider config={config} nav={nav}>
			<QueryClientProvider client={queryClient}>
				<SidebarProvider>
					<UserProvider>
						{children}
						{toaster === undefined ? <Toaster position="top-right" richColors /> : toaster || null}
					</UserProvider>
				</SidebarProvider>
			</QueryClientProvider>
		</AppConfigProvider>
	);
}
