import { errorCatcherScript } from "./catcher";

export interface ErrorCatcherScriptProps {
	/**
	 * Whether the catcher renders at all. Defaults to true. A root route
	 * passes whether the build has a DSN (`enabled={Boolean(env.VITE_SENTRY_DSN)}`),
	 * so a site built without one ships no catcher holding errors nobody reads.
	 */
	enabled?: boolean;
}

/**
 * The inline early catcher as an element, for the first place in a root
 * route's `<head>`, ahead of `<HeadContent />`: it runs before any other
 * script, so an error thrown before the app's own JavaScript is held until
 * `startErrorReporting` hands it to Sentry. It is a few hundred bytes, well
 * inside the first kilobyte a browser scans for the charset. With `enabled`
 * false it renders nothing.
 */
export function ErrorCatcherScript({ enabled = true }: ErrorCatcherScriptProps = {}) {
	if (!enabled) return null;
	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: the package's own constant script, no outside input
		<script dangerouslySetInnerHTML={{ __html: errorCatcherScript }} />
	);
}
