import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "./fixtures";
import { useAuthStore } from "../../src/app/stores/authStore";
import type { AppUser as User } from "../../src/app/types";

const mockUser = {
	id: "1",
	email: "test@example.com",
	firstName: "Test",
	lastName: "User",
	avatar: null,
} as unknown as User;

describe("authStore", () => {
	beforeEach(() => {
		// Reset store state before each test
		useAuthStore.setState({
			token: null,
			refreshToken: null,
			expiresAt: null,
			user: null,
			isAuthenticated: false,
		});
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("login", () => {
		it("sets token, refreshToken, expiresAt, user, and isAuthenticated", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			useAuthStore.getState().login("access-token", "refresh-token", 3600, mockUser);

			const state = useAuthStore.getState();
			expect(state.token).toBe("access-token");
			expect(state.refreshToken).toBe("refresh-token");
			expect(state.expiresAt).toBe(now + 3600 * 1000);
			expect(state.user).toEqual(mockUser);
			expect(state.isAuthenticated).toBe(true);
		});
	});

	describe("setTokens", () => {
		it("updates token, refreshToken, and expiresAt without changing user", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			// First login
			useAuthStore.getState().login("old-token", "old-refresh", 1800, mockUser);

			// Update tokens
			useAuthStore.getState().setTokens("new-token", "new-refresh", 3600);

			const state = useAuthStore.getState();
			expect(state.token).toBe("new-token");
			expect(state.refreshToken).toBe("new-refresh");
			expect(state.expiresAt).toBe(now + 3600 * 1000);
			expect(state.user).toEqual(mockUser); // User unchanged
			expect(state.isAuthenticated).toBe(true);
		});
	});

	describe("logout", () => {
		it("clears all auth state including refresh token and expiresAt", () => {
			useAuthStore.getState().login("token", "refresh", 3600, mockUser);
			useAuthStore.getState().logout();

			const state = useAuthStore.getState();
			expect(state.token).toBeNull();
			expect(state.refreshToken).toBeNull();
			expect(state.expiresAt).toBeNull();
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("isTokenExpiringSoon", () => {
		it("returns true when expiresAt is null", () => {
			expect(useAuthStore.getState().isTokenExpiringSoon()).toBe(true);
		});

		it("returns true when token expires within buffer time", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			// Token expires in 4 minutes (less than 5 minute buffer)
			useAuthStore.setState({
				expiresAt: now + 4 * 60 * 1000,
				isAuthenticated: true,
			});

			expect(useAuthStore.getState().isTokenExpiringSoon()).toBe(true);
		});

		it("returns false when token has plenty of time", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			// Token expires in 10 minutes (more than 5 minute buffer)
			useAuthStore.setState({
				expiresAt: now + 10 * 60 * 1000,
				isAuthenticated: true,
			});

			expect(useAuthStore.getState().isTokenExpiringSoon()).toBe(false);
		});

		it("respects custom buffer time", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			// Token expires in 2 minutes
			useAuthStore.setState({
				expiresAt: now + 2 * 60 * 1000,
				isAuthenticated: true,
			});

			// With 1 minute buffer, should not be expiring soon
			expect(useAuthStore.getState().isTokenExpiringSoon(60 * 1000)).toBe(false);

			// With 3 minute buffer, should be expiring soon
			expect(useAuthStore.getState().isTokenExpiringSoon(3 * 60 * 1000)).toBe(true);
		});

		it("returns true when token is already expired", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			// Token expired 1 minute ago
			useAuthStore.setState({
				expiresAt: now - 60 * 1000,
				isAuthenticated: true,
			});

			expect(useAuthStore.getState().isTokenExpiringSoon()).toBe(true);
		});
	});

	describe("updateUser", () => {
		it("updates user without affecting tokens", () => {
			const now = Date.now();
			vi.setSystemTime(now);

			useAuthStore.getState().login("token", "refresh", 3600, mockUser);

			const updatedUser = { ...mockUser, firstName: "Updated" };
			useAuthStore.getState().updateUser(updatedUser);

			const state = useAuthStore.getState();
			expect(state.user?.firstName).toBe("Updated");
			expect(state.token).toBe("token");
			expect(state.refreshToken).toBe("refresh");
		});
	});
});
