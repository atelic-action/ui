/**
 * Finds the site a command was run in. A command lives in the package, so
 * it cannot import the site's config by a relative path as a script in the
 * site once did: it resolves src/site.config.ts against the directory it
 * was run from and imports that.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ArtifactConfig } from "../artifact/artifactConfig";

/** Where a site keeps its config, from the site's root. */
export const SITE_CONFIG = "src/site.config.ts";

/** The absolute path of the config for the site rooted at `cwd`. */
export function siteConfigPath(cwd: string = process.cwd()): string {
	return resolve(cwd, SITE_CONFIG);
}

/**
 * The `site` export of the config in `cwd`. Throws one line naming the
 * directory when there is no config there, or when it exports no `site`.
 */
export async function loadSite(cwd: string = process.cwd()): Promise<ArtifactConfig> {
	const path = siteConfigPath(cwd);
	if (!existsSync(path)) {
		throw new Error(`no ${SITE_CONFIG} in ${cwd}. Run this from the root of an artifact site.`);
	}
	const module = (await import(pathToFileURL(path).href)) as { site?: ArtifactConfig };
	if (!module.site) {
		throw new Error(`${SITE_CONFIG} in ${cwd} exports no \`site\`.`);
	}
	return module.site;
}
