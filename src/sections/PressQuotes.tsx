export interface PressItem {
	/** The quote or award title, e.g. "Best Coffeehouse for Food". */
	quote: string;
	/** Publication name, e.g. "Westword". */
	source: string;
	year: string | number;
	/** Link to the article; rows without one render unlinked. */
	href?: string;
}

export interface PressQuotesProps {
	items: PressItem[];
	/** Display order by year; newest first unless told otherwise. */
	order?: "newest" | "oldest";
	className?: string;
}

/** Sort press items by year; exported for tests. */
export function sortPress(items: PressItem[], order: "newest" | "oldest"): PressItem[] {
	const dir = order === "newest" ? -1 : 1;
	return [...items].sort((a, b) => dir * (Number(a.year) - Number(b.year)));
}

/** Rule separated rows of press quotes and awards, each citing its publication and year and linking to the article. */
export function PressQuotes({ items, order = "newest", className }: PressQuotesProps) {
	return (
		<ul className={["press-quotes", className].filter(Boolean).join(" ")}>
			{sortPress(items, order).map((item) => {
				const body = (
					<>
						<span className="pq-quote">{item.quote}</span>
						<span className="pq-src">
							{item.source} · {item.year}
						</span>
					</>
				);
				return (
					<li key={item.source + item.year + item.quote}>
						{item.href ? (
							<a className="pq-row" href={item.href} target="_blank" rel="noopener noreferrer">
								{body}
							</a>
						) : (
							<div className="pq-row">{body}</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}
