import { renderHook } from "@testing-library/react";
import {
	loadTurnstile,
	TOKEN_WAIT_MS,
	TURNSTILE_SCRIPT_URL,
	type TurnstileAPI,
	type TurnstileRenderOptions,
	useTurnstile,
} from "../../src/lib/turnstile";

/** A stand in for Turnstile's API: one widget, run by `execute`, answering as the test says. */
function fakeTurnstile(
	answer: (options: TurnstileRenderOptions) => void = (o) => o.callback("tok"),
) {
	let options: TurnstileRenderOptions | undefined;
	const api = {
		render: vi.fn((_container: HTMLElement, given: TurnstileRenderOptions) => {
			options = given;
			return "widget-1";
		}),
		execute: vi.fn(() => {
			if (options) answer(options);
		}),
		reset: vi.fn(),
		remove: vi.fn(),
		options: () => options,
	};
	return api;
}

function scripts(): HTMLScriptElement[] {
	return Array.from(document.head.querySelectorAll(`script[src="${TURNSTILE_SCRIPT_URL}"]`));
}

/** The hook with its container attached, as the form draws it. */
function mounted(siteKey = "1x00000000000000000000BB") {
	const hook = renderHook(() => useTurnstile(siteKey));
	hook.result.current.containerRef.current = document.createElement("div");
	return hook;
}

describe("loadTurnstile", () => {
	afterEach(() => {
		delete window.turnstile;
		for (const script of scripts()) script.remove();
	});

	it("uses the API already on the page, adding no script", async () => {
		const api = fakeTurnstile() as unknown as TurnstileAPI;
		window.turnstile = api;
		await expect(loadTurnstile()).resolves.toBe(api);
		expect(scripts()).toHaveLength(0);
	});

	it("adds the explicit script once, however many ask, and resolves when it loads", async () => {
		const first = loadTurnstile();
		const second = loadTurnstile();
		expect(scripts()).toHaveLength(1);
		expect(scripts()[0]?.src).toBe(TURNSTILE_SCRIPT_URL);
		const api = fakeTurnstile() as unknown as TurnstileAPI;
		window.turnstile = api;
		scripts()[0]?.dispatchEvent(new Event("load"));
		await expect(first).resolves.toBe(api);
		await expect(second).resolves.toBe(api);
	});

	it("takes a script that failed back out, so the next call tries again", async () => {
		const failed = loadTurnstile();
		scripts()[0]?.dispatchEvent(new Event("error"));
		await expect(failed).rejects.toThrow("The Turnstile script did not load");
		expect(scripts()).toHaveLength(0);
		const again = loadTurnstile();
		expect(scripts()).toHaveLength(1);
		window.turnstile = fakeTurnstile() as unknown as TurnstileAPI;
		scripts()[0]?.dispatchEvent(new Event("load"));
		await expect(again).resolves.toBeDefined();
	});

	it("starts again when its script was taken off the page before it answered", () => {
		void loadTurnstile();
		scripts()[0]?.remove();
		void loadTurnstile();
		expect(scripts()).toHaveLength(1);
	});

	it("refuses a script that loads without its API", async () => {
		const pending = loadTurnstile();
		scripts()[0]?.dispatchEvent(new Event("load"));
		await expect(pending).rejects.toThrow("loaded without its API");
	});
});

describe("useTurnstile", () => {
	afterEach(() => {
		vi.useRealTimers();
		delete window.turnstile;
		for (const script of scripts()) script.remove();
	});

	it("loads nothing until asked", () => {
		mounted();
		expect(scripts()).toHaveLength(0);
	});

	it("renders the widget once, in execute mode, into the form's container", async () => {
		const api = fakeTurnstile();
		window.turnstile = api as unknown as TurnstileAPI;
		const { result } = mounted("site-key");
		result.current.prepare();
		result.current.prepare();
		await expect(result.current.token()).resolves.toBe("tok");
		expect(api.render).toHaveBeenCalledOnce();
		expect(api.render.mock.calls[0]?.[0]).toBe(result.current.containerRef.current);
		expect(api.options()).toMatchObject({ sitekey: "site-key", execution: "execute" });
		expect(api.execute).toHaveBeenCalledWith("widget-1");
	});

	it("waits for a script still loading when the token is asked for first", async () => {
		const { result } = mounted();
		const pending = result.current.token();
		expect(scripts()).toHaveLength(1);
		window.turnstile = fakeTurnstile() as unknown as TurnstileAPI;
		scripts()[0]?.dispatchEvent(new Event("load"));
		await expect(pending).resolves.toBe("tok");
	});

	it("rejects when the script fails to load", async () => {
		const { result } = mounted();
		const pending = result.current.token();
		scripts()[0]?.dispatchEvent(new Event("error"));
		await expect(pending).rejects.toThrow("The Turnstile script did not load");
	});

	it("rejects with Cloudflare's code when the challenge errors", async () => {
		const api = fakeTurnstile((options) => options["error-callback"]("300030"));
		window.turnstile = api as unknown as TurnstileAPI;
		const { result } = mounted();
		await expect(result.current.token()).rejects.toThrow("The Turnstile challenge failed (300030)");
	});

	it("rejects when the browser cannot run the challenge, then and on every later ask", async () => {
		const api = fakeTurnstile((options) => options["unsupported-callback"]());
		window.turnstile = api as unknown as TurnstileAPI;
		const { result } = mounted();
		await expect(result.current.token()).rejects.toThrow("cannot run the Turnstile challenge");
		await expect(result.current.token()).rejects.toThrow("cannot run the Turnstile challenge");
	});

	it("rejects when no token arrives within ten seconds", async () => {
		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		const api = fakeTurnstile(() => {});
		window.turnstile = api as unknown as TurnstileAPI;
		const { result } = mounted();
		let settled: unknown;
		const pending = result.current.token().catch((error: Error) => {
			settled = error;
		});
		await vi.advanceTimersByTimeAsync(TOKEN_WAIT_MS - 1);
		expect(settled).toBeUndefined();
		await vi.advanceTimersByTimeAsync(1);
		await pending;
		expect(String(settled)).toContain(`no token within ${TOKEN_WAIT_MS} ms`);
	});

	it("refuses with no site key, loading nothing", async () => {
		const { result } = renderHook(() => useTurnstile(undefined));
		result.current.prepare();
		await expect(result.current.token()).rejects.toThrow("no site key");
		expect(scripts()).toHaveLength(0);
	});

	it("resets the widget when asked, and removes it when the form leaves the page", async () => {
		const api = fakeTurnstile();
		window.turnstile = api as unknown as TurnstileAPI;
		const { result, unmount } = mounted();
		await result.current.token();
		result.current.reset();
		await vi.waitFor(() => expect(api.reset).toHaveBeenCalledWith("widget-1"));
		unmount();
		await vi.waitFor(() => expect(api.remove).toHaveBeenCalledWith("widget-1"));
	});
});
