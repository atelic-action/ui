/**
 * Token refresh module for automatic JWT token refresh.
 * Handles both proactive (before expiry) and reactive (on 401) refresh.
 */

import { getAppConfig } from "../config";
import { DEFAULT_EXPIRY_BUFFER_MS, useAuthStore } from "../stores/authStore";
import type { RefreshResponse } from "../types";
import { transformKeys } from "./transformKeys";

/**
 * Module level promise for deduplicating concurrent refresh requests.
 * Only one refresh request will be in flight at a time.
 */
let refreshPromise: Promise<RefreshResponse> | null = null;

/**
 * Refresh the access token using the stored refresh token.
 * Deduplicates concurrent calls to ensure only one refresh request is made.
 *
 * @returns The new token response with updated access and refresh tokens
 * @throws Error if refresh fails (expired refresh token, network error, etc.)
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
	// Return existing promise if refresh is already in progress
	if (refreshPromise) {
		return refreshPromise;
	}

	const { refreshToken, logout } = useAuthStore.getState();

	if (!refreshToken) {
		logout();
		throw new Error("No refresh token available");
	}

	refreshPromise = (async () => {
		try {
			const response = await fetch(`${getAppConfig().apiBaseUrl}/v1/auth/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				// The Rails API reads params[:refresh_token], so the body must be
				// snake_case. This raw fetch does not run through apiFetch's
				// toSnakeCase, so name the field explicitly here.
				body: JSON.stringify({ refresh_token: refreshToken }),
			});

			if (!response.ok) {
				throw new Error(`Refresh failed: ${response.status}`);
			}

			const data = await response.json();
			const result = transformKeys<RefreshResponse>(data);

			// Update store with new tokens
			useAuthStore.getState().setTokens(result.token, result.refreshToken, result.expiresIn);

			return result;
		} catch (error) {
			// Logout on refresh failure
			logout();
			throw error;
		}
	})();

	// Clear the promise after it settles for all consumers.
	// The .catch() prevents unhandled rejection warnings since we're not awaiting this chain.
	refreshPromise
		.finally(() => {
			refreshPromise = null;
		})
		.catch(() => {});

	return refreshPromise;
}

/**
 * Ensure the access token is valid before making an API call.
 * Proactively refreshes the token if it is expiring soon.
 *
 * @param bufferMs Time before expiry to trigger refresh (default 5 minutes)
 * @returns true if token is valid (or was refreshed), false if logout occurred
 */
export async function ensureValidToken(bufferMs = DEFAULT_EXPIRY_BUFFER_MS): Promise<boolean> {
	const { isAuthenticated, isTokenExpiringSoon } = useAuthStore.getState();

	// Not authenticated, nothing to refresh
	if (!isAuthenticated) {
		return false;
	}

	// Token is still valid
	if (!isTokenExpiringSoon(bufferMs)) {
		return true;
	}

	// Token is expiring soon, attempt refresh
	try {
		await refreshAccessToken();
		return true;
	} catch {
		// Refresh failed, user was logged out
		return false;
	}
}

/**
 * Handle a 401 Unauthorized response by attempting to refresh the token.
 * Used for reactive refresh when the server rejects an expired token.
 *
 * @returns true if refresh succeeded and request should be retried, false if logout occurred
 */
export async function handleUnauthorized(): Promise<boolean> {
	try {
		await refreshAccessToken();
		return true;
	} catch {
		// Refresh failed, user was logged out by refreshAccessToken
		return false;
	}
}

/**
 * Reset the refresh promise (for testing purposes).
 */
export function resetRefreshState(): void {
	refreshPromise = null;
}
