import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import { Eyebrow } from "../primitives";
import { ScrollFade } from "../primitives/ScrollFade";
import { StarRow } from "../primitives/StarRow";
import type { ReviewItem } from "./ReviewWall";
import type { Surface } from "./siteConfig";

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
	/**
	 * How many of `items` the card shows, the first ones: 1 to 10, and 10
	 * when left out. Ten is the most a card holds, since each review is one
	 * dot in a row that does not wrap (9.12.0).
	 */
	limit?: number;
	/**
	 * The seconds each review shows before the card moves to the next on its
	 * own; 5 when left out, and `false` or 0 to turn it off. It waits while
	 * the pointer or the keyboard's focus is on the card, while the page is
	 * hidden, and for a reader who asks for less motion it never starts. A
	 * touch on the card, or the pause button, stops it until the reader
	 * starts it again (9.12.0).
	 */
	autoAdvance?: number | false;
	/** The pause button's name while the reviews advance. Defaults to "Pause reviews". */
	pauseLabel?: string;
	/** Its name once paused. Defaults to "Play reviews". */
	playLabel?: string;
	/**
	 * What the link to where a review was written says, for a review that
	 * carries a `sourceURL`, e.g. "View on Google": the reviewer's name is
	 * the link, and these words are its description, heard after the name.
	 * A review with no `sourceURL` gets no link. Defaults to "View review".
	 */
	sourceLabel?: string;
	/**
	 * The lines of quote the card shows (default 6); a longer quote scrolls
	 * inside them, faded at the edge with more beyond it (`ScrollFade`), so
	 * one long review never makes the card tall (9.12.0).
	 */
	quoteLines?: number;
	/**
	 * The accessible name of a quote that scrolls, heard when it takes
	 * focus. Defaults to "Review text" (9.12.0).
	 */
	quoteLabel?: string;
	/**
	 * @deprecated Ignored since 9.12.0: a long quote scrolls inside its box
	 * rather than opening behind Show more. Accepted so a page passing it
	 * still type checks; it goes in the next major.
	 */
	moreLabel?: string;
	/**
	 * @deprecated Ignored since 9.12.0, with `moreLabel`. It goes in the next
	 * major.
	 */
	lessLabel?: string;
	/** Accessible name for the carousel region. */
	ariaLabel?: string;
	id?: string;
	className?: string;
	/** The band's background, so adjacent sections never wear the same one. Defaults to the page surface. */
	surface?: Surface;
}

/** The most reviews one card holds: one dot each, in a row that does not wrap. */
const MOST_REVIEWS = 10;

