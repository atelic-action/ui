import { Star, StarHalf } from "lucide-react";

export interface StarRowProps {
	/**
	 * The rating, 1 to 5, clamped into range. It is said as given (to one
	 * decimal) and drawn to the nearest half star, so a 4.5 reads and shows
	 * as four and a half, never as five.
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

/**
 * A row of filled stars, rendered as a single labeled image so screen
 * readers announce "4.5 out of 5 stars" instead of the decorative glyphs.
 * Whole stars draw filled and a half star draws as one; a whole rating
 * looks as it always has. Shared by the review components; render one only
 * when the source actually shows a rating, never invent one.
 */
export function StarRow({ rating, size = 15, className }: StarRowProps) {
	const value = spoken(rating);
	// Drawn to the nearest half: 4.3 shows four and a half, 4.2 shows four.
	const halves = Math.round(value * 2);
	const whole = Math.floor(halves / 2);
	const half = halves % 2 === 1;
	return (
		<span
			className={["star-row", className].filter(Boolean).join(" ")}
			role="img"
			aria-label={`${value} out of 5 stars`}
		>
			{Array.from({ length: whole }, (_, i) => (
				<Star
					// biome-ignore lint/suspicious/noArrayIndexKey: static decorative row
					key={i}
					size={size}
					strokeWidth={1.5}
					fill="currentColor"
					aria-hidden="true"
				/>
			))}
			{half && <StarHalf size={size} strokeWidth={1.5} fill="currentColor" aria-hidden="true" />}
		</span>
	);
}
