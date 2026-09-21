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

/** The props every layout table in an email carries. */
export const tableReset = {
	role: "presentation" as const,
	cellPadding: "0",
	cellSpacing: "0",
	border: 0,
};

/**
 * `#FC4A1A` to `rgba(252,74,26,0)`, the masthead rule's fade out stop. An accent
 * that is not a three or six digit hex fades to `transparent` rather than to NaN.
 */
export function fadeStop(hex: string): string {
	if (!/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return "transparent";
	const digits = hex.replace("#", "");
	const full =
		digits.length === 3
			? digits
					.split("")
					.map((c) => c + c)
					.join("")
			: digits;
	const r = Number.parseInt(full.slice(0, 2), 16);
	const g = Number.parseInt(full.slice(2, 4), 16);
	const b = Number.parseInt(full.slice(4, 6), 16);
	return `rgba(${r},${g},${b},0)`;
}
