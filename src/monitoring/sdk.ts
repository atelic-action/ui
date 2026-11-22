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
