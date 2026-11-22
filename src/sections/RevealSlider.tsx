import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent,
	useCallback,
	useRef,
	useState,
} from "react";
import { useWithBase } from "../routing/BasePathProvider";

export interface RevealSlide {
	/** The image. Omit it and pass `placeholder` until the real shot exists. */
	src?: string;
	alt?: string;
	/**
	 * Shot brief rendered as a labeled block when there is no `src` yet, e.g.
	 * "Screenshot: the old home page on a phone". The two sides render in
	 * different tones, so dragging still moves something visible.
	 */
	placeholder?: string;
	/** Corner label, e.g. "Today" or "The rebuild". */
	label: string;
}

export interface RevealSliderProps {
	/** The current-state image, revealed on the left. */
	before: RevealSlide;
	/** The rebuilt-state image, the base layer on the right. */
	after: RevealSlide;
	/** Starting divider position, 0-100. Default 50. */
	startAt?: number;
	/** Frame aspect ratio; both images should match it. Default "16/10". */
	aspectRatio?: string;
	/**
	 * Accessible name for the drag handle. Defaults to a neutral before and
	 * after, because what the two states are is the page's business rather
	 * than the component's. Name them when the page can be specific.
	 */
	ariaLabel?: string;
	/**
	 * What the handle's position means, as a screen reader hears it, given
	 * the whole percent of the frame the before covers. Defaults to each
	 * side's share by its corner label ("40% Today, 60% The rebuild"), so it
	 * names whatever the page named the halves.
	 */
	valueText?: (value: number) => string;
}

/** How far each key moves the divider, in percent of the frame. */
const SLIDER_KEYS: Record<string, (position: number) => number> = {
	ArrowLeft: (p) => p - 3,
	ArrowDown: (p) => p - 3,
	ArrowRight: (p) => p + 3,
	ArrowUp: (p) => p + 3,
	PageDown: (p) => p - 10,
	PageUp: (p) => p + 10,
	Home: () => 0,
	End: () => 100,
};

/** One side of the frame: the photograph, or its shot brief until one exists. */
function Layer({
	slide,
	side,
	style,
}: {
	slide: RevealSlide;
	side: "before" | "after";
	style?: CSSProperties;
}) {
	const withBase = useWithBase();
	const base = ["rslider-layer", side === "before" && "rslider-before"].filter(Boolean).join(" ");
	if (!slide.src) {
		return (
			<div className={`${base} rslider-ph is-${side}`} style={style}>
				<span>{slide.placeholder ?? slide.label}</span>
			</div>
		);
	}
	return (
		<img
			className={`${base} rslider-img`}
			src={withBase(slide.src)}
			alt={slide.alt ?? ""}
			draggable={false}
			style={style}
		/>
	);
}

/**
 * Drag-to-compare before/after slider. The rebuilt image is the base layer;
 * the current image is masked with clip-path so dragging never distorts either
 * one. SSR-safe: prerenders at `startAt`, then hydrates the pointer + keyboard
 * handles. Reusable across any before/after reveal.
 *
 * A side with no `src` renders its shot brief instead, so a case study or a
 * project page can be composed before the photography exists.
 */
export function RevealSlider({
	before,
	after,
	startAt = 50,
	aspectRatio = "16/10",
	ariaLabel = "Drag to compare before and after",
	valueText = (value) => `${value}% ${before.label}, ${100 - value}% ${after.label}`,
}: RevealSliderProps) {
	const [pos, setPos] = useState(startAt);
	const frameRef = useRef<HTMLDivElement>(null);
	const dragging = useRef(false);

	const setFromClientX = useCallback((clientX: number) => {
		const el = frameRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const next = ((clientX - rect.left) / rect.width) * 100;
		setPos(Math.max(0, Math.min(100, next)));
	}, []);

	const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
		dragging.current = true;
		e.currentTarget.setPointerCapture?.(e.pointerId);
		setFromClientX(e.clientX);
	};
	const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
		if (dragging.current) setFromClientX(e.clientX);
	};
	const endDrag = () => {
		dragging.current = false;
	};
	// The platform's slider keys: the arrows step, Page Up and Page Down
	// take a larger step, and Home and End go to the ends. Up and Right
	// grow the before, Down and Left shrink it.
	const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		const step = SLIDER_KEYS[e.key];
		if (!step) return;
		e.preventDefault();
		setPos((p) => Math.max(0, Math.min(100, step(p))));
	};

	return (
		<div
			className="rslider"
			style={{ aspectRatio }}
			ref={frameRef}
			onPointerMove={onPointerMove}
			onPointerUp={endDrag}
			onPointerLeave={endDrag}
			onPointerCancel={endDrag}
		>
			<Layer slide={after} side="after" />
			<Layer slide={before} side="before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
			<span className="rslider-label rslider-label-before">{before.label}</span>
			<span className="rslider-label rslider-label-after">{after.label}</span>
			<div className="rslider-line" style={{ left: `${pos}%` }} aria-hidden />
			<button
				type="button"
				className="rslider-handle"
				style={{ left: `${pos}%` }}
				role="slider"
				aria-label={ariaLabel}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(pos)}
				aria-valuetext={valueText(Math.round(pos))}
				onPointerDown={onPointerDown}
				onKeyDown={onKeyDown}
			>
				<span className="rslider-grip">
					<ChevronLeft size={16} aria-hidden />
					<ChevronRight size={16} aria-hidden />
				</span>
			</button>
		</div>
	);
}
