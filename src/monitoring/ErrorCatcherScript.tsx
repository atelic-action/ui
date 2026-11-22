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
 * The inline early catcher as an element, for a root route's `<head>` ahead
 * of `<HeadContent />` and every other script: it is the page's first script
 * and runs before any other, so an error thrown before the app's own
 * JavaScript is held until `startErrorReporting` hands it to Sentry. React 19
 * hoists the title, the meta tags, the preloads, and the stylesheets ahead of
 * it, which changes nothing it does. With `enabled` false it renders nothing.
 */
export function ErrorCatcherScript({ enabled = true }: ErrorCatcherScriptProps = {}) {
	if (!enabled) return null;
	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: the package's own constant script, no outside input
		<script dangerouslySetInnerHTML={{ __html: errorCatcherScript }} />
	);
}
