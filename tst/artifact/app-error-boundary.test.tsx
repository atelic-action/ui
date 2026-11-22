import { render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "../../src/artifact";
import { installCatcher, readCatcher } from "../../src/monitoring/catcher";

function clear() {
	const catcher = readCatcher(window);
	if (catcher) {
		window.removeEventListener("error", catcher.onError);
		window.removeEventListener("unhandledrejection", catcher.onRejection);
	}
	delete (window as { __atelicErrors?: unknown }).__atelicErrors;
}

function Broken(): never {
	throw new Error("render crash");
}

describe("AppErrorBoundary's error reporting", () => {
	beforeEach(() => {
		clear();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});
	afterEach(() => {
		clear();
		vi.restoreAllMocks();
	});

	it("holds a crash it catches in the early buffer before the SDK has loaded", () => {
		installCatcher(window);
		render(
			<AppErrorBoundary>
				<Broken />
			</AppErrorBoundary>,
		);
		expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
		const held = readCatcher(window)?.q.filter((item) => item.kind === "boundary") ?? [];
		expect(held).toHaveLength(1);
		expect((held[0]?.error as Error | undefined)?.message).toBe("render crash");
	});

	it("hands a crash straight to the SDK once it has loaded", () => {
		const report = vi.fn();
		installCatcher(window).report = report;
		render(
			<AppErrorBoundary>
				<Broken />
			</AppErrorBoundary>,
		);
		expect(report).toHaveBeenCalledOnce();
		expect((report.mock.calls[0]?.[0] as Error | undefined)?.message).toBe("render crash");
		expect(report.mock.calls[0]?.[1]).toBe("boundary");
	});

	it("installs nothing on a page where reporting never started", () => {
		render(
			<AppErrorBoundary>
				<Broken />
			</AppErrorBoundary>,
		);
		expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
		expect(readCatcher(window)).toBeUndefined();
	});
});
