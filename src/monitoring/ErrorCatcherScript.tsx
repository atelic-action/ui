import { errorCatcherScript } from "./catcher";

/**
 * The inline early catcher as an element, for the first place in a root
 * route's `<head>`, ahead of `<HeadContent />`: it runs before any other
 * script, so an error thrown before the app's own JavaScript is held until
 * `startErrorReporting` hands it to Sentry. It is a few hundred bytes, well
 * inside the first kilobyte a browser scans for the charset.
 */
export function ErrorCatcherScript() {
	return (
		// biome-ignore lint/security/noDangerouslySetInnerHtml: the package's own constant script, no outside input
		<script dangerouslySetInnerHTML={{ __html: errorCatcherScript }} />
	);
}
