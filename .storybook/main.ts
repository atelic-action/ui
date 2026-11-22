import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

/**
 * Storybook for the package, on the repo's own source: every story imports
 * from `src/` by relative path, never from the package name, so it always
 * shows the code in the repo. Built, it is what ui.atelic.me serves. Nothing here or in `stories/` publishes (the
 * package's `files` names `src`, `dist`, and `bin` alone).
 */
const config: StorybookConfig = {
	stories: ["../stories/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
	framework: { name: "@storybook/react-vite", options: {} },
	// The fonts, the pictures, the clip, and robots.txt, served at the root as
	// a site serves its public folder.
	staticDirs: ["../stories/public"],
	core: { disableTelemetry: true },
	async viteFinal(viteConfig) {
		return mergeConfig(viteConfig, {
			// The app shell is Tailwind source; the plugin leaves the package's
			// plain sheets as they are.
			plugins: [tailwindcss()],
			// A cold cache can hand React's dev runtime out twice, which shows up
			// as a null useState in the first story rendered.
			optimizeDeps: { include: ["react/jsx-dev-runtime"] },
		});
	},
};

export default config;
