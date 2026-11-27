import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

/** A layout effect in a browser, so a measure lands before paint; an effect where nothing paints (prerender). */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ScrollFadeProps {
	/** What the box holds. It scrolls inside the box when it is taller. */
	children: ReactNode;
	/**
	 * The most the box shows, in lines of its own text, before what is left
	 * scrolls (default 6). `maxHeight` wins when both are given.
	 */
	lines?: number;
	/** The most the box shows as a CSS length (`12rem`, `40vh`), in place of `lines`. */
	maxHeight?: string;
	/**
	 * The scrolling box's accessible name, heard when it takes focus, which
	 * it does only while there is more to scroll to. Defaults to
	 * "Scrolling text".
	 */
	ariaLabel?: string;
	/**
	 * Any value; when it changes, the box scrolls back to its top. A
	 * carousel passes the review it shows, so each one opens at its start.
	 */
	resetKey?: unknown;
	className?: string;
}

/** Which edges have more beyond them. */
interface Edges {
	above: boolean;
	below: boolean;
}

const NONE: Edges = { above: false, below: false };

/**
 * A box of fixed greatest height whose content scrolls inside it when it is
 * taller, with no scrollbar drawn and a fade at each edge that has more
 * beyond it: at the bottom while there is more below, at the top once there
 * is more above, at neither when everything fits.
 *
 * The fade is a mask on the scrolling box, so it works over any ground. The
 * edges are measured once the page is up (a scroll listener and a resize
 * observer on the box and its content), so a prerendered box shows every
 * word it fits with no fade at all, and one that overflows already scrolls
 * by touch, wheel, and trackpad before the script runs. While there is more
 * to scroll to, the box is a named region and a tab stop, so a keyboard can
 * reach it and scroll it with the arrow keys; while everything fits, it is
 * neither.
 */
export function ScrollFade({
	children,
	lines = 6,
	maxHeight,
	ariaLabel = "Scrolling text",
	resetKey,
	className,
}: ScrollFadeProps) {
	const boxRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [edges, setEdges] = useState<Edges>(NONE);

	useMeasureEffect(() => {
		const box = boxRef.current;
		if (!box) return;
		const measure = () => {
			// A pixel of slack either way, so a fractional height never reads as more.
			const above = box.scrollTop > 1;
			const below = box.scrollTop + box.clientHeight < box.scrollHeight - 1;
			setEdges((was) => (was.above === above && was.below === below ? was : { above, below }));
		};
		measure();
		box.addEventListener("scroll", measure, { passive: true });
		let observer: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			observer = new ResizeObserver(measure);
			observer.observe(box);
			if (contentRef.current) observer.observe(contentRef.current);
		}
		return () => {
			box.removeEventListener("scroll", measure);
			observer?.disconnect();
		};
	}, []);

	// A new resetKey opens the box at its top again; the scroll event that
	// follows measures the edges anew.
	const firstKey = useRef(true);
	useMeasureEffect(() => {
		if (firstKey.current) {
			firstKey.current = false;
			return;
		}
		const box = boxRef.current;
		if (box) box.scrollTop = 0;
	}, [resetKey]);

	const scrolls = edges.above || edges.below;
	const style = maxHeight
		? ({ "--_sf-max": maxHeight } as CSSProperties)
		: ({ "--_sf-lines": lines } as CSSProperties);

	return (
		<div className={["scroll-fade", className].filter(Boolean).join(" ")}>
			{/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: the name is given only with the region role, both set while the box scrolls */}
			<div
				ref={boxRef}
				className="scroll-fade-box"
				style={style}
				data-fade-top={edges.above || undefined}
				data-fade-bottom={edges.below || undefined}
				role={scrolls ? "region" : undefined}
				aria-label={scrolls ? ariaLabel : undefined}
				tabIndex={scrolls ? 0 : undefined}
			>
				<div ref={contentRef} className="scroll-fade-content">
					{children}
				</div>
			</div>
		</div>
	);
}
