import type { ReactNode } from "react";

export interface QuoteCardProps {
	quote: ReactNode;
	/** Attribution line, e.g. "Dr. Alex Rivers, PT, DPT". */
	by: string;
	center?: boolean;
	className?: string;
}

/** Testimonial / pull-quote card with serif italic type. */
export function QuoteCard({ quote, by, center = false, className }: QuoteCardProps) {
	const classes = ["quote-card", center && "center", className].filter(Boolean).join(" ");
	return (
		<figure className={classes}>
			<blockquote>{quote}</blockquote>
			<figcaption className="by">{by}</figcaption>
		</figure>
	);
}
