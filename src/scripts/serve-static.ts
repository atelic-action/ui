/**
 * Serves dist/client the way Vercel does for these sites: a file as is, a
 * clean URL from its .html file or folder index, and anything else as
 * 404.html with a real 404 status. Only the e2e suite uses it; production
 * never runs a server. The build it serves is the site's, found from the
 * working directory.
 *
 * Usage: atelic-serve-static   (PORT sets the port, 4173 unless given)
 */
import { existsSync, statSync } from "node:fs";
import { join, normalize } from "node:path";

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
export function main(cwd: string = process.cwd()): void {
	const root = join(cwd, "dist", "client");
	const port = Number(process.env.PORT ?? 4173);

	Bun.serve({
		// Loopback only: this serves the build to the local browser under test and
		// has no business answering anyone else on the network.
		hostname: "127.0.0.1",
		port,
		fetch(request) {
			const file = resolveFile(root, new URL(request.url).pathname);
			if (file) return new Response(Bun.file(file));
			return new Response(Bun.file(join(root, "404.html")), {
				status: 404,
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		},
	});

	console.log(`serving ${root} on http://127.0.0.1:${port}`);
}
