// @vitest-environment node
import type { PluginOption } from "vite";
import { artifactConfig, privateChunks } from "../../src/vite";

/** Flattens Vite's nested plugin lists to the names in them. */
function names(options: PluginOption[] | undefined): string[] {
	return (options ?? []).flat(Number.POSITIVE_INFINITY).flatMap((plugin) => {
		const name = (plugin as { name?: unknown } | null | false | undefined)?.name;
		return typeof name === "string" ? [name] : [];
	});
}

/**
 * The factory with the real plugins loaded, as a site's vite.config.ts
 * loads it: it has to import and build without the stand ins.
 */
describe("artifactConfig with the real plugins", () => {
	it("loads TanStack Start and React and ends on the private content plugin", () => {
		const found = names(artifactConfig({ pages: ["/writeup"] }).plugins);
		expect(found.some((name) => name.startsWith("tanstack"))).toBe(true);
		expect(found.some((name) => name.includes("react"))).toBe(true);
		expect(found.at(-1)).toBe("atelic:private-chunks");
	});

	it("exports the plugin beside the factory, for a site that writes its own configuration", () => {
		expect(privateChunks().name).toBe("atelic:private-chunks");
	});
});
