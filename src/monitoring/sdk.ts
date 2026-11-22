/**
 * The Sentry browser SDK, set up for errors alone, in the one module
 * `startErrorReporting` imports dynamically, so a page downloads it only
 * after first paint and only when a DSN is configured.
 *
 * Built from the SDK's parts rather than `init()`: `init()` pulls in every
 * default integration (breadcrumbs, sessions, the browser API wrappers) even
 * when told not to use them, where a client given its integrations by name
 * bundles only those. No tracing, no replay, no breadcrumbs: breadcrumbs
 * would carry the console, the requests a page makes, and what a reader
 * clicked, none of which an error report needs.
 */
import {
	BrowserClient,
	captureException,
	dedupeIntegration,
	defaultStackParser,
	eventFiltersIntegration,
	functionToStringIntegration,
	globalHandlersIntegration,
	httpContextIntegration,
	linkedErrorsIntegration,
	makeFetchTransport,
	setCurrentClient,
} from "@sentry/browser";
import type { CaughtKind } from "./catcher";

/**
 * Noise the reports leave out, kept short on purpose. An error whose top
 * frame is a browser extension's script is the extension's, not the site's.
 * The two messages are the bridges in app webviews (an email app's or a
 * social app's built in browser) failing between the page and the app.
 */
export const DENY_URLS = [
	/^chrome-extension:\/\//,
	/^moz-extension:\/\//,
	/^safari-(web-)?extension:\/\//,
];
export const IGNORE_ERRORS = [/Java object is gone/, /Error invoking postMessage/];

/**
 * What an event may carry of its request, matching the server reporter: the
 * URL with no query string or fragment, and the user agent. The SDK's own
 * request integration attaches the full URL and the referrer, and a link can
 * carry a reader's personal parameters in either, so they are cut here, the
 * last step before an event leaves the page.
 */
export function scrubRequest<
	T extends {
		request?: { url?: string; headers?: Record<string, string> };
		exception?: { values?: { stacktrace?: { frames?: { filename?: string }[] } }[] };
	},
>(event: T): T {
	// A frame's file is the page itself for an inline script, query and all.
	for (const value of event.exception?.values ?? []) {
		for (const frame of value.stacktrace?.frames ?? []) {
			if (frame.filename) frame.filename = frame.filename.replace(/[?#].*$/, "");
		}
	}
	const request = event.request;
	if (!request) return event;
	if (request.url) {
		try {
			const parsed = new URL(request.url);
			request.url = `${parsed.origin}${parsed.pathname}`;
		} catch {
			delete request.url;
		}
	}
	const agent = request.headers?.["User-Agent"];
	if (agent) request.headers = { "User-Agent": agent };
	else delete request.headers;
	return event;
}

export interface SDKOptions {
	dsn: string;
	release?: string;
	environment?: string;
}

/** Starts the client and returns how an error reaches it, tagged with what raised it. */
export function initSentry({ dsn, release, environment }: SDKOptions) {
	const client = new BrowserClient({
		dsn,
		release,
		environment,
		transport: makeFetchTransport,
		stackParser: defaultStackParser,
		denyUrls: DENY_URLS,
		ignoreErrors: IGNORE_ERRORS,
		beforeSend: scrubRequest,
		integrations: [
			eventFiltersIntegration(),
			functionToStringIntegration(),
			globalHandlersIntegration(),
			linkedErrorsIntegration(),
			dedupeIntegration(),
			httpContextIntegration(),
		],
	});
	setCurrentClient(client);
	client.init();
	return (error: unknown, kind: CaughtKind, early = false) => {
		captureException(error, { tags: { source: kind, ...(early ? { early: "true" } : {}) } });
	};
}
