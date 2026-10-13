/**
 * Fails the build when dist/client or vercel.json disagrees with the base
 * path. The last step of a marketing site's `bun run build`; the rules and
 * their reasons live in src/lib/basePathAudit.ts, and the setting itself is
 * `basePath` in the site's src/site.config.ts.
 *
 * A `VITE_BASE_PATH` override that differs from the config is a rehearsal
 * build (CI proves a site under "/proto" that way): its HTML is held to the
 * override, but vercel.json still describes the committed config, so a
 * rewrite mismatch only warns, except on Vercel, where it would ship.
 *
 * Usage: atelic-check-base-path   (from the site's root)
 * Exits 1 on any problem.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	cssRefs,
	htmlRefs,
	type Rewrite,
	rewriteProblems,
	unbasedRefs,
} from "../lib/basePathAudit";
import { normalizeBasePath } from "../routing/basePath";
import { SITE_CONFIG, siteConfigPath } from "./site-config";

/** Where the build writes the pages, from the site's root. */
export const BUILD_ROOT = "dist/client";

export interface BasePathInput {
	/** The `basePath` the site's config commits to. */
	configured: string | undefined;
	/** `VITE_BASE_PATH`, when the build was a rehearsal under another base. */
	override: string | undefined;
	/** Every built HTML and CSS file, by its path, with its text. */
	files: Array<{ path: string; text: string }>;
	/** The site's vercel.json, parsed. */
	vercel: { rewrites?: Rewrite[] };
	/** Whether the build runs on Vercel, where a rehearsal mismatch would ship. */
	onVercel: boolean;
}

export interface BasePathReport {
	base: string;
	rehearsal: boolean;
	checked: number;
	problems: string[];
	warnings: string[];
}

/** The audit, kept pure so it can be tested without a build. */
export function auditBasePath(input: BasePathInput): BasePathReport {
	const configured = normalizeBasePath(input.configured);
	const base = normalizeBasePath(input.override ?? input.configured);
	const rehearsal = input.override !== undefined && base !== configured;

	const problems: string[] = [];
	const warnings: string[] = [];
	let checked = 0;
	for (const file of input.files) {
		const refs = file.path.endsWith(".html")
			? htmlRefs(file.text)
			: file.path.endsWith(".css")
				? cssRefs(file.text)
				: undefined;
		if (!refs) continue;
		checked++;
		for (const ref of unbasedRefs(refs, base)) {
			problems.push(`${file.path}: ${ref} lacks the base ${base}`);
		}
	}

	const rewrites = rewriteProblems(input.vercel, base).map((problem) => `vercel.json: ${problem}`);
	if (rehearsal && !input.onVercel) {
		warnings.push(...rewrites.map((problem) => `rehearsal build, not deployable: ${problem}`));
	} else {
		problems.push(...rewrites);
	}
	return { base, rehearsal, checked, problems, warnings };
}

function builtFiles(dir: string, root: string): Array<{ path: string; text: string }> {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return builtFiles(path, root);
		if (!path.endsWith(".html") && !path.endsWith(".css")) return [];
		return [
			{ path: join(BUILD_ROOT, path.slice(root.length + 1)), text: readFileSync(path, "utf8") },
		];
	});
}

/** The command: audits the build of the site in `cwd`. */
export async function main(cwd: string = process.cwd()): Promise<void> {
	const configPath = siteConfigPath(cwd);
	if (!existsSync(configPath)) {
		console.error(`[base-path] no ${SITE_CONFIG} in ${cwd}. Run this from the root of a site.`);
		process.exit(1);
	}
	const { site } = (await import(pathToFileURL(configPath).href)) as {
		site?: { basePath?: string };
	};
	const root = resolve(cwd, BUILD_ROOT);
	if (!existsSync(root)) {
		console.error(`[base-path] no ${BUILD_ROOT} in ${cwd}. Build the site first.`);
		process.exit(1);
	}
	const vercelPath = resolve(cwd, "vercel.json");
	const report = auditBasePath({
		configured: site?.basePath,
		override: process.env.VITE_BASE_PATH,
		files: builtFiles(root, root),
		vercel: existsSync(vercelPath) ? JSON.parse(readFileSync(vercelPath, "utf8")) : {},
		onVercel: Boolean(process.env.VERCEL),
	});

	for (const warning of report.warnings) console.warn(`[base-path] ${warning}`);
	if (report.problems.length > 0) {
		for (const problem of report.problems) console.error(`[base-path] ${problem}`);
		const count = report.problems.length;
		console.error(
			`[base-path] ${count} problem${count === 1 ? "" : "s"}; see the @atelic-action/ui README, Sections, Serving Under a Base Path`,
		);
		process.exit(1);
	}
	console.log(
		`[base-path] ${report.base || "root"}: ${report.checked} HTML and CSS files checked${report.rehearsal ? " (rehearsal)" : ""}`,
	);
}
