// @vitest-environment node
import { resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";

/**
 * The two plugins the factory brings are stood in for, so the test reads
 * exactly what the factory hands TanStack Start. The real ones are loaded
 * in artifact-config.real.test.ts.
 */
vi.mock("@tanstack/react-start/plugin/vite", () => ({
	tanstackStart: (options: unknown) => ({ name: "start-stand-in", options }),
}));
vi.mock("@vitejs/plugin-react", () => ({
	default: () => ({ name: "react-stand-in" }),
}));

import { artifactConfig, artifactPages } from "../../src/vite/artifact-config";

interface StartOptions {
	prerender: { enabled: boolean; crawlLinks: boolean; filter: (page: { path: string }) => boolean };
	pages: Array<{ path: string; prerender: { enabled: boolean } }>;
	sitemap: { enabled: boolean };
}

const PAGES = ["/writeup", "/proposal", "/report"];

function plugins(config: UserConfig): Array<Plugin & { options?: StartOptions }> {
	return (config.plugins ?? []) as Array<Plugin & { options?: StartOptions }>;
}

describe("artifactPages", () => {
	it("puts the root first and the 404 last around the pages a site names", () => {
		expect(artifactPages(PAGES)).toEqual([
			{ path: "/", prerender: { enabled: true } },
			{ path: "/writeup", prerender: { enabled: true } },
			{ path: "/proposal", prerender: { enabled: true } },
			{ path: "/report", prerender: { enabled: true } },
			{ path: "/404", prerender: { enabled: true } },
		]);
	});

	it("still prerenders the root and the 404 for a site that names no page", () => {
		expect(artifactPages([]).map((page) => page.path)).toEqual(["/", "/404"]);
	});

	it("never lists the root or the 404 twice when a site names them itself", () => {
		expect(artifactPages(["/", "/writeup", "/404"]).map((page) => page.path)).toEqual([
			"/",
			"/writeup",
			"/404",
		]);
	});
});

describe("artifactConfig", () => {
	it("brings TanStack Start, React, and the private content plugin, in that order", () => {
		expect(plugins(artifactConfig({ pages: PAGES })).map((plugin) => plugin.name)).toEqual([
			"start-stand-in",
			"react-stand-in",
			"atelic:private-chunks",
		]);
	});

	it("prerenders with the crawler on, every page listed, and no sitemap", () => {
		const start = plugins(artifactConfig({ pages: PAGES }))[0].options as StartOptions;
		expect(start.prerender.enabled).toBe(true);
		expect(start.prerender.crawlLinks).toBe(true);
		expect(start.pages).toEqual(artifactPages(PAGES));
		expect(start.sitemap).toEqual({ enabled: false });
	});

	it("keeps the crawler out of /images/, where a prerendered page would overwrite a real file", () => {
		const { filter } = (plugins(artifactConfig({ pages: PAGES }))[0].options as StartOptions)
			.prerender;
		expect(filter({ path: "/images/profile.png" })).toBe(false);
		expect(filter({ path: "/writeup" })).toBe(true);
		expect(filter({ path: "/" })).toBe(true);
	});

	it("points @ at the src of the site Vite is run in", () => {
		expect(artifactConfig({ pages: PAGES }).resolve?.alias).toEqual({
			"@": resolve(process.cwd(), "src"),
		});
	});

	it("has the server build compile the package rather than hand it to Node", () => {
		expect(artifactConfig({ pages: PAGES }).ssr).toEqual({ noExternal: ["@atelic-action/ui"] });
	});

	it("sets nothing else", () => {
		expect(Object.keys(artifactConfig({ pages: PAGES })).sort()).toEqual([
			"plugins",
			"resolve",
			"ssr",
		]);
	});

	it("merges what a site extends it with over the result, keeping what was there", () => {
		const extra: Plugin = { name: "site-own" };
		const config = artifactConfig({
			pages: PAGES,
			extend: {
				plugins: [extra],
				server: { proxy: { "/proto": "http://127.0.0.1:4000" } },
				ssr: { noExternal: ["another-package"] },
				resolve: { alias: { "~": "/site/lib" } },
			},
		});
		expect(plugins(config).map((plugin) => plugin.name)).toEqual([
			"start-stand-in",
			"react-stand-in",
			"atelic:private-chunks",
			"site-own",
		]);
		expect(config.server?.proxy).toEqual({ "/proto": "http://127.0.0.1:4000" });
		expect(config.ssr?.noExternal).toEqual(["@atelic-action/ui", "another-package"]);
		expect(config.resolve?.alias).toEqual({
			"@": resolve(process.cwd(), "src"),
			"~": "/site/lib",
		});
	});
});
