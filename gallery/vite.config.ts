import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * The gallery: one static page showing the package's components from the
 * repo's own source. Run from the repo root as `vite gallery` (or `vite build
 * gallery`), which makes this folder the root and writes the build to
 * gallery/dist. The source it imports sits one level up, so the dev server is
 * allowed to read the whole repo.
 */
export default defineConfig({
	plugins: [react()],
	server: { fs: { allow: [".."] } },
	build: { outDir: "dist", emptyOutDir: true },
});
