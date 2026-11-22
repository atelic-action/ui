import { errorCatcherScript, readCatcher } from "../../src/monitoring/catcher";

const { capture, initSentry } = vi.hoisted(() => {
	const capture = vi.fn();
	return { capture, initSentry: vi.fn((_options: unknown) => capture) };
});
vi.mock("../../src/monitoring/sdk", () => ({ initSentry }));

import { afterFirstPaint, startErrorReporting } from "../../src/monitoring/start";

function clear() {
	const catcher = readCatcher(window);
	if (catcher) {
		window.removeEventListener("error", catcher.onError);
		window.removeEventListener("unhandledrejection", catcher.onRejection);
	}
	delete (window as { __atelicErrors?: unknown }).__atelicErrors;
}

function rejectOnWindow(reason: unknown) {
	const event = new Event("unhandledrejection") as Event & { reason: unknown };
	event.reason = reason;
	window.dispatchEvent(event);
}

/** Lets the timers and the SDK's dynamic import settle. */
async function settle() {
	await new Promise((resolve) => setTimeout(resolve, 0));
	await vi.waitFor(() => expect(initSentry).toHaveBeenCalled());
	await new Promise((resolve) => setTimeout(resolve, 0));
}

/** Runs the inline script on the test's window, as the page's first script would. */
function runInline() {
	// biome-ignore lint/security/noGlobalEval: the package's own constant script, run as a page would run it
	window.eval(errorCatcherScript);
}

describe("startErrorReporting", () => {
	beforeEach(() => {
		clear();
		capture.mockClear();
		initSentry.mockClear();
	});
	afterEach(clear);

	it("with no DSN installs nothing and loads nothing", async () => {
		startErrorReporting({});
		startErrorReporting({ dsn: "" });
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(readCatcher(window)).toBeUndefined();
		expect(initSentry).not.toHaveBeenCalled();
	});

	it("replays what the inline script held before it started, each marked early, and reports nothing twice", async () => {
		runInline();
		const early = new Error("thrown before the app ran");
		window.dispatchEvent(new ErrorEvent("error", { error: early, message: early.message }));
		rejectOnWindow("rejected before the app ran");

		startErrorReporting({ dsn: "https://key@o1.ingest.example.com/42", release: "abc123" });
		await settle();

		expect(initSentry).toHaveBeenCalledWith({
			dsn: "https://key@o1.ingest.example.com/42",
			release: "abc123",
			environment: undefined,
		});
		expect(capture.mock.calls).toEqual([
			[early, "error", true],
			["rejected before the app ran", "unhandledrejection", true],
		]);
		const catcher = readCatcher(window);
		expect(catcher?.q).toHaveLength(0);

		// The catcher's own listeners are off: the SDK's handlers have the window now.
		const quiet = (event: Event) => event.preventDefault();
		window.addEventListener("error", quiet);
		window.dispatchEvent(new ErrorEvent("error", { error: new Error("later"), cancelable: true }));
		window.removeEventListener("error", quiet);
		expect(catcher?.q).toHaveLength(0);
		expect(capture).toHaveBeenCalledTimes(2);

		// An error handed over by hand (a boundary's) goes straight to the SDK, not early.
		const crash = new Error("render crash");
		catcher?.report?.(crash, "boundary");
		expect(capture).toHaveBeenLastCalledWith(crash, "boundary");
	});

	it("installs the catcher itself when the page has no inline script", async () => {
		startErrorReporting({ dsn: "https://key@o1.ingest.example.com/42" });
		const catcher = readCatcher(window);
		expect(catcher).toBeDefined();
		rejectOnWindow("before the SDK");
		await settle();
		expect(capture).toHaveBeenCalledWith("before the SDK", "unhandledrejection", true);
	});
});

describe("afterFirstPaint", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	/** A stand in window: a document state, timers, and listeners, and whatever observer it is given. */
	function fakeWindow(readyState: string, Observer?: unknown) {
		const target = new EventTarget();
		return Object.assign(target, {
			document: { readyState },
			setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
			PerformanceObserver: Observer,
		}) as unknown as Window;
	}

	it("falls back to the load event when the observer cannot report paints", () => {
		vi.useFakeTimers();
		const Observer = Object.assign(vi.fn(), { supportedEntryTypes: ["resource"] });
		const win = fakeWindow("loading", Observer);
		const task = vi.fn();
		afterFirstPaint(task, win);
		expect(Observer).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(task).not.toHaveBeenCalled();
		win.dispatchEvent(new Event("load"));
		expect(task).toHaveBeenCalledOnce();
		vi.advanceTimersByTime(20_000);
		expect(task).toHaveBeenCalledOnce();
	});

	it("falls back to the load event with no observer at all, and runs at once on a loaded page", () => {
		vi.useFakeTimers();
		const loading = fakeWindow("loading");
		const first = vi.fn();
		afterFirstPaint(first, loading);
		loading.dispatchEvent(new Event("load"));
		expect(first).toHaveBeenCalledOnce();

		const loaded = fakeWindow("complete");
		const second = vi.fn();
		afterFirstPaint(second, loaded);
		vi.advanceTimersByTime(0);
		expect(second).toHaveBeenCalledOnce();
	});

	it("runs after ten seconds whatever happens", () => {
		vi.useFakeTimers();
		const win = fakeWindow("loading");
		const task = vi.fn();
		afterFirstPaint(task, win);
		vi.advanceTimersByTime(9_999);
		expect(task).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(task).toHaveBeenCalledOnce();
	});

	it("waits for first contentful paint where the observer reports paints", () => {
		vi.useFakeTimers();
		let callback: ((list: { getEntriesByName: (name: string) => unknown[] }) => void) | undefined;
		const observe = vi.fn();
		const Observer = Object.assign(
			vi.fn(function (this: unknown, fn: typeof callback) {
				callback = fn;
				return { observe, disconnect: vi.fn() };
			}),
			{ supportedEntryTypes: ["paint"] },
		);
		const win = fakeWindow("loading", Observer);
		const task = vi.fn();
		afterFirstPaint(task, win);
		expect(observe).toHaveBeenCalledWith({ type: "paint", buffered: true });
		win.dispatchEvent(new Event("load"));
		vi.advanceTimersByTime(0);
		expect(task).not.toHaveBeenCalled();
		callback?.({ getEntriesByName: (name) => (name === "first-contentful-paint" ? [{}] : []) });
		vi.advanceTimersByTime(0);
		expect(task).toHaveBeenCalledOnce();
	});
});
