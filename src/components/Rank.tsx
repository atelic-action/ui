import { newTabProps } from "../lib/newTabProps";
import type { Tone } from "./tone";

export interface RankProps {
	/** The figure: a rank, a place in an answer, or a dash for none. */
	figure: string;
	/** The tone its badge reads in. */
	tone: Tone;
	/** What the badge means, for a screen reader, e.g. "Top ten". */
	meaning: string;
	/** Where the figure leads, e.g. the page that holds the rank. */
	href?: string;
	/** Open the link in a new tab. */
	newTab?: boolean;
	className?: string;
}

/**
 * A figure with its badge, for a table cell: the badge in its tone on the
 * left, the figure on the right, linked when it has somewhere to go. The
 * figure's slot is a fixed width, so every rank in a column is the same width
 * and the badges line up down it.
 */
export function Rank({ figure, tone, meaning, href, newTab, className }: RankProps) {
	return (
		<span className={["rank", className].filter(Boolean).join(" ")} data-tone={tone}>
			<span className="chart-swatch" role="img" aria-label={meaning} />
			{href ? (
				<a href={href} {...newTabProps(href, newTab)}>
					{figure}
				</a>
			) : (
				<span>{figure}</span>
			)}
		</span>
	);
}
