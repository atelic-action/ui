import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./tst/setup.ts"],
		include: ["tst/**/*.{test,spec}.{ts,tsx}"],
	},
});
