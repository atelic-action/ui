import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_QUERY, useIsDesktop } from "../../src/app/hooks/useIsDesktop";

type Listener = (event: { matches: boolean }) => void;

function installMatchMedia(matches: boolean) {
	const listeners = new Set<Listener>();
	const media = {
		matches,
		media: DESKTOP_QUERY,
		addEventListener: (_: string, listener: Listener) => listeners.add(listener),
		removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
	};
	window.matchMedia = vi.fn().mockReturnValue(media) as unknown as typeof window.matchMedia;
	return {
		flip(next: boolean) {
			media.matches = next;
			for (const listener of listeners) listener({ matches: next });
		},
	};
}

describe("useIsDesktop", () => {
	const original = window.matchMedia;
	afterEach(() => {
		window.matchMedia = original;
	});

	it("is false where matchMedia does not exist, so jsdom renders the mobile layout", () => {
		// @ts-expect-error jsdom leaves matchMedia undefined; make that explicit.
		window.matchMedia = undefined;
		const { result } = renderHook(() => useIsDesktop());
		expect(result.current).toBe(false);
	});

	it("reads the lg media query and follows it as the viewport changes", () => {
		const media = installMatchMedia(true);
		const { result } = renderHook(() => useIsDesktop());
		expect(result.current).toBe(true);
		expect(window.matchMedia).toHaveBeenCalledWith(DESKTOP_QUERY);

		act(() => media.flip(false));
		expect(result.current).toBe(false);
	});
});
