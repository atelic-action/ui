import type { ReactNode } from "react";

export interface SplitSectionProps {
	left: ReactNode;
	right: ReactNode;
	/**
	 * Column proportions from 920px up (`media` from 761px, where a card row splits); below that every ratio stacks.
	 * "even" (1/1); "narrow-first" (0.9/1.1, a looser media plus copy);
	 * or "media", a fixed 420px media column and the gap a card row uses,
	 * so a photo beside copy lines up with a case study entry above it,
	 * with an `ImageFrame` in it held to the column's left edge.
	 */
	ratio?: "even" | "narrow-first" | "media";
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
