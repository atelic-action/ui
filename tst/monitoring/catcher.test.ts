import {
	CATCHER_CAP,
	type Catcher,
	errorCatcherScript,
	installCatcher,
	readCatcher,
	reportError,
} from "../../src/monitoring/catcher";

/** Runs the inline script on the test's window, as the page's first script would. */
function runInline() {
	// biome-ignore lint/security/noGlobalEval: the package's own constant script, run as a page would run it
	window.eval(errorCatcherScript);
}

/** Takes the catcher off the test's window, its listeners with it. */
function clear() {
	const catcher = readCatcher(window);
	if (catcher) {
		window.removeEventListener("error", catcher.onError);
		window.removeEventListener("unhandledrejection", catcher.onRejection);
	}
	delete (window as { __atelicErrors?: unknown }).__atelicErrors;
}

/** An uncaught error, as the window reports one. */
function throwOnWindow(error: Error) {
	window.dispatchEvent(new ErrorEvent("error", { error, message: error.message }));
}

/** An unhandled rejection, as the window reports one (jsdom has no PromiseRejectionEvent). */
function rejectOnWindow(reason: unknown) {
	const event = new Event("unhandledrejection") as Event & { reason: unknown };
	event.reason = reason;
	window.dispatchEvent(event);
}

/** The two ways a catcher is installed, held to one contract. */
const installs: Array<[string, () => Catcher]> = [
	[
		"the inline script",
		() => {
			runInline();
			return readCatcher(window) as Catcher;
		},
	],
	["installCatcher", () => installCatcher(window)],
];

describe.each(installs)("the early catcher, installed by %s", (_name, install) => {
	beforeEach(clear);
	afterEach(clear);

	it("holds an uncaught error and an unhandled rejection, in order", () => {
		const catcher = install();
		const boom = new Error("The oven timer came back undefined");
		throwOnWindow(boom);
		rejectOnWindow("The order service answered 503");
		expect(catcher.q.map(({ error, kind }) => [error, kind])).toEqual([
			[boom, "error"],
			["The order service answered 503", "unhandledrejection"],
		]);
		expect(typeof catcher.q[0]?.at).toBe("number");
	});

	it("holds the message of an error event that carries no error (a cross origin script)", () => {
		const catcher = install();
		window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));
		expect(catcher.q[0]?.error).toBe("Script error.");
	});

	it("holds twenty and counts the rest as dropped", () => {
		const catcher = install();
		for (let i = 0; i < 25; i++) throwOnWindow(new Error(`fault ${i}`));
		expect(catcher.q).toHaveLength(CATCHER_CAP);
		expect(catcher.max).toBe(20);
		expect(catcher.dropped).toBe(5);
		expect((catcher.q[19]?.error as Error | undefined)?.message).toBe("fault 19");
	});

	it("leaves a catcher already there alone, so a second install never doubles a report", () => {
		const first = install();
		runInline();
		expect(installCatcher(window)).toBe(first);
		throwOnWindow(new Error("once"));
		expect(first.q).toHaveLength(1);
	});
});

describe("the inline script", () => {
	afterEach(clear);

	it("weighs well under a kilobyte and is ES5: no arrows, no let or const, no template literals", () => {
		expect(new TextEncoder().encode(errorCatcherScript).length).toBeLessThan(600);
		expect(errorCatcherScript).not.toMatch(/=>|\blet\b|\bconst\b|`|\?\?|\?\./);
	});
});

describe("reportError", () => {
	beforeEach(clear);
	afterEach(clear);

	it("holds an error in the buffer before the SDK is up, when a catcher is listening", () => {
		const catcher = installCatcher(window);
		const crash = new Error("render crash");
		reportError(crash);
		expect(catcher.q.map(({ error, kind }) => [error, kind])).toEqual([[crash, "boundary"]]);
	});

	it("lets an error go quietly where reporting never started, installing nothing", () => {
		reportError(new Error("render crash"));
		expect(readCatcher(window)).toBeUndefined();
	});

	it("hands an error straight to the SDK once it is up", () => {
		const catcher = installCatcher(window);
		const report = vi.fn();
		catcher.report = report;
		const crash = new Error("render crash");
		reportError(crash);
		expect(report).toHaveBeenCalledWith(crash, "boundary");
		expect(catcher.q).toHaveLength(0);
	});
});
