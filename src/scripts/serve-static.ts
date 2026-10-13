/**
 * Serves dist/client the way Vercel does for these sites: a file as is, a
 * clean URL from its .html file or folder index, and anything else as
 * 404.html with a real 404 status. Only the e2e suite uses it; production
 * never runs a server. The build it serves is the site's, found from the
 * working directory.
 *
 * A marketing build served under a base path (its config's `basePath`, or the
 * `VITE_BASE_PATH` rehearsal override) is served both ways it is served for
 * real: under the prefix, as the cut's own Vercel host does through its two
 * rewrites, and without it, as the host owner's proxy forwards each request
 * with the prefix stripped (moved from template-marketing in 0.19.0).
 *
 * Usage: atelic-serve-static   (PORT sets the port, 4173 unless given)
 */
import { existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeBasePath, stripBase } from "../routing/basePath";
import { siteConfigPath } from "./site-config";

/**
 * The base path the build in `cwd` was made under: `VITE_BASE_PATH` when set,
 * else the `basePath` its src/site.config.ts exports, else the root. A site
 * with no config, or one whose config carries no base, is served at the root.
 */
export async function siteBasePath(
	cwd: string,
	env: Record<string, string | undefined> = process.env,
): Promise<string> {
	if (env.VITE_BASE_PATH !== undefined) return normalizeBasePath(env.VITE_BASE_PATH);
	const path = siteConfigPath(cwd);
	if (!existsSync(path)) return "";
	const module = (await import(pathToFileURL(path).href)) as { site?: { basePath?: string } };
	return normalizeBasePath(module.site?.basePath);
}

/** The file a request path names under `root`, by Vercel's clean URL rules; none on a miss. */
export function resolveFile(root: string, pathname: string): string | undefined {
	const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
	const candidates = [
		join(root, clean),
		join(root, `${clean}.html`),
		join(root, clean, "index.html"),
	];
	return candidates.find(
		(file) => file.startsWith(root) && existsSync(file) && statSync(file).isFile(),
	);
}

/** The command: serves dist/client of the working directory until stopped. */
export async function main(cwd: string = process.cwd()): Promise<void> {
	const root = join(cwd, "dist", "client");
	const port = Number(process.env.PORT ?? 4173);
	const base = await siteBasePath(cwd);

	Bun.serve({
		// Loopback only: this serves the build to the local browser under test and
		// has no business answering anyone else on the network.
		hostname: "127.0.0.1",
		port,
		fetch(request) {
			const file = resolveFile(root, stripBase(base, new URL(request.url).pathname));
			if (file) return new Response(Bun.file(file));
			return new Response(Bun.file(join(root, "404.html")), {
				status: 404,
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		},
	});

	console.log(`serving ${root} on http://127.0.0.1:${port}${base ? ` (and under ${base})` : ""}`);
}
