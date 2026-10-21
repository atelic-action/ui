import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import { Eyebrow } from "../primitives";
import { StarRow } from "../primitives/StarRow";
import type { ReviewItem } from "./ReviewWall";

export type { ReviewItem };

export interface ReviewStat {
	value: string;
	label: string;
}

export interface ReviewCarouselProps {
	eyebrow?: string;
	/** The aggregate figure as a string, so "5.0" keeps its zero. */
	score: string;
	/** The denominator beside the score; pass an empty string to drop it. */
	outOf?: string;
	/** Aggregate star row, 1 to 5. Omit when the source shows no stars. */
	rating?: number;
	/** Caption beside the stars, e.g. "from 100 verified Google reviews". */
	caption?: string;
	/**
	 * Permalink to the business's live review profile; turns the caption
	 * into a link out to it, the same idiom `ReviewWall` uses for a review's
	 * dated source link. Without a `caption` there is nothing to link, so
	 * the prop is inert. Prefer a count the profile can't outgrow ("100+"),
	 * since the live number climbs and the caption doesn't.
	 */
	profileURL?: string;
	/** Short paragraph under the caption: where the reviews come from. */
	lead?: ReactNode;
	/** Optional value/label row (three reads well). Omit to hide entirely. */
	stats?: ReviewStat[];
	/** The reviews, shown one at a time. */
	items: ReviewItem[];
	/** Accessible name for the carousel region. */
	ariaLabel?: string;
	id?: string;
	className?: string;
}

/**
 * Real reviews run from a sentence to a paragraph, and every slide shares
 * one card, so the quote's type size steps down as it gets longer: short
 * quotes stay big and quotable, long ones stay inside a card the page can
 * hold. Length, not layout, decides — the same quote always sets the same
 * way, on the server and in the browser.
 */
function quoteSize(quote: string): string {
	if (quote.length > 420) return "is-compact";
	if (quote.length > 260) return "is-medium";
	return "";
}

/**
 * The social-proof split: the aggregate rating on the left (eyebrow, big
 * score, star row and caption, a short provenance paragraph, an optional
 * stat row) and a single large review card on the right, stepped through
 * with dot pagination and round prev/next arrows.
 *
 * Every quote ships in the static HTML — inactive slides are hidden by
 * CSS, never conditionally rendered — so crawlers and answer engines read
 * all of them. Slides stack in one grid cell, so the card is as tall as
 * the longest quote and stepping never shifts the page.
 *
 * Per-review stars are opt-in per item (`rating`), like `ReviewWall`:
 * render them only when the source actually shows them.
 *
 * `profileURL` turns the caption into a link out to the live review
 * profile, carrying the wall's dated-source idiom (quiet text, trailing
 * arrow, new tab) so a visitor can check the aggregate at the source.
 */
export function ReviewCarousel({
	eyebrow,
	score,
	outOf = "5",
	rating,
	caption,
	profileURL,
	lead,
	stats,
	items,
	ariaLabel = "Customer reviews",
	id,
	className,
}: ReviewCarouselProps) {
	const [rawIndex, setIndex] = useState(0);
	const count = items.length;
	const index = Math.min(rawIndex, Math.max(count - 1, 0));

	function go(next: number) {
		if (count === 0) return;
		setIndex(((next % count) + count) % count);
	}

	// Left/right step the carousel whenever focus sits on one of its
	// controls, the keyboard convention for a paged region.
	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			go(index - 1);
		} else if (event.key === "ArrowRight") {
			event.preventDefault();
			go(index + 1);
		}
	}

	return (
		<section
			className={["section", "review-carousel", className].filter(Boolean).join(" ")}
			id={id}
		>
			<div className="wrap rvc-grid">
				<div className="rvc-aggregate">
					{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
					<p className="rvc-score">
						<span className="rvc-score-num">{score}</span>
						{outOf && <span className="rvc-score-out">/ {outOf}</span>}
					</p>
					{(rating != null || caption) && (
						<p className="rvc-rating">
							{rating != null && <StarRow rating={rating} size={19} />}
							{caption &&
								(profileURL ? (
									<a
										className="rvc-caption"
										href={profileURL}
										target="_blank"
										rel="noopener"
										aria-label={`${caption}, opens the review profile in a new tab`}
									>
										{caption}
										<ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
									</a>
								) : (
									<span className="rvc-caption">{caption}</span>
								))}
						</p>
					)}
					{lead && <p className="rvc-lead">{lead}</p>}
					{stats && stats.length > 0 && (
						<dl className="rvc-stats">
							{stats.map((stat) => (
								<div className="rvc-stat" key={stat.label}>
									<dt className="rvc-stat-value">{stat.value}</dt>
									<dd className="rvc-stat-label">{stat.label}</dd>
								</div>
							))}
						</dl>
					)}
				</div>

				{/* A named <section> is an ARIA region, the carousel pattern's
				    wrapper — spelled semantically rather than role="group". */}
				<section
					className="rvc-viewport"
					aria-roledescription="carousel"
					aria-label={ariaLabel}
					onKeyDown={onKeyDown}
				>
					<div className="rvc-stage" aria-live="polite">
						{items.map((item, i) => (
							<figure
								className={["rvc-slide", i === index && "is-active"].filter(Boolean).join(" ")}
								key={item.by + item.quote.slice(0, 24)}
								aria-hidden={i !== index}
								aria-roledescription="slide"
								aria-label={`Review ${i + 1} of ${count}`}
							>
								{item.rating != null && <StarRow rating={item.rating} size={17} />}
								<blockquote
									className={["rvc-quote", quoteSize(item.quote)].filter(Boolean).join(" ")}
								>
									“{item.quote}”
								</blockquote>
								<figcaption className="rvc-who">
									<span className="rvc-name">{item.by}</span>
									{item.detail && <span className="rvc-detail">{item.detail}</span>}
								</figcaption>
							</figure>
						))}
					</div>

					<div className="rvc-controls">
						<div className="rvc-dots">
							{items.map((_, i) => (
								<button
									type="button"
									className={["rvc-dot", i === index && "is-active"].filter(Boolean).join(" ")}
									// biome-ignore lint/suspicious/noArrayIndexKey: a dot is a position, not an identity; review text can repeat
									key={`dot-${i}`}
									aria-label={`Go to review ${i + 1}`}
									aria-current={i === index}
									onClick={() => setIndex(i)}
								/>
							))}
						</div>
						<div className="rvc-arrows">
							<button
								type="button"
								className="rvc-arrow"
								aria-label="Previous review"
								onClick={() => go(index - 1)}
							>
								<ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
							</button>
							<button
								type="button"
								className="rvc-arrow"
								aria-label="Next review"
								onClick={() => go(index + 1)}
							>
								<ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
							</button>
						</div>
					</div>
				</section>
			</div>
		</section>
	);
}
