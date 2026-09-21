/**
 * The palette the runner emails are painted in, ported one to one from
 * homebase `runners/lib/email.jq` (the tokens section). Cream ground, paper
 * cards on a hairline, near black ink, the orange reserved for the one number
 * that matters on a row.
 *
 * A client branded email passes its own Palette to EmailThemeProvider; the
 * values below are the default.
 */
export type Palette = {
	/** The page behind the cards. */
	ground: string;
	/** A card's own fill. */
	paper: string;
	/** Headings and anything read closely. */
	ink: string;
	/** Secondary prose. */
	dim: string;
	/** Eyebrows, captions, and anything deliberately quiet. */
	faint: string;
	/** The single accent. */
	accent: string;
	/** A card's border and the heavier rule. */
	line: string;
	/** The lighter rule inside a card. */
	hair: string;
};

export const atelicPalette: Palette = {
	ground: "#F6F1E7",
	paper: "#FDFBF6",
	ink: "#151515",
	dim: "#55503f",
	faint: "#8a8272",
	accent: "#FC4A1A",
	line: "#E6DFD2",
	hair: "#F0EAE0",
};

/**
 * Font family values, not whole declarations: the components compose them
 * into a `fontFamily` style property.
 */
export type Fonts = {
	/** Eyebrows, numbers, and anything the reader copies rather than reads. */
	mono: string;
	/** Everything read. */
	sans: string;
};

export const atelicFonts: Fonts = {
	mono: "'Courier New',monospace",
	sans: "'Helvetica Neue',Helvetica,Arial,sans-serif",
};
