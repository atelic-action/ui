/**
 * The whole Vite configuration of an artifact site, as one call. Every site
 * cut from the artifact template carried its own copy of this configuration;
 * here it is written once, and a site's vite.config.ts names its pages:
 *
 *   import { artifactConfig } from "@atelic-action/ui/vite";
 *
 *   export default artifactConfig({ pages: ["/writeup", "/proposal", "/report"] });
 *
 * The site's own paths (the `@` alias to its src) are found from the
 * directory Vite is run in, which is the site's root.
 */
import { resolve } from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { mergeConfig, type UserConfig } from "vite";
import { privateChunks } from "./private-chunks.js";

export interface ArtifactConfigOptions {
	/**
	 * The path of each artifact page the site carries, such as "/writeup".
	 * The root and the 404 page are always prerendered and need no entry.
	 */
	pages: readonly string[];
	/**
	 * The escape hatch for a site with a real need of its own: merged over
	 * the result with Vite's `mergeConfig`, so a site adds a setting without
	 * going back to a configuration written by hand.
	 */
	extend?: UserConfig;
}

/** One entry of the prerender list. */
export interface ArtifactPage {
	path: string;
	prerender: { enabled: true };
}

/** The prerender list for a site: the root, each page it names, then the 404. */
export function artifactPages(pages: readonly string[]): ArtifactPage[] {
	const named = pages.filter((path) => path !== "/" && path !== "/404");
	return [
		// The root holds no document: it sends the reader to /writeup
		// (vercel.json does the same on the host), and its prerendered
		// index.html is what a static preview serves at the bare host.
		{ path: "/", prerender: { enabled: true } },
		...named.map((path): ArtifactPage => ({ path, prerender: { enabled: true } })),
		// The 404 page, rendered by the catch all route and copied to
		// dist/client/404.html by the build for the host to serve on any miss.
		{ path: "/404", prerender: { enabled: true } },
	];
}

export function artifactConfig({ pages, extend }: ArtifactConfigOptions): UserConfig {
	const config: UserConfig = {
		// Every stylesheet rides in the one base sheet the root route links
		// (src/styles/base.css), the documents' own included, since they come from
		// @atelic-action/ui. Nothing imports CSS from a component, so there is no
		// component bundle to fold: `build.cssCodeSplit: false`, which sat here to
		// fold it, now fails the build, because TanStack Start looks for the
		// `style.css` that setting emits and none is written. A site that gives a
		// component its own stylesheet again restores the setting through `extend`.
		plugins: [
			tanstackStart({
				prerender: {
					enabled: true,
					crawlLinks: true,
					// The writeup links each screenshot crop to its full image, and
					// the crawler follows every href it finds: without this filter it
					// prerenders /images/<shot>.png as an HTML page and writes that
					// over the real file in dist/client (found on a client's writeup,
					// 2026-09-24).
					filter: ({ path }) => !path.startsWith("/images/"),
				},
				// Nothing links to an artifact page, so the crawler would miss every
				// one of them; each is listed by the site to be prerendered at all. A
				// site names the pages it uses and no others.
				pages: artifactPages(pages),
				// No sitemap. A sitemap is a page asking to be crawled, and every
				// page here is a document prepared for one business; public/robots.txt
				// disallows the whole host to match.
				sitemap: { enabled: false },
			}),
			react(),
			// A document's content builds into /assets/doc/, which the access wall
			// holds back, and the build fails if any lands where the login page
			// can load it (privateChunks beside this file, needsSession in
			// @atelic-action/ui/gate).
			privateChunks(),
		],
		resolve: {
			alias: {
				// The site's src, from the directory Vite is run in: this file lives
				// in the package, so nothing here can be found relative to it.
				"@": resolve(process.cwd(), "./src"),
			},
		},
		// @atelic-action/ui ships TSX and CSS as written, so the prerender's server build
		// has to compile it rather than hand it to Node as an external.
		ssr: {
			noExternal: ["@atelic-action/ui"],
		},
	};
	return extend ? mergeConfig(config, extend) : config;
}
