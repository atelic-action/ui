import { Star } from "lucide-react";

export interface StarRowProps {
	/**
	 * The rating, 1 to 5, clamped into range. It is said as given (to one
	 * decimal) and drawn as given: a 4.8 fills four stars and eight tenths of
	 * the fifth, never five.
	 */
	rating: number;
	/** Glyph size in px. */
	size?: number;
	className?: string;
}

/** The rating clamped to 1 to 5 and kept to one decimal, as it is said. */
function spoken(rating: number): number {
	return Math.round(Math.max(1, Math.min(5, rating)) * 10) / 10;
}

const STARS = [0, 1, 2, 3, 4];
/** The star's drawn shape sits inside its box: it starts and ends this far in, as a share of the box. */
const INSET = 2 / 24;
/** The space between two stars in px, the same in the sheet (.star-row-back, .star-row-fill). */
const GAP = 2;

/**
 * A row of five stars filled to the rating, rendered as a single labeled
 * image so screen readers announce "4.8 out of 5 stars" instead of the
 * decorative glyphs. Five faint stars sit behind and the filled ones are cut
 * off at the rating, so a 4.8 shows the fifth star nearly full and a 4.2
 * barely begun; a whole rating fills whole stars. Shared by the review
 * components; render one only when the source actually shows a rating,
 * never invent one.
 */
export function StarRow({ rating, size = 15, className }: StarRowProps) {
	const value = spoken(rating);
	const whole = Math.floor(value);
	const part = value - whole;
	// How far across the row the fill reaches, in px: the whole stars with
	// their gaps, then the part of the next one, measured across its shape.
	const reach = whole * (size + GAP) + (part > 0 ? (INSET + part * (1 - 2 * INSET)) * size : 0);
	const width = 5 * size + 4 * GAP;
	const row = (filled: boolean) =>
		STARS.map((star) => (
			<Star
				key={star}
				size={size}
				strokeWidth={1.5}
				fill="currentColor"
				aria-hidden="true"
				className={filled ? undefined : "star-row-empty"}
			/>
		));
	return (
		<span
			className={["star-row", className].filter(Boolean).join(" ")}
			role="img"
			aria-label={`${value} out of 5 stars`}
		>
			<span className="star-row-back">{row(false)}</span>
			<span
				className="star-row-fill"
				style={{ clipPath: `inset(0 ${Math.max(width - reach, 0).toFixed(2)}px 0 0)` }}
			>
				{row(true)}
			</span>
		</span>
	);
}
