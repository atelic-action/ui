import { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../src/app";
import { demoUser } from "./data";

/**
 * The gallery's query client. Nothing here talks to an api, so the signed in
 * user is seeded into the cache and never goes stale, and nothing retries.
 */
export const galleryQueryClient = new QueryClient({
	defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
});

const A_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Sign the made up owner in, the way the OAuth callback would. */
export function signIn() {
	galleryQueryClient.setQueryData(["user", "me"], demoUser);
	useAuthStore.getState().login("gallery", "gallery", A_YEAR_IN_SECONDS, demoUser);
}

/** Sign out, the way the shell's own Log out does. */
export function signOut() {
	useAuthStore.getState().logout();
	galleryQueryClient.removeQueries({ queryKey: ["user", "me"] });
}
