import { type RefObject, useEffect } from "react";

/** A path with its trailing slash dropped, so `/estimate/` reads as `/estimate`; `/` stays `/`. */
function trimSlash(path: string): string {
	return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * The plain click on a link to the page being read, or nothing when the click
 * should go where the browser sends it. A click with a modifier or another
 * button, a link that opens elsewhere or downloads, another origin, a
 * protocol link (`tel:`, `mailto:`), a link with a hash (an in page jump),
 * and a link with another query all pass through untouched.
 */
export function isSamePageClick(event: MouseEvent, root: Element): boolean {
	if (event.defaultPrevented || event.button !== 0) return false;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
	const target = event.target;
	if (!(target instanceof Element)) return false;
	const link = target.closest("a[href]");
	if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) return false;
	if (link.target && link.target !== "_self") return false;
	if (link.hasAttribute("download")) return false;
	if (link.protocol !== "http:" && link.protocol !== "https:") return false;
	const here = window.location;
	if (link.origin !== here.origin) return false;
	if (link.href.includes("#")) return false;
	if (link.search !== here.search) return false;
	return trimSlash(link.pathname) === trimSlash(here.pathname);
}

/**
 * Keeps a link to the page being read from loading that page again. A page
 * can hold a visitor's work in progress (a vendor's tool in a frame, a form
 * half filled), and the chrome around it still links to the page itself: the
 * header's call to action, a panel's card, the phone menu's action, a footer
 * link, the contact dock. Followed, any of them reloads the page and throws
 * that work away. So a plain click on one inside `root` is cancelled and the
 * window goes back to the top instead, at once under `prefers-reduced-motion`
 * and smoothly otherwise. The link keeps its look, and a menu still closes,
 * since its own click handler runs as before.
 *
 * The page is compared against `window.location` at the moment of the click,
 * never a path prop, so a site served under a base path needs nothing more.
 * It listens with one native listener on the root, added in an effect, so a
 * component using it still prerenders. Used by `SiteShell`.
 */
export function useSamePageLinks(root: RefObject<HTMLElement | null>): void {
	useEffect(() => {
		const element = root.current;
		if (!element) return;
		const onClick = (event: MouseEvent) => {
			if (!isSamePageClick(event, element)) return;
			event.preventDefault();
			const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
			window.scrollTo({ top: 0, behavior: still ? "instant" : "smooth" });
		};
		element.addEventListener("click", onClick);
		return () => element.removeEventListener("click", onClick);
	}, [root]);
}
