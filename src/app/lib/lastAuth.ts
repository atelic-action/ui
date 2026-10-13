/**
 * `<prefix>-last-auth` cookie. Pure UX hint for the welcome back greeting.
 * Does NOT grant any session; the JWT in localStorage does that. Read at the
 * unauthenticated `/` to switch between first time and returning visitor copy;
 * written on every successful sign in.
 */

import { getAppConfig } from "../config";

const cookieName = () => `${getAppConfig().storagePrefix}-last-auth`;
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

export interface LastAuth {
	email: string;
	provider: string;
}

export function readLastAuth(): LastAuth | null {
	if (typeof document === "undefined") return null;

	const name = cookieName();
	const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
	if (!match) return null;

	const raw = match.slice(name.length + 1);
	try {
		const parsed = JSON.parse(decodeURIComponent(raw));
		if (typeof parsed?.email === "string" && typeof parsed?.provider === "string") {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

export function writeLastAuth(value: LastAuth): void {
	if (typeof document === "undefined") return;

	const encoded = encodeURIComponent(JSON.stringify(value));
	const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
	const secureFlag = isSecure ? "; Secure" : "";
	// biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is missing from browsers the app serves
	document.cookie = `${cookieName()}=${encoded}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureFlag}`;
}
