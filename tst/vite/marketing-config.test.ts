// @vitest-environment node
import { resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";

/**
 * The two plugins the factory brings are stood in for, so the test reads
 * exactly what the factory hands TanStack Start.
 */
vi.mock("@tanstack/react-start/plugin/vite", () => ({
	tanstackStart: (options: unknown) => ({ name: "start-stand-in", options }),
}));
vi.mock("@vitejs/plugin-react", () => ({
	default: () => ({ name: "react-stand-in" }),
}));

import {
	marketingBasePath,
	marketingConfig,
	NOT_FOUND_PAGE,
} from "../../src/vite/marketing-config";

interface StartOptions {
	router?: { basepath: string };
	prerender: { enabled: boolean; crawlLinks: boolean };
	pages: Array<{ path: string }>;
	sitemap: { enabled: boolean; host: string };
}

const SITE = { url: "https://summit.example.com" };

function start(config: UserConfig): StartOptions {
	const plugins = (config.plugins ?? []) as Array<Plugin & { options?: StartOptions }>;
	return plugins[0].options as StartOptions;
}

describe("marketingConfig", () => {
	it("brings TanStack Start and React, in that order", () => {
		const plugins = (marketingConfig({ site: SITE, env: {} }).plugins ?? []) as Plugin[];
		expect(plugins.map((plugin) => plugin.name)).toEqual(["start-stand-in", "react-stand-in"]);
	});

	it("prerenders with the crawler, the 404 first, and a sitemap on the site's own host", () => {
		const config = marketingConfig({
			site: SITE,
			pages: [{ path: "/blog/first-post" }, NOT_FOUND_PAGE],
			env: {},
		});
		const options = start(config);
		expect(config.base).toBe("/");
		expect(options.router).toBeUndefined();
		expect(options.prerender).toEqual({ enabled: true, crawlLinks: true });
		expect(options.pages).toEqual([NOT_FOUND_PAGE, { path: "/blog/first-post" }]);
		expect(options.sitemap).toEqual({ enabled: true, host: "https://summit.example.com" });
	});

	it("leaves CSS code splitting at Vite's default, since no component imports a sheet", () => {
		// Forced off, TanStack Start fails the build looking for a style.css
		// that a site importing every sheet through its base sheet never emits.
		expect(marketingConfig({ site: SITE, env: {} }).build?.cssCodeSplit).toBeUndefined();
	});

	it("lets a site that does import a sheet from a component fold them again", () => {
		const config = marketingConfig({
			site: SITE,
			env: {},
			extend: { build: { cssCodeSplit: false } },
		});
		expect(config.build?.cssCodeSplit).toBe(false);
	});

	it("serves a based cut under its base, with the router's basepath and no sitemap", () => {
		const config = marketingConfig({
			site: { url: "https://summit.atelic.me/proto", basePath: "/proto" },
			env: {},
		});
		expect(config.base).toBe("/proto/");
		expect(start(config).router).toEqual({ basepath: "/proto" });
		expect(start(config).sitemap.enabled).toBe(false);
	});

	it("takes a sitemap host of the site's own when given", () => {
		const options = start(
			marketingConfig({ site: SITE, sitemapHost: "https://www.summit.example.com", env: {} }),
		);
		expect(options.sitemap.host).toBe("https://www.summit.example.com");
	});

	it("points @ at the src of the site Vite is run in, and compiles the package for SSR", () => {
		const config = marketingConfig({ site: SITE, env: {} });
		const alias = config.resolve?.alias as Record<string, string> | undefined;
		expect(alias?.["@"]).toBe(resolve(process.cwd(), "./src"));
		expect(config.ssr?.noExternal).toEqual(["@atelic-action/ui"]);
	});

	it("merges a site's extend over the result", () => {
		const config = marketingConfig({ site: SITE, env: {}, extend: { server: { port: 5180 } } });
		expect(config.server?.port).toBe(5180);
		expect(config.ssr?.noExternal).toEqual(["@atelic-action/ui"]);
	});
});

describe("marketingBasePath", () => {
	it("reads the config's base, normalized", () => {
		expect(marketingBasePath({ url: "https://x.test/proto", basePath: "proto/" }, {})).toBe(
			"/proto",
		);
		expect(marketingBasePath(SITE, {})).toBe("");
	});

	it("refuses a based config whose url does not end with the base", () => {
		expect(() => marketingBasePath({ url: "https://x.test", basePath: "/proto" }, {})).toThrow(
			/must end with basePath/,
		);
	});

	it("lets VITE_BASE_PATH rehearse a base the config does not carry", () => {
		expect(marketingBasePath(SITE, { VITE_BASE_PATH: "/proto" })).toBe("/proto");
	});
});
