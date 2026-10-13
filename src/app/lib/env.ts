import { z } from "zod";

/**
 * The environment variables an app on this shell reads, with runtime
 * validation. The package never reads `import.meta.env` itself, since a
 * bundler replaces it in the app's own code and not reliably inside a
 * dependency: the app parses its own, once, and hands the api's base URL to
 * the shell through its config.
 *
 * ```ts
 * // src/app/env.ts
 * export const env = parseEnv(import.meta.env);
 * ```
 */
export const envSchema = z.object({
	VITE_API_BASE_URL: z.string().url().optional(),
	VITE_APP_URL: z.string().url().optional(),
	VITE_SENTRY_DSN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

/** Validate the environment. Throws, naming each bad variable, so the app fails at startup. */
export function parseEnv(source: Record<string, unknown>): AppEnv {
	const result = envSchema.safeParse(source);

	if (!result.success) {
		const errors = result.error.flatten().fieldErrors;
		const errorMessage = Object.entries(errors)
			.map(([key, messages]) => `  ${key}: ${messages?.join(", ")}`)
			.join("\n");

		throw new Error(`Environment validation failed:\n${errorMessage}`);
	}

	return result.data;
}
