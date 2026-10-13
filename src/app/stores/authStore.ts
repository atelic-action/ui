import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RegisteredUser } from "../types";
import { appStorage } from "./storage";

export interface AuthState {
	token: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	user: RegisteredUser | null;
	isAuthenticated: boolean;
	login: (token: string, refreshToken: string, expiresIn: number, user: RegisteredUser) => void;
	setTokens: (token: string, refreshToken: string, expiresIn: number) => void;
	logout: () => void;
	updateUser: (user: RegisteredUser) => void;
	isTokenExpiringSoon: (bufferMs?: number) => boolean;
}

/**
 * Default buffer time before token expiry to trigger proactive refresh (5 minutes).
 */
export const DEFAULT_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/**
 * Authentication store with localStorage persistence.
 * Manages JWT token, refresh token, and authenticated user state.
 *
 * Persisted as `<storagePrefix>-auth`. The prefix is the app's, so the store
 * hydrates when the app configures the shell (`AppProvider` or
 * `configureApp`), not when this module loads.
 */
export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			refreshToken: null,
			expiresAt: null,
			user: null,
			isAuthenticated: false,

			login: (token, refreshToken, expiresIn, user) =>
				set({
					token,
					refreshToken,
					expiresAt: Date.now() + expiresIn * 1000,
					user,
					isAuthenticated: true,
				}),

			setTokens: (token, refreshToken, expiresIn) =>
				set({
					token,
					refreshToken,
					expiresAt: Date.now() + expiresIn * 1000,
				}),

			logout: () =>
				set({
					token: null,
					refreshToken: null,
					expiresAt: null,
					user: null,
					isAuthenticated: false,
				}),

			updateUser: (user) => set({ user }),

			isTokenExpiringSoon: (bufferMs = DEFAULT_EXPIRY_BUFFER_MS) => {
				const { expiresAt } = get();
				if (!expiresAt) return true;
				return Date.now() + bufferMs >= expiresAt;
			},
		}),
		{
			name: "auth",
			storage: appStorage,
			skipHydration: true,
		},
	),
);
