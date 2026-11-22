import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import { mergeConfig } from "vite";

/**
 * Storybook for the package, on the repo's own source: every story imports
 * from `src/` by relative path, the way the gallery does, so it always shows
 * the code in the repo. Nothing here or in `stories/` publishes (the
 * package's `files` names `src`, `dist`, and `bin` alone).
 */
const config: StorybookConfig = {
	stories: ["../stories/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
	framework: { name: "@storybook/react-vite", options: {} },
	// The gallery's fonts, pictures, and clip, and the stories' own pictures
	// (the marks cut per surface), served at the root as a site serves its
	// public folder. The gallery's folder moves here when the gallery goes.
	staticDirs: ["../gallery/public", "../stories/public"],
	core: { disableTelemetry: true },
	async viteFinal(viteConfig) {
		return mergeConfig(viteConfig, {
			// The app shell is Tailwind source; the plugin leaves the package's
			// plain sheets as they are, as it does in the gallery.
			plugins: [tailwindcss()],
			// A cold cache can hand React's dev runtime out twice, which shows up
			// as a null useState in the first story rendered.
			optimizeDeps: { include: ["react/jsx-dev-runtime"] },
		});
	},
};

export default config;
