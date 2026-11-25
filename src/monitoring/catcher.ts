/**
 * The early catcher: the buffer every error lands in before the Sentry SDK
 * has loaded, on one well known global, so an error thrown in the first
 * moments of a page (before first paint, before the app's own script runs)
 * is held rather than lost. Two things install it, to the same contract:
 * the inline script a site's root route sets first in `<head>`
 * (`errorCatcherScript`), and `installCatcher`, which `startErrorReporting`
 * calls in case the page has no inline script. Whichever runs first wins;
 * the other sees the global and leaves it alone.
 *
 * Nothing here imports the SDK or touches `window` at module scope, so the
 * module is safe in a prerender and costs a page next to nothing.
 */

/** The global the catcher lives on. */
export const CATCHER_GLOBAL = "__atelicErrors";

/** How many errors the buffer holds before it counts the rest as dropped. */
export const CATCHER_CAP = 20;

/**
 * What raised a held error: the window's error event, an unhandled
 * rejection, a render crash, or a failure a component caught and handled
 * itself, reported so it is never silent (`handled`, 9.2.0: the contact
 * form's spam check failing to load, the form sending anyway).
 */
export type CaughtKind = "error" | "unhandledrejection" | "boundary" | "handled";

/** One held error: what was thrown (an Error, a reason, or a message), how, and when. */
export interface CaughtError {
	error: unknown;
	kind: CaughtKind;
	at: number;
}

/** The catcher, as the inline script and `installCatcher` both shape it. */
export interface Catcher {
	q: CaughtError[];
	max: number;
	/** Errors past the cap, counted and let go. */
	dropped: number;
	push: (error: unknown, kind: CaughtKind) => void;
	onError: (event: ErrorEvent) => void;
	onRejection: (event: PromiseRejectionEvent) => void;
	/** Set once the SDK is up: every error from then on goes straight to it. */
	report?: (error: unknown, kind: CaughtKind) => void;
	/**
	 * The launch check, set once reporting starts: throws a clearly named
	 * error from the package's own code on the next turn, uncaught, so a
	 * site can confirm in Sentry that it arrives with a readable, source
	 * mapped stack. Run `window.__atelicErrors.test()` in the console.
	 */
	test?: () => void;
}

type CatcherWindow = Window & { [CATCHER_GLOBAL]?: Catcher };

/**
 * The inline catcher, as a script for the first place in `<head>`: ES5, no
 * dependencies, and the same shape `installCatcher` builds. It holds up to
 * twenty errors and rejections and counts the rest. `ErrorCatcherScript`
 * renders it; a site that builds its head another way inlines the string.
 */
export const errorCatcherScript =
	`(function(w){if(!w||w.${CATCHER_GLOBAL})return;` +
	`var q=[],c={q:q,max:${CATCHER_CAP},dropped:0};` +
	"c.push=function(e,k){if(q.length<c.max)q.push({error:e,kind:k,at:+new Date()});else c.dropped++};" +
	'c.onError=function(v){c.push(v&&v.error!=null?v.error:v&&v.message,"error")};' +
	'c.onRejection=function(v){c.push(v?v.reason:v,"unhandledrejection")};' +
	'w.addEventListener("error",c.onError);' +
	'w.addEventListener("unhandledrejection",c.onRejection);' +
	`w.${CATCHER_GLOBAL}=c})(window);`;

/** The catcher on this window, when one is installed. */
export function readCatcher(win: Window): Catcher | undefined {
	return (win as CatcherWindow)[CATCHER_GLOBAL];
}

/**
 * Installs the catcher on a window that has none and returns it, or returns
 * the one already there (the inline script's). Browser only: call it from an
 * effect or a start function, never during a render.
 */
export function installCatcher(win: Window): Catcher {
	const existing = readCatcher(win);
	if (existing) return existing;
	const q: CaughtError[] = [];
	const catcher: Catcher = {
		q,
		max: CATCHER_CAP,
		dropped: 0,
		push(error, kind) {
			if (q.length < catcher.max) q.push({ error, kind, at: Date.now() });
			else catcher.dropped++;
		},
		onError(event) {
			catcher.push(event?.error != null ? event.error : event?.message, "error");
		},
		onRejection(event) {
			catcher.push(event ? event.reason : event, "unhandledrejection");
		},
	};
	win.addEventListener("error", catcher.onError);
	win.addEventListener("unhandledrejection", catcher.onRejection);
	(win as CatcherWindow)[CATCHER_GLOBAL] = catcher;
	return catcher;
}

/**
 * Hands an error to whatever is listening: the SDK once it has loaded, the
 * buffer before that. For an error the window never sees, such as a render
 * crash an error boundary catches. A page where reporting was never started
 * and no inline catcher runs has nothing listening, so the error is let go
 * quietly rather than held by a catcher nobody will read. A no op where
 * there is no window (a prerender).
 */
export function reportError(error: unknown, kind: CaughtKind = "boundary"): void {
	if (typeof window === "undefined") return;
	const catcher = readCatcher(window);
	if (!catcher) return;
	if (catcher.report) catcher.report(error, kind);
	else catcher.push(error, kind);
}