/**
 * The social-proof split: the aggregate rating on the left (eyebrow, big
 * score, star row and caption, a short provenance paragraph, an optional
 * stat row) and a single large review card on the right, stepped through
 * with dot pagination and round prev/next arrows.
 *
 * Every quote ships in the static HTML (inactive slides are hidden by
 * CSS, never conditionally rendered), so crawlers and answer engines read
 * all of them. The card has one layout and never moves from review to
 * review: the quote at the top, in a box `quoteLines` tall at most that a
 * longer quote scrolls inside (`ScrollFade`), then the divider and the
 * bottom block (the review's stars, the reviewer's name, the detail
 * line), then the dots and arrows. The slides share one grid whose rows
 * each slide's parts sit in (a subgrid), so every row is as tall as the
 * tallest slide's part: the card holds one height, the quote always starts
 * at the top, and the divider, the stars, the name, and the detail sit in
 * the same place for every review, a review with no stars or no detail
 * keeping their room. Stepping opens each quote at its top.
 *
 * Per-review stars are opt-in per item (`rating`), like `ReviewWall`:
 * render them only when the source actually shows them. A review with a
 * `sourceURL` makes the reviewer's name the link to it, so the link takes
 * no line of its own.
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
	items: given,
	limit = MOST_REVIEWS,
	autoAdvance = 5,
	pauseLabel = "Pause reviews",
	playLabel = "Play reviews",
	sourceLabel = "View review",
	quoteLines = 6,
	quoteLabel = "Review text",
	ariaLabel = "Customer reviews",
	id,
	className,
	surface = "default",
}: ReviewCarouselProps) {
	const [rawIndex, setIndex] = useState(0);
	const minted = useId();
	const items = given.slice(0, Math.min(Math.max(Math.floor(limit) || 1, 1), MOST_REVIEWS));
	const count = items.length;
	const index = Math.min(rawIndex, Math.max(count - 1, 0));
	// The profile link's new tab attributes, worked out once for the link and its name.
	const profileTab: ReturnType<typeof newTabProps> = profileURL
		? newTabProps(profileURL, true)
		: {};

	function go(next: number) {
		if (count === 0) return;
		setIndex(((next % count) + count) % count);
	}

	// The card moves on by itself every `autoAdvance` seconds. `stopped` is
	// the reader's own choice (the pause button, or a touch on the card);
	// `held` is the passing kind, while a pointer or the focus is on it.
	const seconds = autoAdvance && autoAdvance > 0 && count > 1 ? autoAdvance : 0;
	const [stopped, setStopped] = useState(false);
	const [held, setHeld] = useState(false);
	// seen is a dependency so a turn skipped on a hidden page is rescheduled on return.
	const [seen, setSeen] = useState(0);
	// index is a dependency so each review, however it was reached, gets its full time.
	// biome-ignore lint/correctness/useExhaustiveDependencies: index restarts the wait on purpose
	useEffect(() => {
		if (!seconds || stopped || held) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		const timer = window.setTimeout(() => {
			if (document.hidden) return;
			setIndex((current) => (Math.min(current, count - 1) + 1) % count);
		}, seconds * 1000);
		return () => window.clearTimeout(timer);
	}, [seconds, stopped, held, count, index, seen]);
	// A hidden page skips its turn above; coming back starts the wait again.
	useEffect(() => {
		if (!seconds) return;
		const onShow = () => setSeen((n) => n + 1);
		document.addEventListener("visibilitychange", onShow);
		return () => document.removeEventListener("visibilitychange", onShow);
	}, [seconds]);

	// Left/right step the carousel whenever focus sits on one of its
	// controls, the keyboard convention for a paged region.
	// A link or button inside a slide keeps its own arrow keys: stepping from it would
	// hide the slide that holds focus.
	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if ((event.target as HTMLElement).closest?.(".rvc-stage a, .rvc-stage button, .rvc-stage [tabindex]")) return;
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
			className={["section", "review-carousel", surface === "alt" && "surface-alt", className]
				.filter(Boolean)
				.join(" ")}
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
										{...profileTab}
										aria-label={
											profileTab.target
												? `${caption}, opens the review profile in a new tab`
												: caption
										}
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
				    wrapper, spelled semantically rather than role="group". */}
				<section
					className="rvc-viewport"
					aria-roledescription="carousel"
					aria-label={ariaLabel}
					onKeyDown={onKeyDown}
					onPointerEnter={(event) => event.pointerType === "mouse" && setHeld(true)}
					onPointerLeave={() => setHeld(false)}
					onFocus={() => setHeld(true)}
					onBlur={(event) => {
						if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
					}}
					onTouchStart={() => setStopped(true)}
				>
					{/* While the card moves by itself it says nothing aloud; a
					    reader who steps it hears the review they stepped to. */}
					<div className="rvc-stage" aria-live={seconds && !stopped && !held ? "off" : "polite"}>
						{items.map((item, i) => {
							const sourceTab = item.sourceURL ? newTabProps(item.sourceURL, true) : {};
							const describedBy = `${minted}-source-${i}`;
							return (
								<figure
									className={["rvc-slide", i === index && "is-active"].filter(Boolean).join(" ")}
									key={item.by + item.quote.slice(0, 24)}
									aria-hidden={i !== index}
									aria-roledescription="slide"
									aria-label={`Review ${i + 1} of ${count}`}
								>
									<blockquote className="rvc-quote">
										{/* Every slide hears the review shown, so each opens at its top. */}
										<ScrollFade lines={quoteLines} ariaLabel={quoteLabel} resetKey={index}>
											“{item.quote}”
										</ScrollFade>
									</blockquote>
									<figcaption className="rvc-who">
										{item.rating != null && (
											<span className="rvc-stars">
												<StarRow rating={item.rating} size={17} />
											</span>
										)}
										{item.sourceURL ? (
											<a
												className="rvc-name is-link"
												href={item.sourceURL}
												{...sourceTab}
												aria-describedby={describedBy}
											>
												{item.by}
												<ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
												<span id={describedBy} hidden>
													{sourceTab.target ? `${sourceLabel}, opens in a new tab` : sourceLabel}
												</span>
											</a>
										) : (
											<span className="rvc-name">{item.by}</span>
										)}
										{item.detail && <span className="rvc-detail">{item.detail}</span>}
									</figcaption>
								</figure>
							);
						})}
					</div>

					{/* With one review, or none, there is nowhere to step, so no
					    dots and no arrows are drawn. */}
					{count > 1 && (
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
								{seconds > 0 && (
									<button
										type="button"
										className="rvc-arrow rvc-pause"
										aria-label={stopped ? playLabel : pauseLabel}
										onClick={() => setStopped((current) => !current)}
									>
										{stopped ? (
											<Play size={15} strokeWidth={2} aria-hidden="true" />
										) : (
											<Pause size={15} strokeWidth={2} aria-hidden="true" />
										)}
									</button>
								)}
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
					)}
				</section>
			</div>
		</section>
	);
}
