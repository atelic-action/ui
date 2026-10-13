import { ArrowUpRight } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { SectionHeading } from "../primitives";
import { StarRow } from "../primitives/StarRow";

export interface ReviewItem {
	/** The review text, verbatim. Rendered inside typographic quote marks. */
	quote: string;
	/** Attribution, exactly as the source attributes it (e.g. "Greg T."). */
	by: string;
	/** Optional context line under the name: a source, a service, a city. */
	detail?: string;
	/**
	 * Star count, 1 to 5. Render stars only when the source shows them —
	 * never invent a rating the reviewer didn't give.
	 */
	rating?: number;
	/**
	 * Review date as the source gives it. An ISO date (`2026-04-24`) sorts
	 * correctly and renders as-is; any other string renders but sorts
	 * lexically, so prefer ISO.
	 */
	date?: string;
	/** Permalink to the review at its source; turns the date into a link. */
	sourceUrl?: string;
	/** Short labels (service, program, location) that drive the filter. */
	tags?: string[];
}

export interface ReviewWallProps {
	items: ReviewItem[];
	/** Optional header block above the grid. */
	eyebrow?: string;
	title?: ReactNode;
	lead?: ReactNode;
	/**
	 * Tag filter dropdown. Defaults to on whenever the data carries tags —
	 * pass `false` to suppress it; `true` is a no-op without tags.
	 */
	filterable?: boolean;
	/**
	 * Newest / oldest sort dropdown. Defaults to on whenever the data
	 * carries dates.
	 */
	sortable?: boolean;
	/** Label for the "no filter" option, e.g. "All services". */
	allTagsLabel?: string;
	/**
	 * Character budget above which a quote visually clamps behind a
	 * "Read more" toggle. The full text always ships in the static HTML
	 * (the clamp is CSS-only), so crawlers read every word.
	 */
	clampAt?: number;
	id?: string;
	className?: string;
}

function initials(by: string): string {
	return by
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0] ?? "")
		.join("")
		.toUpperCase();
}

function ReviewCard({ item, clampAt }: { item: ReviewItem; clampAt: number }) {
	const clampable = item.quote.length > clampAt;
	const [expanded, setExpanded] = useState(false);
	return (
		<figure className="rw-card">
			{(item.rating != null || item.date) && (
				<div className="rw-top">
					{item.rating != null && <StarRow rating={item.rating} />}
					{item.date &&
						(item.sourceUrl ? (
							<a
								className="rw-date"
								href={item.sourceUrl}
								target="_blank"
								rel="noopener"
								aria-label={`Read the ${item.date} review from ${item.by} at its source`}
							>
								{item.date}
								<ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
							</a>
						) : (
							<span className="rw-date">{item.date}</span>
						))}
				</div>
			)}
			<blockquote
				className={["rw-quote", clampable && !expanded && "clamped"].filter(Boolean).join(" ")}
			>
				“{item.quote}”
			</blockquote>
			{clampable && (
				<button
					type="button"
					className="rw-more"
					aria-expanded={expanded}
					onClick={() => setExpanded((open) => !open)}
				>
					{expanded ? "Show less" : "Read more"}
				</button>
			)}
			{item.tags && item.tags.length > 0 && (
				<div className="rw-tags">
					{item.tags.map((tag) => (
						<span className="rw-tag" key={tag}>
							{tag}
						</span>
					))}
				</div>
			)}
			<figcaption className="rw-who">
				<span className="rw-avatar" aria-hidden="true">
					{initials(item.by)}
				</span>
				<span className="rw-name-block">
					<span className="rw-name">{item.by}</span>
					{item.detail && <span className="rw-detail">{item.detail}</span>}
				</span>
			</figcaption>
		</figure>
	);
}

/**
 * The reviews-page organism: an optional header block, optional tag and
 * sort controls, and a responsive grid of uniform review cards. Each card
 * carries an optional star row, an optional date that links out to the
 * review at its source, a CSS-clamped quote behind a per-card "Read more"
 * toggle, optional tag chips, and an initials-avatar attribution line
 * pinned to the card floor.
 *
 * Everything above the grid is optional, so the bare `<ReviewWall items />`
 * form still renders a plain wall under a page's own SectionHeading. The
 * controls appear only when the data can drive them (tags for the filter,
 * dates for the sort), and the unfiltered state is what prerenders, so
 * every quote ships in the static HTML.
 */
export function ReviewWall({
	items,
	eyebrow,
	title,
	lead,
	filterable,
	sortable,
	allTagsLabel = "All tags",
	clampAt = 220,
	id,
	className,
}: ReviewWallProps) {
	const tags = useMemo(() => {
		const seen = new Set<string>();
		for (const item of items) for (const tag of item.tags ?? []) seen.add(tag);
		return [...seen].sort((a, b) => a.localeCompare(b));
	}, [items]);
	const hasDates = useMemo(() => items.some((item) => item.date), [items]);

	const showFilter = (filterable ?? true) && tags.length > 0;
	const showSort = (sortable ?? true) && hasDates;

	const [tag, setTag] = useState("");
	const [order, setOrder] = useState<"newest" | "oldest">("newest");

	const shown = useMemo(() => {
		const kept = tag ? items.filter((item) => item.tags?.includes(tag)) : [...items];
		if (!showSort) return kept;
		return kept.sort((a, b) => {
			const left = a.date ?? "";
			const right = b.date ?? "";
			if (left === right) return 0;
			return order === "newest" ? right.localeCompare(left) : left.localeCompare(right);
		});
	}, [items, tag, order, showSort]);

	return (
		<div className={["review-wall-block", className].filter(Boolean).join(" ")} id={id}>
			{(eyebrow || title) && <SectionHeading eyebrow={eyebrow} title={title ?? ""} lead={lead} />}

			{(showFilter || showSort) && (
				<div className="rw-controls">
					{showFilter && (
						<label className="rw-select">
							<span className="rw-select-label">Filter reviews by tag</span>
							<select value={tag} onChange={(event) => setTag(event.target.value)}>
								<option value="">{allTagsLabel}</option>
								{tags.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>
					)}
					{showSort && (
						<label className="rw-select rw-select-end">
							<span className="rw-select-label">Sort reviews by date</span>
							<select
								value={order}
								onChange={(event) => setOrder(event.target.value as "newest" | "oldest")}
							>
								<option value="newest">Newest</option>
								<option value="oldest">Oldest</option>
							</select>
						</label>
					)}
				</div>
			)}

			<div className="review-wall">
				{shown.map((item) => (
					<ReviewCard key={item.by + item.quote.slice(0, 24)} item={item} clampAt={clampAt} />
				))}
			</div>
		</div>
	);
}
