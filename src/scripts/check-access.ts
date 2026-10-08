/**
 * The build guard for a private artifact, and the first step of `bun run
 * build`. The practice's FOOTPRINT.md, Privacy: anything that carries a
 * private signal is never hosted publicly, and a private artifact deploys
 * only to a host with the wall armed. So when site.config.ts says
 * `access: "private"` and the build is running on Vercel, the three
 * variables that arm the wall must be set on the project, or the build
 * fails before anything ships. A local build of a private artifact passes
 * with a warning, because the wall only ever runs on the host.
 *
 * Usage: atelic-check-access   (run by `bun run build`, from the site's root)
 * Exits 1 when a private artifact would deploy without its wall.
 */
import { loadSite } from "./site-config";

/** What arms the wall (ACCESS-GATE.md, Turn It On). */
export const WALL_VARIABLES = ["GATE_SESSION_SECRET", "GATE_ALLOWLIST", "RESEND_API_KEY"] as const;

export interface AccessDecision {
	verdict: "pass" | "warn" | "fail";
	message: string;
}

function list(names: readonly string[]): string {
	if (names.length === 1) return names[0];
	return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * The decision, kept pure so it can be tested without a build: the
 * artifact's `access` line and the environment the build runs in.
 * `VERCEL` is set by Vercel on every build, and nowhere else.
 */
export function decideAccess(
	access: unknown,
	env: Record<string, string | undefined>,
): AccessDecision {
	if (access === "public") {
		return {
			verdict: "pass",
			message: "[access] public: built from public signals, no wall needed.",
		};
	}
	if (access !== "private") {
		return {
			verdict: "fail",
			message:
				'[access] src/site.config.ts has no access line. Set access to "public" (built only from public signals) or "private" (anything from the owner\'s own consoles), per the practice\'s FOOTPRINT.md, Privacy.',
		};
	}
	const missing = WALL_VARIABLES.filter((name) => !env[name]?.trim());
	if (!env.VERCEL) {
		const owed = missing.length
			? ` Before it deploys, set ${list(missing)} on its Vercel project, or the build there fails.`
			: "";
		return {
			verdict: "warn",
			message: `[access] private, built locally: the wall only runs on the host, so this build is not a deploy.${owed}`,
		};
	}
	if (missing.length === 0) {
		return {
			verdict: "pass",
			message: "[access] private, and the wall's variables are set on this project.",
		};
	}
	return {
		verdict: "fail",
		message: `[access] This artifact is private (src/site.config.ts, access: "private"), and the wall is not armed on this Vercel project. Set ${list(missing)} in the project's Settings, Environment Variables, for this environment, then redeploy. ACCESS-GATE.md says what each one holds. Nothing private deploys without the wall.`,
	};
}

/**
 * The command: reads the config of the site in `cwd` and decides. The
 * config is found from the working directory, since this file no longer
 * lives in the site.
 */
export async function main(cwd: string = process.cwd()): Promise<void> {
	let access: unknown;
	try {
		access = (await loadSite(cwd)).access;
	} catch (error) {
		console.error(`[access] ${(error as Error).message}`);
		process.exit(1);
	}
	const decision = decideAccess(access, process.env);
	if (decision.verdict === "fail") {
		console.error(decision.message);
		process.exit(1);
	}
	if (decision.verdict === "warn") console.warn(decision.message);
	else console.log(decision.message);
}
