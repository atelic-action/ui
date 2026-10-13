/**
 * The transport: how this app talks to its api. Everything technology specific
 * about the wire lives here (base URL, bearer token, proactive and reactive
 * refresh, the snake_case to camelCase transform, error shapes). Resource
 * modules under src/features/<feature>/api.ts build on `apiFetch` and never
 * touch `fetch` themselves; swapping the backend means swapping this file and
 * the session module beside it, not the features. The base URL is the app's
 * `apiBaseUrl`, read on every call.
 */

import { getAppConfig } from "../config";
import { useAuthStore } from "../stores/authStore";
import { ensureValidToken, handleUnauthorized } from "./tokenRefresh";
import { transformKeys } from "./transformKeys";

/**
 * Auth endpoints that should NOT trigger token validation.
 * These endpoints are used during login when no valid token exists.
 */
const AUTH_ENDPOINTS = ["/v1/auth/token"] as const;

/**
 * Check if an endpoint is an auth endpoint that should skip token validation.
 */
function isAuthEndpoint(endpoint: string): boolean {
	const pathname = endpoint.split("?")[0];
	return AUTH_ENDPOINTS.some((authPath) => pathname === authPath);
}

/**
 * The human-readable half of an error response. Rails renders validation
 * failures as an `errors` array (one message per problem) and everything else
 * as a single `error` string, so both shapes have to reach the toast -- without
 * the array, a 422 the server explained carefully shows up as a bare status.
 */
function errorMessage(errorData: unknown, response: Response): string {
	const body = errorData as { error?: string; message?: string; errors?: unknown } | null;

	if (body?.error) return body.error;
	if (body?.message) return body.message;
	if (Array.isArray(body?.errors) && body.errors.length > 0) {
		return body.errors.map((entry) => String(entry)).join(". ");
	}
	return `${response.status} ${response.statusText}`;
}

/**
 * Make a fetch request with the current auth token.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
	const token = useAuthStore.getState().token;

	return fetch(url, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers,
		},
	});
}

/**
 * A read that needs no session: what a public page (see publicRoutes.ts)
 * loads for a visitor who is not signed in. No bearer token, no refresh, no
 * logout on failure; the same error shapes and the same camelCase transform
 * as `apiFetch`. A signed in reader uses it too, since the endpoint serves
 * the same public subset either way and a stale token must never break a
 * page that needs none. GET only by design: nothing public writes.
 */
export async function publicFetch<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${getAppConfig().apiBaseUrl}${endpoint}`, {
		headers: { Accept: "application/json" },
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		throw new Error(`API error: ${errorMessage(errorData, response)}`);
	}

	return transformKeys<T>(await response.json());
}

/**
 * Base fetch wrapper for API calls.
 * Handles authentication headers, proactive token refresh, and 401 retry.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const url = `${getAppConfig().apiBaseUrl}${endpoint}`;
	const skipAuth = isAuthEndpoint(endpoint);

	// Proactive refresh: skip for auth endpoints (login/refresh)
	if (!skipAuth && !(await ensureValidToken())) {
		throw new Error("Session expired. Please log in again.");
	}

	let response = await fetchWithAuth(url, options);

	// Reactive refresh: skip for auth endpoints to avoid refresh loops
	if (!skipAuth && response.status === 401) {
		const refreshed = await handleUnauthorized();
		if (refreshed) {
			// Retry with new token
			response = await fetchWithAuth(url, options);
		} else {
			// Refresh failed, user was logged out
			throw new Error("Session expired. Please log in again.");
		}
	}

	// Handle 401 errors (either from retry or auth endpoints)
	if (response.status === 401) {
		if (!skipAuth) {
			useAuthStore.getState().logout();
		}
		throw new Error("Session expired. Please log in again.");
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		throw new Error(`API error: ${errorMessage(errorData, response)}`);
	}

	const json = await response.json();
	return transformKeys<T>(json);
}

/**
 * POST a multipart/form-data body (e.g. a file upload).
 *
 * Distinct from apiFetch because the browser must set the multipart boundary
 * itself: we deliberately omit Content-Type and pass the FormData through
 * untouched (no JSON.stringify, no toSnakeCase, which would corrupt it). Auth,
 * the proactive/reactive token refresh, and the camelCase response transform
 * all mirror apiFetch.
 */
export async function uploadFormData<T>(endpoint: string, formData: FormData): Promise<T> {
	const url = `${getAppConfig().apiBaseUrl}${endpoint}`;

	if (!(await ensureValidToken())) {
		throw new Error("Session expired. Please log in again.");
	}

	const send = () => {
		const token = useAuthStore.getState().token;
		return fetch(url, {
			method: "POST",
			body: formData,
			headers: { ...(token && { Authorization: `Bearer ${token}` }) },
		});
	};

	let response = await send();

	if (response.status === 401) {
		const refreshed = await handleUnauthorized();
		if (refreshed) {
			response = await send();
		} else {
			throw new Error("Session expired. Please log in again.");
		}
	}

	if (response.status === 401) {
		useAuthStore.getState().logout();
		throw new Error("Session expired. Please log in again.");
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		throw new Error(`API error: ${errorMessage(errorData, response)}`);
	}

	const json = await response.json();
	return transformKeys<T>(json);
}

/**
 * Build a query string from filter parameters.
 * Arrays are joined with commas. Undefined/null values are skipped.
 */
export function buildQueryString(
	params: Record<string, string | number | string[] | undefined | null>,
): string {
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null) continue;
		if (Array.isArray(value)) {
			if (value.length > 0) searchParams.set(key, value.join(","));
		} else {
			searchParams.set(key, String(value));
		}
	}
	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : "";
}
