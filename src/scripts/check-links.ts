/**
 * External link checker: scans every prerendered page in dist/client for
 * outbound hrefs and media sources, then verifies each URL responds.
 * Internal link integrity is already enforced at build time by the
 * prerender crawler; this covers the links that rot silently — booking
 * portals, map embeds, hosted images, font stylesheets.
 *
 * Usage: atelic-check-links, or `bun run check:links` in a site (requires a
 * completed `bun build`, and runs from the site's root)
 * Exits 1 if any external link is dead.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "dist/client";
const ATTR_URL = /(?:href|src)="(https?:\/\/[^"]+)"/g;
// Hosts that reject bots or are placeholders; skip rather than false-alarm.
// Substack 403s datacenter IPs (GitHub runners) regardless of user agent.
const SKIP_HOSTS = new Set(["example.com", "schema.org", "www.schema.org", "substack.com"]);
const SKIP_SUFFIXES = [".example.com", ".substack.com"];

function htmlFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return htmlFiles(path);
		return name.endsWith(".html") ? [path] : [];
	});
}

function canonicalHost(html: string): string | null {
	const match = html.match(/rel="canonical" href="(https?:\/\/[^"]+)"/);
	return match ? new URL(match[1]).hostname : null;
}

function collectUrls(): Map<string, Set<string>> {
	const urls = new Map<string, Set<string>>();
	const files = htmlFiles(ROOT);
	// The site's own canonical/OG URLs reference the production domain, which
	// may not be cut over yet — and internal integrity is already enforced by
	// the prerender crawler. Skip the canonical host entirely.
	const ownHost = files.map((f) => canonicalHost(readFileSync(f, "utf8"))).find(Boolean);
	for (const file of files) {
		// Preconnect hints are bare origins (they often 404 at "/") — they warm
		// connections, they aren't content links.
		const html = readFileSync(file, "utf8").replace(/<link rel="preconnect"[^>]*>/g, "");
		for (const match of html.matchAll(ATTR_URL)) {
			const url = match[1].replace(/&amp;/g, "&");
			const host = new URL(url).hostname;
			if (SKIP_HOSTS.has(host) || SKIP_SUFFIXES.some((s) => host.endsWith(s))) continue;
			if (ownHost && (host === ownHost || host === `www.${ownHost}`)) continue;
			if (!urls.has(url)) urls.set(url, new Set());
			urls.get(url)?.add(file.replace(`${ROOT}/`, ""));
		}
	}
	return urls;
}

async function probe(url: string): Promise<number> {
	const attempt = async (method: "HEAD" | "GET") => {
		const res = await fetch(url, {
			method,
			redirect: "follow",
			signal: AbortSignal.timeout(15000),
			headers: { "user-agent": "Mozilla/5.0 (link-check; +https://atelic.me)" },
		});
		return res.status;
	};
	try {
		const status = await attempt("HEAD");
		// Some hosts reject HEAD; retry with GET before judging.
		return status >= 400 ? await attempt("GET") : status;
	} catch {
		try {
			return await attempt("GET");
		} catch {
			return 0;
		}
	}
}

/** The command: checks the build in the working directory. */
export async function main(): Promise<void> {
	const urls = collectUrls();
	console.log(`[links] checking ${urls.size} external URLs across ${ROOT}`);

	let failures = 0;
	for (const [url, pages] of urls) {
		const status = await probe(url);
		const ok = status >= 200 && status < 400;
		if (!ok) {
			failures++;
			console.error(`  DEAD (${status || "no response"}): ${url}`);
			console.error(`        referenced by: ${[...pages].join(", ")}`);
		} else {
			console.log(`  ok (${status}): ${url}`);
		}
	}

	if (failures > 0) {
		console.error(`[links] ${failures} dead external link(s)`);
		process.exit(1);
	}
	console.log("[links] all external links alive");
}
