import type { ReactNode } from "react";

export interface EyebrowProps {
	/** Lifts the color for dark surfaces. */
	onDark?: boolean;
	/** Centers the eyebrow (its trailing fade included). */
	center?: boolean;
	/**
	 * Deprecated no-op. The trailing fade (the wordmark's signature) is now
	 * the default and only rendering; the old leading-dash mode is retired.
	 * Accepted so existing call sites keep compiling.
	 */
	run?: boolean;
	children: ReactNode;
}

/**
 * The small mono, uppercase kicker line above a heading, trailed by a bar
 * that fades out to the right (the practice wordmark's signature), rendered
 * from the primary token so it carries each site's brand color.
 */
export function Eyebrow({ onDark = false, center = false, children }: EyebrowProps) {
	const classes = ["eyebrow", onDark && "on-dark", center && "center"].filter(Boolean).join(" ");
	return <p className={classes}>{children}</p>;
}
