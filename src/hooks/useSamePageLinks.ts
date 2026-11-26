import { type RefObject, useEffect } from "react";

/**
 * The query parameters an ad or a campaign adds to a landing address, which
 * say nothing about what the page shows. Any `utm_` parameter is one too.
 */
const TRACKING_PARAMS = new Set([
	"gclid",
	"gbraid",
	"wbraid",
	"gad_source",
	"gad_campaignid",
	"dclid",
	"fbclid",
	"msclkid",
	"ttclid",
	"li_fat_id",
	"twclid",
	"_gl",
	"_ga",
	"mc_cid",
	"mc_eid",
]);

/** A path with its trailing slash dropped, so `/estimate/` reads as `/estimate`; `/` stays `/`. */
function trimSlash(path: string): string {
	return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** A query with the tracking parameters dropped and the rest in one order, for comparing. */
function realQuery(search: string): string {
	const kept = [...new URLSearchParams(search)].filter(
		([key]) => !key.startsWith("utm_") && !TRACKING_PARAMS.has(key),
	);
	return kept
		.map((pair) => new URLSearchParams([pair]).toString())
		.sort()
		.join("&");
}

/**
 * The plain click on a link to the page being read, or nothing when the click
 * should go where the browser sends it. A click with a modifier or another
 * button, one a handler already took over, a link outside `root`, a link that
 * opens elsewhere or downloads, another origin, a protocol link (`tel:`,
 * `mailto:`), a link with a hash (an in page jump), and a link whose query
 * differs once the tracking parameters are set aside all pass through.
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
	if (realQuery(link.search) !== realQuery(here.search)) return false;
	return trimSlash(link.pathname) === trimSlash(here.pathname);
}

/**
 * Puts keyboard focus at the top of the page, on the first `main` inside
 * `root`, without scrolling, so the next Tab starts from there. A `main` that
 * cannot take focus is given `tabindex="-1"` until focus leaves it.
 */
function focusMain(root: Element): void {
	const main = root.querySelector("main");
	if (!main) return;
	if (!main.hasAttribute("tabindex")) {
		main.setAttribute("tabindex", "-1");
		main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
	}
	main.focus({ preventScroll: true });
}

/**
 * Keeps a link to the page being read from loading that page again. A page
 * can hold a visitor's work in progress (a vendor's tool in a frame, a form
 * half filled), and the chrome around it still links to the page itself: the
 * header's call to action, a panel's card, the phone menu's action, a footer
 * link, the contact dock. Followed, any of them reloads the page and throws
 * that work away. So a plain click on one inside `root` is cancelled and the
 * window goes back to the top instead, at once under `prefers-reduced-motion`
 * and smoothly otherwise. The link keeps its look. A visitor who landed from
 * an ad keeps the ad's tracking parameters in the address, and those do not
 * make the page another one.
 *
 * It listens on the document, after React's own handlers, which React adds
 * at its root when it mounts, before this effect runs. So a site's `onClick`
 * that takes the click over is respected, and a menu or a panel has already
 * closed by the time the window scrolls. A click from the keyboard (Enter on
 * the link) also moves focus to the page's `main`, so the next Tab starts at
 * the top; a pointer click leaves focus where it was.
 *
 * The page is compared against `window.location` at the moment of the click,
 * never a path prop, so a site served under a base path needs nothing more.
 * The listener is added in an effect, so a component using it still
 * prerenders. Used by `SiteShell`.
 */
export function useSamePageLinks(root: RefObject<HTMLElement | null>): void {
	useEffect(() => {
		const element = root.current;
		if (!element) return;
		const doc = element.ownerDocument;
		const onClick = (event: MouseEvent) => {
			if (!isSamePageClick(event, element)) return;
			event.preventDefault();
			const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
			window.scrollTo({ top: 0, behavior: still ? "instant" : "smooth" });
			if (event.detail === 0) focusMain(element);
		};
		doc.addEventListener("click", onClick);
		return () => doc.removeEventListener("click", onClick);
	}, [root]);
}
