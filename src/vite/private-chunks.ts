/**
 * Keeps a document's content out of every file the login page can load.
 *
 * With the wall armed, /assets/ stays open because the login page needs its
 * own hashed CSS and JS to render (needsSession in src/gate/wall.ts). A content module that
 * lands in a chunk there would be readable by anyone who opens /login, which
 * is exactly how the example writeup and report first shipped: their route
 * heads imported the content, so all of it rode in the entry bundle. So the
 * client build writes every chunk carrying a private content module into
 * /assets/doc/, which the wall holds back, and fails outright when one turns
 * up anywhere else.
 *
 * Public content is the short list that is safe to ship to every page: the
 * 404's copy, the sealed proposal (ciphertext by design, GATE.md), and the
 * heads in `*.meta.ts`, which carry a title and nothing a snapshot produced.
 * Every other module under src/content/ is treated as private, so a new
 * artifact starts behind the wall.
 */
import type { Plugin } from "vite";

/** Where the client build writes the chunks the wall holds back. */
export const DOC_DIR = "assets/doc";

const PUBLIC_CONTENT = /\/src\/content\/(not-found\.tsx|proposal[^/]*|[^/]+\.meta\.ts)$/;

/** Whether a module id is content that must never ship to the login page. */
export function isPrivateContent(id: string): boolean {
	const path = id.split("?")[0].replaceAll("\\", "/");
	return path.includes("/src/content/") && !PUBLIC_CONTENT.test(path);
}

export function privateChunks(): Plugin {
	return {
		name: "atelic:private-chunks",
		configEnvironment(name) {
			if (name !== "client") return;
			return {
				build: {
					rollupOptions: {
						output: {
							chunkFileNames: (chunk) =>
								chunk.moduleIds.some(isPrivateContent)
									? `${DOC_DIR}/[name]-[hash].js`
									: "assets/[name]-[hash].js",
						},
					},
				},
			};
		},
		generateBundle(_options, bundle) {
			if (this.environment?.name !== "client") return;
			for (const file of Object.values(bundle)) {
				if (file.type !== "chunk" || file.fileName.startsWith(`${DOC_DIR}/`)) continue;
				const leaked = Object.entries(file.modules)
					.filter(([id, module]) => module.renderedLength > 0 && isPrivateContent(id))
					.map(([id]) => id.slice(id.indexOf("/src/") + 1));
				if (leaked.length > 0) {
					this.error(
						`${file.fileName} would ship ${leaked.join(", ")} outside ${DOC_DIR}/, where the login page can load it with no session. A route's head is the usual cause: give it a *.meta.ts module and keep the content to the component.`,
					);
				}
			}
		},
	};
}
