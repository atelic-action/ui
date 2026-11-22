import type { BrandLogo } from "../types";

/**
 * The two grounds a mark is drawn on: `light` is the solid light bar, and
 * `dark` is everything else the chrome puts a mark on (the dark bar, the
 * transparent bar over a hero, and the footer band).
 */
export type MarkSurface = "light" | "dark";

/**
 * A mark as one surface draws it: the image, and the silhouette it is
 * flattened to when the image was cut for the other ground. `ink` flattens
 * it dark for a light ground, `light` flattens it white for a dark ground,
 * and `null` draws the artwork as given.
 */
export interface ResolvedMark {
	src: string;
	tint: "ink" | "light" | null;
}

/**
 * Which image a surface draws, and how, by one order the header and the
 * footer share.
 *
 * - A cut made for the surface (`onLight` on light, `onDark` on dark) is drawn
 *   as given, never recolored.
 * - Failing that, `src`, the single light mark sites have always passed: drawn
 *   as given on a dark ground and flattened to ink on a light one.
 * - Failing that, the cut made for the other ground, flattened to the
 *   surface's silhouette, since drawn as given it would vanish (a light only
 *   mark on the light bar, an ink only mark on the footer).
 *
 * Null when the logo carries no image at all.
 */
export function resolveMark(
	logo: BrandLogo | undefined,
	surface: MarkSurface,
): ResolvedMark | null {
	if (!logo) return null;
	const own = surface === "light" ? logo.onLight : logo.onDark;
	if (own) return { src: own, tint: null };
	if (logo.src) return { src: logo.src, tint: surface === "light" ? "ink" : null };
	const other = surface === "light" ? logo.onDark : logo.onLight;
	if (other) return { src: other, tint: surface === "light" ? "ink" : "light" };
	return null;
}

/** Whether the logo draws a mark of any kind: a glyph tile or an image. */
export function hasMark(logo: BrandLogo | undefined): boolean {
	return Boolean(logo?.tile || logo?.src || logo?.onLight || logo?.onDark);
}

/** The class a resolved mark's silhouette wears, or none for artwork drawn as given. */
export function tintClass(mark: ResolvedMark): string | undefined {
	return mark.tint === "ink" ? "is-tinted" : mark.tint === "light" ? "is-tinted-light" : undefined;
}
