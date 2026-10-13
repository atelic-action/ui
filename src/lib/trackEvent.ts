/**
 * Sends one GA4 event through the Google tag a site loads, and nothing else:
 * the tag itself, and the delegated listener for the click events, stay in
 * the site. A silent no op when the tag is absent (no tag id configured, the
 * script blocked, prerender with no window), and it never throws, since
 * analytics must never break the page. Beacon transport, so an event fired on
 * the way out of the page survives the navigation.
 *
 * Params are closed vocabularies: never a name, a phone number, an email
 * address, or a message.
 */

type Gtag = (...args: unknown[]) => void;

export type EventParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params: EventParams = {}): void {
	if (typeof window === "undefined") return;
	try {
		const gtag = (window as Window & { gtag?: Gtag }).gtag;
		if (typeof gtag !== "function") return;
		gtag("event", name, { ...params, transport_type: "beacon" });
	} catch {
		// Analytics must never break the page.
	}
}
