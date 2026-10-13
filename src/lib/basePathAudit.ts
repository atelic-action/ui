/**
 * The build's base path audit, kept pure so the tests can drive it; a site's
 * build runs it over dist/client through `atelic-check-base-path`.
 *
 * Two failures it exists to catch. A root absolute path that skipped
 * `withBase` still builds and still prerenders (the crawler prefixes it on its
 * own), and only breaks once the site is served under its base, as a link to
 * the host owner's page or an image that 404s. And a based cut whose
 * vercel.json lacks the two rewrites serves fine through the host owner's
 * proxy but 404s every asset on its own Vercel host, while a root cut that
 * kept them carries a stray rule. Neither shows up in a root build, so both
 * fail the build loudly instead.
 */
import { hasBase } from "../routing/basePath";

const ATTRIBUTE = /\s(?:href|src|action|poster)\s*=\s*"([^"]*)"/g;
const SRCSET = /\ssrcset\s*=\s*"([^"]*)"/gi;
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

function isRootAbsolute(ref: string): boolean {
	return ref.startsWith("/") && !ref.startsWith("//");
}

/** Every root absolute path an HTML document references through an attribute. */
export function htmlRefs(html: string): string[] {
	const refs: string[] = [];
	for (const match of html.matchAll(ATTRIBUTE)) refs.push(match[1]);
	for (const match of html.matchAll(SRCSET)) {
		for (const candidate of match[1].split(",")) refs.push(candidate.trim().split(/\s+/)[0]);
	}
	return refs.filter(isRootAbsolute);
}

/** Every root absolute path a stylesheet references through `url()`. */
export function cssRefs(css: string): string[] {
	return [...css.matchAll(CSS_URL)].map((match) => match[2].trim()).filter(isRootAbsolute);
}

/** The root absolute references that do not carry the base. Empty at the root. */
export function unbasedRefs(refs: string[], base: string): string[] {
	if (!base) return [];
	return [...new Set(refs.filter((ref) => !hasBase(base, ref)))];
}

export interface Rewrite {
	source: string;
	destination: string;
}

/** The two rewrites a based cut's vercel.json carries, so its own host serves the prefixed URLs. */
export function expectedRewrites(base: string): Rewrite[] {
	if (!base) return [];
	return [
		{ source: `${base}/:path*`, destination: "/:path*" },
		{ source: base, destination: "/" },
	];
}

/**
 * True for a rewrite of the base path shape: a prefix's subtree mapped back
 * onto the root, or the bare prefix mapped onto "/" beside such a subtree
 * rule (alone, "/home" to "/" is an ordinary rewrite and stays legal).
 */
function isBaseRewrite(rewrite: Rewrite, all: Rewrite[]): boolean {
	if (rewrite.destination === "/:path*" && rewrite.source.endsWith("/:path*")) return true;
	return (
		rewrite.destination === "/" &&
		all.some((r) => r.source === `${rewrite.source}/:path*` && r.destination === "/:path*")
	);
}

/**
 * What is wrong with vercel.json's rewrites for this base: a missing expected
 * rewrite, or a base path rewrite for a prefix the build does not carry.
 */
export function rewriteProblems(vercel: { rewrites?: Rewrite[] }, base: string): string[] {
	const rewrites = vercel.rewrites ?? [];
	const expected = expectedRewrites(base);
	const problems: string[] = [];
	for (const want of expected) {
		if (!rewrites.some((r) => r.source === want.source && r.destination === want.destination)) {
			problems.push(`missing rewrite ${JSON.stringify(want)}`);
		}
	}
	for (const rewrite of rewrites) {
		const wanted = expected.some(
			(want) => want.source === rewrite.source && want.destination === rewrite.destination,
		);
		if (!wanted && isBaseRewrite(rewrite, rewrites)) {
			problems.push(
				`stray base path rewrite ${JSON.stringify(rewrite)} for a build ${base ? `based at ${base}` : "at the root"}`,
			);
		}
	}
	return problems;
}
