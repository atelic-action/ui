/**
 * Error reporting for a site, in the browser: the early catcher and the
 * start function. The server side is its own built entry,
 * `@atelic-action/ui/monitoring/server`, since a Vercel function imports it
 * uncompiled. README.md, Error Reporting, has the wiring.
 */
export {
	CATCHER_CAP,
	CATCHER_GLOBAL,
	type Catcher,
	type CaughtError,
	type CaughtKind,
	errorCatcherScript,
	installCatcher,
	readCatcher,
	reportError,
} from "./catcher";
export { ErrorCatcherScript } from "./ErrorCatcherScript";
export {
	afterFirstPaint,
	type ErrorReportingOptions,
	LAUNCH_CHECK_MESSAGE,
	startErrorReporting,
	throwLaunchCheck,
} from "./start";
