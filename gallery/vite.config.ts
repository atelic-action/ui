import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * The gallery: one static page showing the package's components from the
 * repo's own source. Run from the repo root as `vite gallery` (or `vite build
 * gallery`), which makes this folder the root and writes the build to
 * gallery/dist. The source it imports sits one level up, so the dev server is
 * allowed to read the whole repo. Two pages: The Components (index.html) and
 * the app shell (app.html), whose stylesheet alone is Tailwind; the plugin
 * leaves a sheet with no Tailwind in it as it is.
 */
export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: { fs: { allow: [".."] } },
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: { input: { index: "index.html", app: "app.html" } },
	},
});
