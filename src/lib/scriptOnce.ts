/**
 * A vendor's script, added to the page once per `src`. The pattern is the
 * one `turnstile.ts` and `googlePlaces.ts` follow: a record shared by every
 * caller on the page, an `async` tag in the head, a tag that fails taken
 * back out so a later caller tries again, and a refusal where there is no
 * window (a prerender). Nothing here touches `window` or `document` at
 * module scope, so a component that calls it still prerenders.
 */

/** Every script added, by its `src`. */
const added = new Map<string, HTMLScriptElement>();

/** A tag with this exact `src` already on the page, put there by anyone. */
function onPage(src: string): HTMLScriptElement | undefined {
	return Array.from(document.scripts).find((script) => script.getAttribute("src") === src);
}

/**
 * The script for `src`: the one already added, or already on the page, or a
 * new `async` tag appended to the head. A strict mode effect run twice, a
 * remount, and a second component on the page all get the same tag, so the
 * vendor's code runs once. A tag that failed is taken off the page and
 * forgotten, so the next call adds a fresh one. Throws where there is no
 * window.
 */
export function addScriptOnce(src: string): HTMLScriptElement {
	if (typeof window === "undefined") {
		throw new Error("A vendor script is added only in a browser");
	}
	const known = added.get(src);
	if (known?.isConnected) return known;
	added.delete(src);
	const existing = onPage(src);
	if (existing) {
		added.set(src, existing);
		return existing;
	}
	const script = document.createElement("script");
	script.src = src;
	script.async = true;
	script.addEventListener(
		"error",
		() => {
			if (added.get(src) === script) added.delete(src);
			script.remove();
		},
		{ once: true },
	);
	added.set(src, script);
	document.head.appendChild(script);
	return script;
}
