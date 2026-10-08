/**
 * Writes dist/client/health.json after the build: a shallow health endpoint
 * for uptime monitors that also answers "which build is live?".
 * Runs as the last step of `bun build`, from the site's root.
 *
 * Usage: atelic-stamp-health
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function commitSha(): string {
	// Vercel builds have no .git directory; the CLI/CI export the sha instead.
	const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
	if (fromEnv) return fromEnv.slice(0, 7);
	const git = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" });
	return git.status === 0 ? git.stdout.trim() : "unknown";
}

/** The command: stamps the build in the working directory. */
export function main(): void {
	const health = {
		status: "ok",
		commit: commitSha(),
		builtAt: new Date().toISOString(),
	};

	writeFileSync("dist/client/health.json", `${JSON.stringify(health, null, "\t")}\n`);
	console.log(`[health] dist/client/health.json (${health.commit})`);
}
