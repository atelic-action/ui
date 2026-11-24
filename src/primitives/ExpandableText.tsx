import {
	type CSSProperties,
	type ReactNode,
	type RefObject,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

/** A layout effect in a browser, so a measure lands before paint; an effect where nothing paints (prerender). */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ExpandableTextProps {
	/** The text: prose only, since all of it stays in the page while clamped. */
	children: ReactNode;
	/** The lines shown while closed. Defaults to 3. */
	lines?: number;
	/**
	 * What shows only once opened, under the text: links, say, the terms and
	 * the privacy policy a consent line points to. It stays in the page while
	 * closed, hidden and `inert`, so its links leave the tab order.
	 */
	more?: ReactNode;
	/** The control's words while closed. */
	moreLabel?: string;
	/** The control's words while open. */
	lessLabel?: string;
	/**
	 * Draws the text as the label of this control's id, so a checkbox's name
	 * is the whole text, clamped or not: a consent line.
	 */
	labelFor?: string;
	/** Open on first render. */
	defaultExpanded?: boolean;
	/**
	 * Sets the control at the end of the last line rather than under the
	 * text (8.5.0): closed, over the line's end on a fade of
	 * `--expandable-ground` (the page surface unless set), after an
	 * ellipsis; open, straight after the last word. It stays a sibling of
	 * the text, so a checkbox the text labels never hears its words.
	 */
	inline?: boolean;
	className?: string;
}

/**
 * Long text cut to a few lines, with a Show more control under it that
 * opens the rest and a Show less that closes it again. The control carries
 * `aria-expanded` and names the text it controls.
 *
 * The cut is drawn, never made: the whole text stays in the page, so a
 * screen reader reads all of it, a search finds it, and a checkbox it
 * labels (`labelFor`) is named by every word. That is why the text is prose
 * only; anything a reader acts on goes in `more`, which is hidden and
 * `inert` while closed. When the text fits in its lines and there is no
 * `more`, the control is not drawn (measured once the page is up, so a
 * prerendered page shows it until then).
 */
export function ExpandableText({
	children,
	lines = 3,
	more,
	moreLabel = "Show more",
	lessLabel = "Show less",
	labelFor,
	defaultExpanded = false,
	inline = false,
	className,
}: ExpandableTextProps) {
	const minted = useId();
	const bodyId = `${minted}-text`;
	const moreId = `${minted}-more`;
	const bodyRef = useRef<HTMLElement>(null);
	const [open, setOpen] = useState(defaultExpanded);
	// Whether the text runs past its lines; unknown until measured.
	const [overflows, setOverflows] = useState<boolean | null>(null);

	useMeasureEffect(() => {
		const body = bodyRef.current;
		if (!body || open) return;
		const measure = () => setOverflows(body.scrollHeight > body.clientHeight + 1);
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(measure);
		observer.observe(body);
		return () => observer.disconnect();
	}, [open]);

	const hasMore = more != null && more !== false;
	// Inline text that fits has nothing hidden, so what `more` holds shows
	// and no control is drawn; inline text not yet measured has its control
	// placed but unseen, so measuring never moves the page (8.6.0).
	const fitsInline = inline && !open && overflows === false;
	const unmeasuredInline = inline && !open && overflows === null;
	const moreShown = open || (fitsInline && hasMore);
	const showControl = inline ? !fitsInline : hasMore || open || overflows !== false;
	const style = { "--expandable-lines": lines } as CSSProperties;
	// is-clamped is the clamp the measuring needs, which cuts nothing when the
	// text fits; is-cut says it was measured cutting, and only then is an
	// inline control seen over the line's end (8.6.0). Before measuring (a
	// prerendered page) the inline control already sits there, out of the
	// flow and unseen, so nothing moves when it shows.
	const bodyClass = [
		"expandable-text-body",
		!open && "is-clamped",
		!open && overflows === true && "is-cut",
	]
		.filter(Boolean)
		.join(" ");

	const control = showControl && (
		<button
			type="button"
			className="expandable-text-toggle"
			aria-expanded={open}
			aria-controls={hasMore ? `${bodyId} ${moreId}` : bodyId}
			// Unseen until measured: out of the accessibility tree and the tab order.
			aria-hidden={unmeasuredInline || undefined}
			tabIndex={unmeasuredInline ? -1 : undefined}
			onClick={() => setOpen((was) => !was)}
		>
			<span className="expandable-text-toggle-label">{open ? lessLabel : moreLabel}</span>
		</button>
	);

	return (
		<div
			className={["expandable-text", inline && "is-inline", className].filter(Boolean).join(" ")}
		>
			{labelFor ? (
				<label
					ref={bodyRef as RefObject<HTMLLabelElement>}
					id={bodyId}
					htmlFor={labelFor}
					className={bodyClass}
					style={style}
				>
					{children}
				</label>
			) : (
				<div
					ref={bodyRef as RefObject<HTMLDivElement>}
					id={bodyId}
					className={bodyClass}
					style={style}
				>
					{children}
				</div>
			)}
			{inline && control}
			{hasMore && (
				<div id={moreId} className="expandable-text-more" hidden={!moreShown} inert={!moreShown}>
					{more}
				</div>
			)}
			{!inline && control}
		</div>
	);
}
