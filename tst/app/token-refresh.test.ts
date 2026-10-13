import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./fixtures";
import {
	ensureValidToken,
	handleUnauthorized,
	refreshAccessToken,
	resetRefreshState,
} from "../../src/app/lib/tokenRefresh";
import { useAuthStore } from "../../src/app/stores/authStore";

// Store original fetch
const originalFetch = global.fetch;

describe("tokenRefresh", () => {
	let mockFetch: Mock;

	beforeEach(() => {
		vi.useFakeTimers();
		mockFetch = vi.fn();
		global.fetch = mockFetch as typeof fetch;
		resetRefreshState();

		// Reset store state
		useAuthStore.setState({
			token: "valid-token",
			refreshToken: "valid-refresh-token",
			expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
			user: null,
			isAuthenticated: true,
		});
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.useRealTimers();
	});

	describe("refreshAccessToken", () => {
		it("calls refresh endpoint with refresh token", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						token: "new-access-token",
						refresh_token: "new-refresh-token",
						expires_in: 3600,
					}),
			});

			const result = await refreshAccessToken();

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/v1/auth/refresh"),
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refresh_token: "valid-refresh-token" }),
				}),
			);
			expect(result).toEqual({
				token: "new-access-token",
				refreshToken: "new-refresh-token",
				expiresIn: 3600,
			});
		});

		// Regression: the Rails API reads params[:refresh_token]. Sending the
		// camelCase key (refreshToken) makes Rails see a blank param, return 400,
		// and log the user out on every silent refresh. Pin the wire field name so
		// a future camelCase slip fails here instead of in production.
		it("sends the refresh token under the snake_case field Rails expects", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						token: "new-access-token",
						refresh_token: "new-refresh-token",
						expires_in: 3600,
					}),
			});

			await refreshAccessToken();

			const [, init] = mockFetch.mock.calls[0];
			const body = JSON.parse(init.body);
			expect(body).toHaveProperty("refresh_token", "valid-refresh-token");
			expect(body).not.toHaveProperty("refreshToken");
		});

		it("updates store with new tokens", async () => {
			const now = Date.now();
			vi.setSystemTime(now);

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						token: "new-access-token",
						refresh_token: "new-refresh-token",
						expires_in: 3600,
					}),
			});

			await refreshAccessToken();

			const state = useAuthStore.getState();
			expect(state.token).toBe("new-access-token");
			expect(state.refreshToken).toBe("new-refresh-token");
			expect(state.expiresAt).toBe(now + 3600 * 1000);
		});

		it("deduplicates concurrent refresh calls", async () => {
			let resolveFetch: ((value: unknown) => void) | undefined;
			const fetchPromise = new Promise((resolve) => {
				resolveFetch = resolve;
			});
			mockFetch.mockReturnValue(fetchPromise);

			// Start two concurrent refresh calls
			const promise1 = refreshAccessToken();
			const promise2 = refreshAccessToken();

			// The fetch should have been called only once
			expect(mockFetch).toHaveBeenCalledTimes(1);

			// Now, resolve the fetch promise
			if (resolveFetch) {
				resolveFetch({
					ok: true,
					json: () =>
						Promise.resolve({
							token: "new-token",
							refresh_token: "new-refresh",
							expires_in: 3600,
						}),
				});
			}

			// Both should resolve to the same result
			const [result1, result2] = await Promise.all([promise1, promise2]);

			expect(result1).toEqual(result2);
		});

		it("logs out on refresh failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			await expect(refreshAccessToken()).rejects.toThrow("Refresh failed: 401");

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.token).toBeNull();
		});

		it("keeps the session through a network failure or a server error", async () => {
			mockFetch.mockRejectedValueOnce(new TypeError("offline"));
			await expect(refreshAccessToken()).rejects.toThrow("offline");
			expect(useAuthStore.getState().isAuthenticated).toBe(true);

			mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
			await expect(refreshAccessToken()).rejects.toThrow("Refresh failed: 503");
			expect(useAuthStore.getState().isAuthenticated).toBe(true);
		});

		it("does not write tokens back after a sign out during the refresh", async () => {
			mockFetch.mockImplementationOnce(async () => {
				useAuthStore.getState().logout();
				return {
					ok: true,
					json: () =>
						Promise.resolve({ token: "late", refresh_token: "late-refresh", expires_in: 3600 }),
				};
			});

			await expect(refreshAccessToken()).rejects.toThrow("Signed out");
			expect(useAuthStore.getState().token).toBeNull();
			expect(useAuthStore.getState().isAuthenticated).toBe(false);
		});

		it("logs out when no refresh token available", async () => {
			useAuthStore.setState({ refreshToken: null });

			await expect(refreshAccessToken()).rejects.toThrow("No refresh token available");

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("ensureValidToken", () => {
		it("returns true when token is valid and not expiring soon", async () => {
			// Token expires in 10 minutes (beyond 5 minute buffer)
			useAuthStore.setState({
				expiresAt: Date.now() + 10 * 60 * 1000,
				isAuthenticated: true,
			});

			const result = await ensureValidToken();

			expect(result).toBe(true);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("refreshes token when expiring soon", async () => {
			// Token expires in 4 minutes (within 5 minute buffer)
			useAuthStore.setState({
				expiresAt: Date.now() + 4 * 60 * 1000,
				isAuthenticated: true,
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						token: "new-token",
						refresh_token: "new-refresh",
						expires_in: 3600,
					}),
			});

			const result = await ensureValidToken();

			expect(result).toBe(true);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("returns false when not authenticated", async () => {
			useAuthStore.setState({ isAuthenticated: false });

			const result = await ensureValidToken();

			expect(result).toBe(false);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("returns false when refresh fails", async () => {
			// Token expires in 1 minute
			useAuthStore.setState({
				expiresAt: Date.now() + 60 * 1000,
				isAuthenticated: true,
			});

			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await ensureValidToken();

			expect(result).toBe(false);
		});

		it("lets the call through on a network failure while the token still serves", async () => {
			useAuthStore.setState({ expiresAt: Date.now() + 4 * 60 * 1000, isAuthenticated: true });
			mockFetch.mockRejectedValueOnce(new TypeError("offline"));

			expect(await ensureValidToken()).toBe(true);
			expect(useAuthStore.getState().isAuthenticated).toBe(true);
		});

		it("respects custom buffer time", async () => {
			// Token expires in 2 minutes
			useAuthStore.setState({
				expiresAt: Date.now() + 2 * 60 * 1000,
				isAuthenticated: true,
			});

			// With 1 minute buffer, should not refresh
			const result = await ensureValidToken(60 * 1000);

			expect(result).toBe(true);
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("handleUnauthorized", () => {
		it("refreshes token and returns true on success", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						token: "new-token",
						refresh_token: "new-refresh",
						expires_in: 3600,
					}),
			});

			const result = await handleUnauthorized();

			expect(result).toBe(true);
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("returns false and logs out when no refresh token", async () => {
			useAuthStore.setState({ refreshToken: null });

			const result = await handleUnauthorized();

			expect(result).toBe(false);
			expect(useAuthStore.getState().isAuthenticated).toBe(false);
		});

		it("returns false when refresh fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await handleUnauthorized();

			expect(result).toBe(false);
			expect(useAuthStore.getState().isAuthenticated).toBe(false);
		});
	});
});
