import type { Palette } from "./palettes";

/**
 * Which site token each email palette key answers to, so an email palette can
 * dress a web page and a page's theme can dress an email. The names are the
 * ones in a site's `theme.css`; only the keys with a clear counterpart are
 * mapped, which is why the neutral ramp, the radii, and the shadows are
 * absent. `--ink` and `--surface-dark` both take the ink, exactly as the site
 * defines them.
 */
export const themeTokenMap: Record<string, keyof Palette> = {
	"--surface": "ground",
	"--surface-dark": "ink",
	"--card": "paper",
	"--ink": "ink",
	"--primary": "accent",
};

/**
 * The palette as CSS custom property declarations, one per line, ready to drop
 * inside a selector block.
 */
export function toThemeCSS(palette: Palette): string {
	return Object.entries(themeTokenMap)
		.map(([token, key]) => `${token}: ${palette[key]};`)
		.join("\n");
}
