import { Star } from "lucide-react";

export interface StarRowProps {
	/** Star count, 1 to 5. Rounded and clamped into range. */
	rating: number;
	/** Glyph size in px. */
	size?: number;
	className?: string;
}

/**
 * A row of filled stars, rendered as a single labeled image so screen
 * readers announce "4 out of 5 stars" instead of four decorative glyphs.
 * Shared by the review components; render one only when the source
 * actually shows a rating — never invent one.
 */
export function StarRow({ rating, size = 15, className }: StarRowProps) {
	const count = Math.max(1, Math.min(5, Math.round(rating)));
	return (
		<span
			className={["star-row", className].filter(Boolean).join(" ")}
			role="img"
			aria-label={`${count} out of 5 stars`}
		>
			{Array.from({ length: count }, (_, i) => (
				<Star
					// biome-ignore lint/suspicious/noArrayIndexKey: static decorative row
					key={i}
					size={size}
					strokeWidth={1.5}
					fill="currentColor"
					aria-hidden="true"
				/>
			))}
		</span>
	);
}
