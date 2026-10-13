import { describe, expect, it } from "vitest";
import { envSchema, parseEnv } from "../../src/app/lib/env";

describe("env schema validation", () => {
	it("validates with no environment variables (all optional)", () => {
		expect(envSchema.safeParse({}).success).toBe(true);
	});

	it("validates correct API base URL", () => {
		expect(envSchema.safeParse({ VITE_API_BASE_URL: "http://localhost:3000" }).success).toBe(true);
	});

	it("rejects invalid API base URL", () => {
		const result = envSchema.safeParse({ VITE_API_BASE_URL: "not-a-url" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.VITE_API_BASE_URL).toBeDefined();
		}
	});

	it("allows optional Sentry DSN", () => {
		expect(envSchema.safeParse({ VITE_SENTRY_DSN: "https://example@sentry.io/123" }).success).toBe(
			true,
		);
	});
});

describe("parseEnv", () => {
	it("returns the variables it knows and ignores the rest", () => {
		expect(parseEnv({ VITE_APP_URL: "https://app.example.test", MODE: "production" })).toEqual({
			VITE_APP_URL: "https://app.example.test",
		});
	});

	it("names each bad variable when it throws", () => {
		expect(() => parseEnv({ VITE_API_BASE_URL: "not-a-url" })).toThrow(/VITE_API_BASE_URL/);
	});
});
