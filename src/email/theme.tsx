import { type CSSProperties, createContext, type ReactNode, useContext } from "react";
import { atelicFonts, atelicPalette, type Fonts, type Palette } from "../tokens";

export type EmailTheme = {
	palette: Palette;
	fonts: Fonts;
};

const EmailThemeContext = createContext<EmailTheme>({
	palette: atelicPalette,
	fonts: atelicFonts,
});

export type EmailThemeProviderProps = {
	palette?: Palette;
	fonts?: Fonts;
	children?: ReactNode;
};

/**
 * Wraps a tree of email rows in a palette and a font pair. A client branded
 * email passes its own; everything defaults to Atelic.
 */
export function EmailThemeProvider({
	palette = atelicPalette,
	fonts = atelicFonts,
	children,
}: EmailThemeProviderProps) {
	return (
		<EmailThemeContext.Provider value={{ palette, fonts }}>{children}</EmailThemeContext.Provider>
	);
}

export function useEmailTheme(): EmailTheme {
	return useContext(EmailThemeContext);
}

/**
 * The shared eyebrow: monospace, small, wide, uppercase. The caller adds the
 * color, because which color an eyebrow wears is what it says.
 */
export function eyebrowStyle(fonts: Fonts): CSSProperties {
	return {
		fontFamily: fonts.mono,
		fontSize: "11px",
		letterSpacing: "0.12em",
		textTransform: "uppercase",
	};
}

/**
 * One long token (a path, an address, a long word) breaks inside its cell
 * instead of holding the cell open and widening the email past a phone. Mail
 * clients honor both inline; `word-break: break-word` is the older spelling
 * some still read.
 */
export const wrapLong = { overflowWrap: "anywhere", wordBreak: "break-word" } as const;

/** The props every layout table in an email carries. */
export const tableReset = {
	role: "presentation" as const,
	cellPadding: "0",
	cellSpacing: "0",
	border: 0,
};

/** `#FC4A1A` or `#f4a` as red, green, and blue, or null for anything that is not a three or six digit hex. */
function rgb(hex: string): [number, number, number] | null {
	if (!/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
	const digits = hex.replace("#", "");
	const full =
		digits.length === 3
			? digits
					.split("")
					.map((c) => c + c)
					.join("")
			: digits;
	return [
		Number.parseInt(full.slice(0, 2), 16),
		Number.parseInt(full.slice(2, 4), 16),
		Number.parseInt(full.slice(4, 6), 16),
	];
}

/**
 * `#FC4A1A` to `rgba(252,74,26,0)`, the masthead rule's fade out stop. An accent
 * that is not a three or six digit hex fades to `transparent` rather than to NaN.
 */
export function fadeStop(hex: string): string {
	const channels = rgb(hex);
	if (!channels) return "transparent";
	const [r, g, b] = channels;
	return `rgba(${r},${g},${b},0)`;
}

function luminance([r, g, b]: [number, number, number]): number {
	const linear = (v: number) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** The WCAG contrast ratio of two hex colors, or null when either is not a hex. */
export function contrastRatio(a: string, b: string): number | null {
	const x = rgb(a);
	const y = rgb(b);
	if (!x || !y) return null;
	const [light, dark] = [luminance(x), luminance(y)].sort((p, q) => q - p);
	return (light + 0.05) / (dark + 0.05);
}

/** The ratio small words need against what they sit on. */
const TEXT_CONTRAST = 4.5;

const toHex = (channels: number[]) =>
	`#${channels
		.map((v) => v.toString(16).padStart(2, "0"))
		.join("")
		.toUpperCase()}`;

/**
 * The accent as the color of small words: the palette's own `accentInk`, or,
 * for a palette that names only an accent, the accent darkened toward black
 * one step at a time until it reads 4.5 to 1 on both the paper and the
 * ground (the accent itself when it already does). A palette whose colors
 * are not hex values falls back to its ink, which always reads.
 */
export function accentInk(palette: Palette): string {
	if (palette.accentInk) return palette.accentInk;
	const channels = rgb(palette.accent);
	const grounds = [palette.paper, palette.ground];
	if (!channels || grounds.some((ground) => !rgb(ground))) return palette.ink;
	if (grounds.every((ground) => (contrastRatio(palette.accent, ground) ?? 0) >= TEXT_CONTRAST)) {
		return palette.accent;
	}
	for (let step = 1; step <= 100; step += 1) {
		const candidate = toHex(channels.map((v) => Math.round(v * (1 - step / 100))));
		if (grounds.every((ground) => (contrastRatio(candidate, ground) ?? 0) >= TEXT_CONTRAST)) {
			return candidate;
		}
	}
	return palette.ink;
}
