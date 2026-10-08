import type { ArtifactConfig } from "./artifactConfig";

export interface PageMeta {
	/**
	 * The page topic, e.g. "Monthly Report". The recipient's name is
	 * appended automatically so every page reads "Topic | Business". Keep
	 * topics short enough that the full title stays under about 60 characters.
	 */
	title: string;
	/** Escape hatch: use title exactly as given, no recipient suffix. */
	titleAbsolute?: boolean;
	description: string;
	/** Path from the host root, e.g. "/report". */
	path: string;
	ogType?: string;
	ogImage?: string;
	/**
	 * Per-page robots override. Beats the artifact wide value, which is
	 * already noindex; here so a page can never be opened up by accident.
	 */
	robots?: string;
}

/** Canonical URL for a path under the artifact's origin. */
export function canonicalUrl(site: ArtifactConfig, path: string): string {
	return path === "/" ? `${site.url}/` : `${site.url}${path}`;
}

/**
 * Builds the head() meta and link entries for an artifact page: title,
 * description, robots, canonical, Open Graph, and Twitter card. There is no
 * structured data anywhere in this template on purpose. Structured data is
 * how a page asks to be understood by a search engine, and a document sent
 * to one business is asking nothing of the kind.
 */
export function buildPageHead(site: ArtifactConfig, page: PageMeta) {
	const canonical = canonicalUrl(site, page.path);
	// og:image must be a full URL per the OG spec; site-relative paths
	// (self-hosted images under public/) resolve against the host origin.
	const ogImageRaw = page.ogImage ?? site.ogImage;
	const ogImage = ogImageRaw?.startsWith("/") ? `${site.url}${ogImageRaw}` : ogImageRaw;
	const title = page.titleAbsolute ? page.title : `${page.title} | ${site.recipient.name}`;
	return {
		meta: [
			{ title },
			{ name: "description", content: page.description },
			{ name: "robots", content: page.robots ?? site.robots ?? "noindex, nofollow" },
			{ property: "og:type", content: page.ogType ?? "website" },
			{ property: "og:site_name", content: site.recipient.name },
			{ property: "og:title", content: page.title },
			{ property: "og:description", content: page.description },
			{ property: "og:url", content: canonical },
			...(ogImage ? [{ property: "og:image", content: ogImage }] : []),
			{ name: "twitter:card", content: "summary_large_image" },
		],
		links: [{ rel: "canonical", href: canonical }],
	};
}
