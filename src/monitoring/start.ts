/// <reference types="vite/client" />
import { installCatcher } from "./catcher";

export interface ErrorReportingOptions {
	/** The project's DSN, `VITE_SENTRY_DSN`. With none, nothing is installed or loaded. */
	dsn?: string;
	/** The release the errors are filed under: the build's commit (`import.meta.env.VITE_RELEASE`). */
	release?: string;
	/**
	 * The environment the errors are filed under. Defaults to the build's
	 * `import.meta.env.VITE_ENVIRONMENT`, which `marketingConfig` sets from
	 * `VERCEL_ENV` (production, preview, development), falling back to the
	 * build's mode.
	 */
	environment?: string;
}

/** The message the launch check's error carries, so it is plain in Sentry what it is. */
export const LAUNCH_CHECK_MESSAGE =
	"Atelic error reporting launch check: thrown on purpose from @atelic-action/ui";

/** The environment the site's build names, when it names one. */
function buildEnvironment(): string | undefined {
	try {
		return import.meta.env?.VITE_ENVIRONMENT || undefined;
	} catch {
		return undefined;
	}
}

/** Throws the launch check's error on the next turn, uncaught, from this module. */
export function throwLaunchCheck(): void {
	setTimeout(() => {
		throw new Error(LAUNCH_CHECK_MESSAGE);
	}, 0);
}

/** The longest the SDK waits for first paint before it loads anyway. */
export const LOAD_CAP_MS = 10_000;

/**
 * Runs `task` once, after the first contentful paint, falling back to the
 * load event where the browser cannot report paints (no
 * `PerformanceObserver`, or one without the `paint` entry type), and after
 * ten seconds whatever happens, so a page that never paints still reports.
 * The SDK waits for paint because loaded any earlier it competes with the
 * page's own first paint, which is what a speed test measures.
 */
export function afterFirstPaint(task: () => void, win: Window = window): void {
	let ran = false;
	const once = () => {
		if (ran) return;
		ran = true;
		task();
	};
	const Observer = (win as Window & { PerformanceObserver?: typeof PerformanceObserver })
		.PerformanceObserver;
	let watching = false;
	if (Observer && (Observer.supportedEntryTypes ?? []).includes("paint")) {
		try {
			const observer = new Observer((entries) => {
				if (entries.getEntriesByName("first-contentful-paint").length) {
					observer.disconnect();
					win.setTimeout(once, 0);
				}
			});
			observer.observe({ type: "paint", buffered: true });
			watching = true;
		} catch {
			watching = false;
		}
	}
	if (!watching) {
		if (win.document.readyState === "complete") win.setTimeout(once, 0);
		else win.addEventListener("load", once, { once: true });
	}
	win.setTimeout(once, LOAD_CAP_MS);
}

/**
 * Starts error reporting in the browser: errors only, never tracing.
 *
 * At once it makes sure the early catcher is listening (the inline script
 * from the root route, or one installed here), so nothing thrown before the
 * SDK arrives is lost. After first paint it loads the SDK, set up for errors
 * alone, replays what the catcher held (each tagged `early`), hands the
 * catcher's later errors to the SDK, and takes the catcher's own listeners
 * off, since the SDK's global handlers listen from then on and an error
 * must never be reported twice.
 *
 * With no `dsn` it does nothing and loads nothing. Call it once, in the
 * browser (a site's router module, guarded by `typeof window`).
 */
export function startErrorReporting({
	dsn,
	release,
	environment = buildEnvironment(),
}: ErrorReportingOptions): void {
	if (!dsn || typeof window === "undefined") return;
	const win = window;
	const catcher = installCatcher(win);
	catcher.test = throwLaunchCheck;
	afterFirstPaint(() => {
		import("./sdk")
			.then(({ initSentry }) => {
				const capture = initSentry({ dsn, release, environment });
				win.removeEventListener("error", catcher.onError);
				win.removeEventListener("unhandledrejection", catcher.onRejection);
				catcher.report = (error, kind) => capture(error, kind);
				const held = catcher.q.splice(0, catcher.q.length);
				for (const item of held) capture(item.error, item.kind, true, catcher.dropped);
			})
			.catch(() => {
				// The SDK failed to load (offline, blocked by a content blocker):
				// the catcher keeps holding, and the page is none the worse.
			});
	}, win);
}
