/**
 * What a site's vite.config.ts imports (`@atelic-action/ui/vite`): the
 * configuration of an artifact site as one call, and the plugin inside it
 * for a site that writes its own.
 */
export {
	type ArtifactConfigOptions,
	type ArtifactPage,
	artifactConfig,
	artifactPages,
} from "./artifact-config.js";
export { DOC_DIR, isPrivateContent, privateChunks } from "./private-chunks.js";
