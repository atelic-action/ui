import type { ReactNode } from "react";

export interface SplitSectionProps {
	left: ReactNode;
	right: ReactNode;
	/**
	 * Column proportions: "even" (1/1), or "narrow-first" (0.9/1.1,
	 * the media-plus-copy pattern).
	 */
	ratio?: "even" | "narrow-first";
	align?: "start" | "center";
	/** Section background band. */
	surface?: "default" | "alt";
	/** Compact top padding for sections directly under a page hero. */
	tightTop?: boolean;
	/**
	 * Compact bottom padding for when the next section continues this
	 * one's thought (e.g. a list that belongs to this section's copy).
	 * Pair with `tight-top` on the follower to close the gap.
	 */
	tightBottom?: boolean;
	id?: string;
	className?: string;
}

/** The recurring two-column section: copy plus copy, or media plus copy. */
export function SplitSection({
	left,
	right,
	ratio = "even",
	align = "start",
	surface = "default",
	tightTop = false,
	tightBottom = false,
	id,
	className,
}: SplitSectionProps) {
	const sectionClasses = [
		"section",
		surface === "alt" && "surface-alt",
		tightTop && "tight-top",
		tightBottom && "tight-bottom",
		className,
	]
		.filter(Boolean)
		.join(" ");
	const gridClasses = ["split", `ratio-${ratio}`, `align-${align}`].join(" ");
	return (
		<section className={sectionClasses} id={id}>
			<div className={`wrap ${gridClasses}`}>
				<div>{left}</div>
				<div>{right}</div>
			</div>
		</section>
	);
}
