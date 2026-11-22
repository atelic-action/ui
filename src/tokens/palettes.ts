/**
 * The palette the runner emails are painted in, ported one to one from
 * homebase `runners/lib/email.jq` (the tokens section). Cream ground, paper
 * cards on a hairline, near black ink, the orange reserved for the one number
 * that matters on a row. The bright orange marks (a rule, a dot, a link's
 * underline) and never colors small words: those take the accent's ink.
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
	/**
	 * The single accent, as a mark: a rule, a dot, a link's underline, a
	 * callout's edge. Never the color of small words; see `accentInk`.
	 */
	accent: string;
	/**
	 * The accent as the color of small words: the value on a title line, a
	 * short count, a group's name, a hot cell, a pill. It must read 4.5 to 1
	 * on both `paper` and `ground`. Optional (8.0.0): a palette without it
	 * gets one derived from `accent`, darkened toward black until it passes
	 * on both, which is the accent itself when that already passes.
	 */
	accentInk?: string;
	/** A card's border and the heavier rule. */
	line: string;
	/** The lighter rule inside a card. */
	hair: string;
	/**
	 * A change for the better, such as a positive delta under a stat. Optional
	 * so a palette written before 0.5.0 still compiles; a palette without it
	 * borrows the Atelic value.
	 */
	up?: string;
	/** A change for the worse, the negative delta's color. Optional the same way. */
	down?: string;
	/**
	 * The cooling tone between `up` and the accent: a record opened inside two
	 * weeks but not one (Company Cards, 0.7.0). Optional the same way.
	 */
	warm?: string;
};

export const atelicPalette: Palette = {
	ground: "#F6F1E7",
	paper: "#FDFBF6",
	ink: "#151515",
	dim: "#55503f",
	// The brand kit's Faint, darkened from the jq's #8a8272 (3.38 to 1 on the
	// ground, 3.68 on paper) to pass text contrast at the 11px a masthead's
	// title and meta are set in: 4.99 to 1 on the ground, 5.43 on paper (8.0.0).
	faint: "#6e6757",
	// The mark. As words it reads 3.31 to 1 on paper and 3.04 on the ground.
	accent: "#FC4A1A",
	// The brand kit's Orange Ink: 5.86 to 1 on paper, 5.38 on the ground (8.0.0).
	accentInk: "#B8300B",
	line: "#E6DFD2",
	hair: "#F0EAE0",
	up: "#2F7A4B",
	down: "#B23A2E",
	// Darkened from the jq's #B7791F (3.52 to 1 on paper) along the same hue:
	// 4.96 on paper, 4.55 on the ground (8.0.0).
	warm: "#966319",
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
