// @vitest-environment node
import { googlePlacesProvider, loadPlacesLibrary } from "../../src/lib/googlePlaces";

/** Prerender has no window: the provider is made, and a load refuses, without touching one. */
describe("the Google provider on the server", () => {
	it("imports and is made with no window", () => {
		expect(typeof window).toBe("undefined");
		const provider = googlePlacesProvider({ apiKey: "test-key-ssr" });
		expect(typeof provider.suggest).toBe("function");
	});

	it("refuses to load, and a search offers nothing", async () => {
		await expect(loadPlacesLibrary("test-key-ssr")).rejects.toThrow("only in a browser");
		const provider = googlePlacesProvider({ apiKey: "test-key-ssr-2" });
		await expect(
			provider.suggest("418", { signal: new AbortController().signal }),
		).resolves.toEqual([]);
	});
});
