/**
 * What a build tells error reporting about itself, shared by `marketingConfig`
 * and `artifactConfig`: the commit it is filed under, the environment it runs
 * in, and the optional Sentry source map upload. Both configurations take the
 * same three, so an error from a marketing site and one from an artifact
 * document arrive with a release and an environment alike.
 */
import type { Plugin, PluginOption, UserConfig } from "vite";

/**
 * The commit a build is filed under in Sentry: Vercel's commit, else the CI's.
 * The same value names the release the Sentry plugin creates and the release
 * the browser reports under, so a stack trace meets its source maps.
 */
export function buildRelease(
	env: Record<string, string | undefined> = process.env,
): string | undefined {
	return env.VERCEL_GIT_COMMIT_SHA || env.GITHUB_SHA || undefined;
}

/** What the Sentry plugin is given, when it runs at all. */
export interface SentryUpload {
	org: string;
	project: string;
	authToken: string;
	release: string;
}

/**
 * The source map upload, on only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
 * `SENTRY_PROJECT` are all set and the build knows its commit. Off, the
 * build is exactly what it was: no plugin, no source maps.
 */
export function sentryUpload(
	env: Record<string, string | undefined> = process.env,
): SentryUpload | undefined {
	const { SENTRY_AUTH_TOKEN: authToken, SENTRY_ORG: org, SENTRY_PROJECT: project } = env;
	const release = buildRelease(env);
	if (!authToken || !org || !project || !release) return undefined;
	return { org, project, authToken, release };
}

/**
 * The Sentry Vite plugin, loaded only when it runs: it creates the release
 * named by the commit, uploads the build's hidden source maps, and deletes
 * every map file from the output afterwards, so none is ever served.
 */
export function sentryPlugin(upload: SentryUpload): PluginOption {
	return import("@sentry/vite-plugin").then(
		({ sentryVitePlugin }) =>
			sentryVitePlugin({
				org: upload.org,
				project: upload.project,
				authToken: upload.authToken,
				release: { name: upload.release, inject: false },
				sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
				telemetry: false,
			}) as PluginOption,
	);
}

/**
 * The environment the browser files its errors under, as
 * `import.meta.env.VITE_ENVIRONMENT`: Vercel's (production, preview,
 * development) when the build runs there, else the build's mode. A Vite
 * production build's mode is production on every deploy, a preview's
 * included, so the mode alone filed every error as production.
 */
export function environmentPlugin(env: Record<string, string | undefined> = process.env): Plugin {
	return {
		name: "atelic-build-environment",
		config: (_config, { mode }) => ({
			define: {
				"import.meta.env.VITE_ENVIRONMENT": JSON.stringify(env.VERCEL_ENV || mode),
			},
		}),
	};
}

/**
 * The part of a configuration that reporting adds: the environment plugin and,
 * when an upload is configured, the Sentry plugin; the commit, for the browser
 * to report under (`startErrorReporting`'s `release`), defined as
 * `import.meta.env.VITE_RELEASE` when the build knows it; and source maps only
 * for Sentry, hidden, so the bundles carry no comment pointing at one and the
 * plugin deletes them once uploaded.
 */
export function releaseConfig(env: Record<string, string | undefined> = process.env): {
	plugins: PluginOption[];
	config: Pick<UserConfig, "define" | "build">;
} {
	const release = buildRelease(env);
	const upload = sentryUpload(env);
	return {
		plugins: [environmentPlugin(env), ...(upload ? [sentryPlugin(upload)] : [])],
		config: {
			...(release ? { define: { "import.meta.env.VITE_RELEASE": JSON.stringify(release) } } : {}),
			...(upload ? { build: { sourcemap: "hidden" as const } } : {}),
		},
	};
}
