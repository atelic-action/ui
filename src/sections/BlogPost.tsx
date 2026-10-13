import { ArrowLeft } from "lucide-react";
import { displayDate } from "../lib/displayDate";
import { type ProseBlock, ProseBlocks } from "../primitives/ProseBlocks";
import { useWithBase } from "../routing/BasePathProvider";

export interface BlogPostDoc {
	title: string;
	description?: string;
	publishedAt: string;
	updatedAt?: string | null;
	author?: string;
	blocks: ProseBlock[];
}

export interface BlogPostProps {
	doc: BlogPostDoc;
	/** Where the "all posts" link goes. Defaults to "/blog". */
	basePath?: string;
	backLabel?: string;
	id?: string;
	className?: string;
}

/**
 * A single post: byline, dateline, body, and a way back to the archive.
 *
 * The article's own `h1` lives here rather than in a PageHero, because a post
 * title is the content rather than a page banner, and a hero would push 800
 * words of the thing someone came to read below the fold.
 *
 * `dateModified` renders only when the source carries one. A "last updated"
 * line invented at port time would be a freshness claim about writing nobody
 * has touched.
 */
export function BlogPost({
	doc,
	basePath = "/blog",
	backLabel = "All posts",
	id,
	className,
}: BlogPostProps) {
	const withBase = useWithBase();
	return (
		<article className={["section", "blog-post", className].filter(Boolean).join(" ")} id={id}>
			<div className="wrap bp-wrap">
				<a className="bp-back" href={withBase(basePath)}>
					<ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
					{backLabel}
				</a>

				<h1 className="bp-title">{doc.title}</h1>

				<p className="bp-meta">
					{doc.author && <span className="bp-author">{doc.author}</span>}
					<time dateTime={doc.publishedAt}>{displayDate(doc.publishedAt)}</time>
					{doc.updatedAt && doc.updatedAt !== doc.publishedAt && (
						<span className="bp-updated">Updated {displayDate(doc.updatedAt)}</span>
					)}
				</p>

				<ProseBlocks blocks={doc.blocks} className="bp-body" />
			</div>
		</article>
	);
}
