/**
 * Fails a production deploy that would ship without error reporting. The
 * first step of a marketing site's `bun run build`: on Vercel's production
 * build (`VERCEL_ENV=production`) an empty `VITE_SENTRY_DSN` stops the build,
 * since a site never launches without Sentry. A preview or a local build
 * passes with a one line note. A site with a real reason to launch without
 * it passes `--allow-missing`, which lets the build go on under a loud
 * warning.
 *
 * The DSN is read the way Vite will read it for the build: the environment,
 * then the site's `.env` files for production mode. A DSN that is set but
 * malformed fails every build, since it would send nothing.
 *
 * Usage: atelic-check-sentry [--allow-missing]   (from the site's root)
 */
import { loadEnv } from "vite";
import { parseDSN } from "../monitoring/server";

export interface SentryCheckInput {
	/** The build's environment, where `VERCEL_ENV` and the DSN are read. */
	env: Record<string, string | undefined>;
	/** The command's arguments. */
	args: readonly string[];
}

export interface SentryCheckResult {
	/** The exit code: 1 only for a production build with no DSN and no waiver. */
	code: 0 | 1;
	/** What the command prints, one line, or a warning block for a waiver. */
	message: string;
}

/** The check, kept pure so it can be tested without a build. */
export function checkSentry({ env, args }: SentryCheckInput): SentryCheckResult {
	const production = env.VERCEL_ENV === "production";
	const dsn = (env.VITE_SENTRY_DSN ?? "").trim();
	// A DSN that is set but cannot be read sends nothing, whatever the build:
	// it fails here, on any environment, waiver or not.
	if (dsn && !parseDSN(dsn)) {
		return {
			code: 1,
			message:
				"[sentry] VITE_SENTRY_DSN is set but is not a DSN (https://<key>@<host>/<project>). Copy it again from the Sentry project's Client Keys.",
		};
	}
	if (dsn) return { code: 0, message: "[sentry] VITE_SENTRY_DSN is set; errors will be reported." };
	if (!production) {
		return {
			code: 0,
			message: `[sentry] no VITE_SENTRY_DSN on this ${env.VERCEL_ENV ?? "local"} build; errors are not reported, which only a production deploy forbids.`,
		};
	}
	if (args.includes("--allow-missing")) {
		return {
			code: 0,
			message: [
				"[sentry] ************************************************************",
				"[sentry] WARNING: this PRODUCTION build has no VITE_SENTRY_DSN and ships with --allow-missing.",
				"[sentry] Nothing that breaks on this site will be reported. Set the DSN on the Vercel project.",
			].join("\n"),
		};
	}
	return {
		code: 1,
		message:
			"[sentry] this production build has no VITE_SENTRY_DSN. Set it on the Vercel project (README, Error Reporting), or pass --allow-missing for a site with a real reason to launch without Sentry.",
	};
}

/** The command: checks the build in the working directory and exits with the result. */
export function main(args: readonly string[] = process.argv.slice(2)): void {
	const env = { ...loadEnv("production", process.cwd(), "VITE_"), ...process.env };
	const result = checkSentry({ env, args });
	if (result.code === 0) console.log(result.message);
	else console.error(result.message);
	process.exit(result.code);
}
