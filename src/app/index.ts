/**
 * The app shell: the frame (rail, tab bar, menu sheet), the `AppPage`
 * scaffold, the provider that hands the shell the app's config and nav, the
 * signed in user, the transport and session, and the stores they share. The
 * shadcn kit is its own entry, `@atelic-action/ui/app/ui`.
 */

// The provider, the config, and the frame
export { AppProvider, type AppProviderProps } from "./AppProvider";
export { AuthGuard } from "./AuthGuard";
export { CardErrorBoundary } from "./CardErrorBoundary";
export { type AppConfig, getAppConfig } from "./config";
export { configureApp } from "./configure";
export {
	AppConfigProvider,
	type AppConfigProviderProps,
	useAppConfig,
	useNav,
} from "./context/AppContext";
export { SidebarProvider, useRail, useSidebar } from "./context/SidebarContext";
export { type UserContextValue, UserProvider, useUser } from "./context/UserContext";
export { ErrorFallback, type ErrorFallbackProps } from "./ErrorFallback";
export { GoogleGlyph } from "./GoogleGlyph";
// Hooks
export { useDebounce } from "./hooks/useDebounce";
export { DESKTOP_QUERY, useIsDesktop } from "./hooks/useIsDesktop";
export { useWakeLock } from "./hooks/useWakeLock";
export * from "./layout";
export { avatarInitials, displayName } from "./layout/identity";
// The library: dates and phrasing, the transport, the session, units
export * from "./lib/dates";
export { type AppEnv, envSchema, parseEnv } from "./lib/env";
export * from "./lib/format";
export { apiFetch, buildQueryString, publicFetch, uploadFormData } from "./lib/http";
export { type LastAuth, readLastAuth, writeLastAuth } from "./lib/lastAuth";
export { postNavigate, startGoogleAuth } from "./lib/oauth";
export { isPublicPage, isPublicRoute } from "./lib/publicRoutes";
export { queryClient } from "./lib/queryClient";
export { matchesSearch } from "./lib/search";
export { session } from "./lib/session";
export {
	ensureValidToken,
	handleUnauthorized,
	refreshAccessToken,
	resetRefreshState,
} from "./lib/tokenRefresh";
export { toSnakeCase, transformKeys } from "./lib/transformKeys";
export * from "./lib/units";
export * from "./lib/unwrap";
export { cn } from "./lib/utils";
// The stores
export { type AuthState, DEFAULT_EXPIRY_BUFFER_MS, useAuthStore } from "./stores/authStore";
export { DEFAULT_SYSTEMS, type UnitsState, useUnitsStore } from "./stores/unitsStore";
// The wire protocol and the user
export type {
	AppUser,
	PaginatedResponse,
	PaginationLinks,
	RefreshResponse,
	Register,
	RegisteredUser,
	TokenResponse,
} from "./types";
export type { ToastMeta } from "./types/query";
