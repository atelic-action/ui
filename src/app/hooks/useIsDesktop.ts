import { useSyncExternalStore } from "react";

/** The shell's one breakpoint: the desktop rail appears at Tailwind's `lg`.
 * Every layout decision keyed on viewport reads this, so CSS and React agree. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
		return () => {};
	}
	const media = window.matchMedia(DESKTOP_QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
		return false;
	}
	return window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * True at the desktop breakpoint (lg and up), false below it and in any
 * environment without matchMedia (jsdom), where the mobile layout is the safe
 * default. Backed by matchMedia rather than a resize listener so it flips
 * exactly when the CSS does and never lags a debounce.
 */
export function useIsDesktop(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
