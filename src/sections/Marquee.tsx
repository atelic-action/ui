import { Pause, Play } from "lucide-react";
import {
	Children,
	type CSSProperties,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { MARQUEE_SPEED, marqueeCopies, marqueeDuration } from "../lib/marquee";

export interface MarqueeProps {
	/**
	 * What scrolls: anything, each child one item of the row (a chip, a
	 * logo, a `ProofFact`, a short line, a link). The row is drawn more than
	 * once for the loop, so a child should carry no `id`.
	 */
	children: ReactNode;
	/** The pace in pixels a second (default 60), never a duration, so a long row moves as fast as a short one. */
	speed?: number;
	/** Holds the row still while a pointer rests on it or focus is inside it. Defaults to true. */
	pauseOnHover?: boolean;
	/** A hairline between items. Defaults to true. */
	dividers?: boolean;
	/** What a screen reader calls the band. Defaults to "Highlights". */
	ariaLabel?: string;
	/**
	 * What a screen reader calls the control that stops and restarts the
	 * row; defaults to "Pause". It is a toggle, pressed while the row is
	 * still, so one name serves both ways.
	 */
	pauseLabel?: string;
	/** Says the band is a dark ground, so headings and controls inside keep its words. */
	ground?: "dark";
	id?: string;
	className?: string;
}

/**
 * One row of anything that scrolls without end, at a pace. The row is
 * repeated until the loop shows no gap, measured in an effect, and every
 * copy after the first is hidden from assistive technology and kept out of
 * the tab order, so each item is read once and focused once. A quiet toggle at the band's edge
 * stops the row (WCAG 2.2.2). Under `prefers-reduced-motion` nothing moves:
 * the copies are not drawn, the toggle goes, and the row can be scrolled
 * sideways, taking focus when it is wider than the band so a keyboard can.
 * The server draws two copies at a default length, which the first measure
 * corrects.
 */
export function Marquee({
	children,
	speed = MARQUEE_SPEED,
	pauseOnHover = true,
	dividers = true,
	ariaLabel = "Highlights",
	pauseLabel = "Pause",
	ground,
	id,
	className,
}: MarqueeProps) {
	const [paused, setPaused] = useState(false);
	const [still, setStill] = useState(false);
	const [row, setRow] = useState({ width: 0, copies: 2, overflows: false });
	const bandRef = useRef<HTMLDivElement>(null);
	const rowRef = useRef<HTMLUListElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
		if (!query) return;
		const sync = () => setStill(query.matches);
		sync();
		query.addEventListener?.("change", sync);
		return () => query.removeEventListener?.("change", sync);
	}, []);

	const measure = useCallback(() => {
		const band = bandRef.current;
		const first = rowRef.current;
		if (!band || !first) return;
		const width = first.getBoundingClientRect().width;
		const next = {
			width,
			copies: marqueeCopies(width, band.clientWidth),
			overflows: band.scrollWidth > band.clientWidth + 1,
		};
		setRow((current) =>
			current.width === next.width &&
			current.copies === next.copies &&
			current.overflows === next.overflows
				? current
				: next,
		);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: still changes the row's layout, so the row is measured again when it changes
	useEffect(() => {
		measure();
		const band = bandRef.current;
		const first = rowRef.current;
		if (!band || !first || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(measure);
		observer.observe(band);
		observer.observe(first);
		return () => observer.disconnect();
	}, [measure, still]);

	const seconds = marqueeDuration(row.width, speed);
	const measured = seconds > 0;

	// The copies are one track: each is held to the first one's place in the
	// loop, so a copy drawn later (a wider band, a resize) joins in step, and
	// a copy after the first keeps focus out of its links without blocking
	// the pointer, which `inert` would (it is used only before the measure,
	// when the server's copy has nothing else to keep it out).
	// biome-ignore lint/correctness/useExhaustiveDependencies: the copies and the pace are what change the row
	useLayoutEffect(() => {
		const track = trackRef.current;
		if (!track || !measured) return;
		const groups = [...track.querySelectorAll<HTMLElement>(":scope > .marquee-group")];
		const lead = groups[0]?.getAnimations?.()[0];
		for (const group of groups.slice(1)) {
			for (const target of group.querySelectorAll<HTMLElement>(
				"a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]",
			)) {
				target.setAttribute("tabindex", "-1");
			}
			const animation = group.getAnimations?.()[0];
			if (lead && animation && lead.currentTime !== null) animation.currentTime = lead.currentTime;
		}
	}, [row.copies, measured, seconds, children]);
	const trackStyle = measured
		? ({ "--_marquee-duration": `${seconds.toFixed(2)}s` } as CSSProperties)
		: undefined;
	const items = Children.toArray(children);
	const copy = (place: number) => (
		<ul
			key={place}
			ref={place === 0 ? rowRef : undefined}
			className="marquee-group"
			aria-hidden={place > 0 || undefined}
			inert={place > 0 && !measured}
		>
			{items.map((item, at) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: the row is fixed content in a fixed order, drawn again for each copy
				<li className="marquee-item" key={at}>
					{item}
				</li>
			))}
		</ul>
	);

	return (
		<section
			className={["marquee-band", dividers && "has-dividers", className].filter(Boolean).join(" ")}
			data-ground={ground}
			aria-label={ariaLabel}
			id={id}
		>
			{/* Focusable only when it stands still and is wider than the band, so a keyboard can scroll it. */}
			<div
				ref={bandRef}
				className={["marquee", pauseOnHover && "pause-on-hover"].filter(Boolean).join(" ")}
				data-paused={paused || undefined}
				tabIndex={still && row.overflows ? 0 : undefined}
			>
				<div
					ref={trackRef}
					className="marquee-track"
					data-measured={measured || undefined}
					style={trackStyle}
				>
					{Array.from({ length: row.copies }, (_, place) => copy(place))}
				</div>
			</div>
			<button
				type="button"
				className="marquee-pause"
				aria-label={pauseLabel}
				aria-pressed={paused}
				onClick={() => setPaused((current) => !current)}
			>
				{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
			</button>
		</section>
	);
}
