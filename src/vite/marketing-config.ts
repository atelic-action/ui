/**
 * The whole Vite configuration of a marketing site, as one call. Every site
 * cut from template-marketing carried its own copy of this configuration;
 * here it is written once (0.19.0, ATE-643), and a site's vite.config.ts
 * hands over its config and the pages the crawler cannot find:
 *
 *   import { marketingConfig } from "@atelic-action/ui/vite";
 *   import { site } from "./src/site.config";
 *
 *   export default marketingConfig({ site, pages: [{ path: "/blog/first-post" }] });
 *
 * The site's own paths (the `@` alias to its src) are found from the
 * directory Vite is run in, which is the site's root.
 */
import { resolve } from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { mergeConfig, type UserConfig } from "vite";
import { normalizeBasePath } from "../routing/basePath.js";

/** One entry of the prerender list, as TanStack Start takes it. */
export interface MarketingPage {
	path: string;
	prerender?: { enabled: boolean };
	sitemap?: { exclude: boolean };
}

export interface MarketingConfigOptions {
	/**
	 * The two keys of the site's config the build reads: `url`, the canonical
	 * URL (with the base path on it for a based cut), and `basePath`.
	 */
	site: { url: string; basePath?: string };
	/**
	 * Pages the link crawler cannot reach on its own: a post on a dynamic
	 * route, a page nothing links to. The 404 page is always added.
	 */
	pages?: readonly MarketingPage[];
	/**
	 * The host the sitemap's URLs carry. Defaults to the origin of `site.url`.
	 */
	sitemapHost?: string;
	/**
	 * The escape hatch for a site with a real need of its own: merged over
	 * the result with Vite's `mergeConfig`.
	 */
	extend?: UserConfig;
	/** The environment to read `VITE_BASE_PATH` from; a test passes its own. */
	env?: Record<string, string | undefined>;
}

/** The 404 page, prerendered and copied to 404.html by the build, never in the sitemap. */
export const NOT_FOUND_PAGE: MarketingPage = {
	path: "/404",
	prerender: { enabled: true },
	sitemap: { exclude: true },
};

/**
 * The base the build uses: `VITE_BASE_PATH` when set (a rehearsal build,
 * which CI runs under "/proto"), the config's `basePath` otherwise. Throws
 * when a based config's `url` does not end with its base, since canonical and
 * Open Graph URLs are built from it.
 */
export function marketingBasePath(
	site: { url: string; basePath?: string },
	env: Record<string, string | undefined> = process.env,
): string {
	const override = env.VITE_BASE_PATH;
	const basePath = normalizeBasePath(override ?? site.basePath);
	if (override === undefined && basePath && !site.url.endsWith(basePath)) {
		throw new Error(
			`site.url (${site.url}) must end with basePath (${basePath}): canonical and Open Graph URLs are built from it`,
		);
	}
	return basePath;
}

export function marketingConfig({
	site,
	pages = [],
	sitemapHost,
	extend,
	env = process.env,
}: MarketingConfigOptions): UserConfig {
	const basePath = marketingBasePath(site, env);
	const listed = pages.filter((page) => page.path !== NOT_FOUND_PAGE.path);
	const config: UserConfig = {
		// The base becomes Vite's `base`, so every built asset URL and every
		// rebased `url(/...)` in the CSS carries it, and the router's
		// `basepath`, so the router and the prerender both work under it.
		base: `${basePath}/`,
		build: {
			// One CSS bundle instead of one file per route chunk: each render
			// blocking stylesheet adds a round trip before first paint, and a
			// single bundle also ends the per route CSS vanishing trap.
			cssCodeSplit: false,
		},
		plugins: [
			tanstackStart({
				...(basePath ? { router: { basepath: basePath } } : {}),
				prerender: { enabled: true, crawlLinks: true },
				pages: [NOT_FOUND_PAGE, ...listed],
				sitemap: {
					// A based cut is a preview under another project's host, noindex
					// by that host's header rule, so it ships no sitemap.
					enabled: !basePath,
					host: sitemapHost ?? new URL(site.url).origin,
				},
			}),
			react(),
		],
		resolve: {
			alias: {
				// The site's src, from the directory Vite is run in: this file
				// lives in the package, so nothing here can be found relative to it.
				"@": resolve(process.cwd(), "./src"),
			},
		},
		// @atelic-action/ui ships TSX and CSS as written, so the prerender's
		// server build has to compile it rather than hand it to Node.
		ssr: {
			noExternal: ["@atelic-action/ui"],
		},
	};
	return extend ? mergeConfig(config, extend) : config;
}
