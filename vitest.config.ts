import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Two projects. `unit` is the jsdom suite in tst/, exactly as it ran before
 * Storybook (`bun run test:run`). `storybook` runs every story in
 * stories/ as a test in headless Chromium through Playwright: the story
 * renders, its play function runs, and the accessibility check fails it on
 * a violation (`bun run test:stories`). Each project holds its own setup, so
 * neither inherits the other's.
 */
export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: "unit",
					globals: true,
					environment: "jsdom",
					setupFiles: ["./tst/setup.ts"],
					include: ["tst/**/*.{test,spec}.{ts,tsx}"],
				},
			},
			{
				extends: true,
				plugins: [storybookTest({ configDir: path.join(import.meta.dirname, ".storybook") })],
				test: {
					name: "storybook",
					browser: {
						enabled: true,
						headless: true,
						provider: playwright({}),
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
