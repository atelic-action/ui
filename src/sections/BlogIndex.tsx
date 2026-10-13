import { ArrowUpRight } from "lucide-react";
import { displayDate } from "../lib/displayDate";
import { useWithBase } from "../routing/BasePathProvider";

export interface BlogIndexItem {
	slug: string;
	title: string;
	description?: string;
	publishedAt: string;
	/** Reading time in minutes, when the caller has computed one. */
	readingMinutes?: number;
}

export interface BlogIndexProps {
	items: BlogIndexItem[];
	/** Base path the slugs hang from. Defaults to "/blog". */
	basePath?: string;
	id?: string;
	className?: string;
}

/**
 * Formats an ISO date for display without pulling in a date library or
 * tripping over timezones. A bare "2025-03-27" parsed by Date() is treated as
 * UTC midnight and renders as the previous day west of Greenwich, which is a
 * classic way to publish a post that appears to predate itself.
 */
/**
 * The blog listing: every post, newest first, as a plain readable stack
 * rather than a card grid. These are articles, not products, and a list
 * that reads top to bottom suits a small archive better than a gallery
 * that pads it out.
 *
 * Every entry is a real anchor to a prerendered page, which is what lets
 * the build's link crawler discover the posts without an explicit page
 * list in the vite config.
 */
export function BlogIndex({ items, basePath = "/blog", id, className }: BlogIndexProps) {
	const withBase = useWithBase();
	return (
		<section className={["section", "blog-index", className].filter(Boolean).join(" ")} id={id}>
			<div className="wrap">
				<ol className="bi-list">
					{items.map((item) => (
						<li className="bi-item" key={item.slug}>
							<a className="bi-link" href={withBase(`${basePath}/${item.slug}`)}>
								<span className="bi-meta">
									<time dateTime={item.publishedAt}>{displayDate(item.publishedAt)}</time>
									{item.readingMinutes ? <span> · {item.readingMinutes} min read</span> : null}
								</span>
								<h2 className="bi-title">
									{item.title}
									<ArrowUpRight className="bi-arrow" size={20} strokeWidth={2} aria-hidden="true" />
								</h2>
								{item.description && <p className="bi-excerpt">{item.description}</p>}
							</a>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
