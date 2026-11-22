import { Phone as PhoneIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { CallToAction, Phone } from "../types";

export interface StickyCTABarProps {
	/** The primary action, filling the bar. */
	primaryCTA: CallToAction;
	/** Adds a call shortcut beside the CTA. Omit for a business with no public phone. */
	phone?: Phone;
	/** Scroll depth in pixels before the bar slides in. Defaults to 520. */
	threshold?: number;
	/**
	 * Show the bar from the first paint, with no scroll. For a page whose
	 * first screen carries no booking button of its own (every page but the
	 * hero home page), so a lead action is one tap away before anyone scrolls.
	 * The home page keeps the slide in, since its hero already holds the button
	 * and a bar from the top would put two of them on one screen.
	 */
	fromTop?: boolean;
	/** The call shortcut's accessible name. Defaults to "Call us". */
	callLabel?: string;
	/**
	 * Hears the room the bar takes at the foot of the screen, in pixels: its
	 * measured height while it shows, and 0 while it is hidden (scrolled
	 * above its threshold, or on a desktop, where the stylesheet hides it).
	 * `SiteShell` pads the page's closing bar by it, so the copyright and the
	 * credit are never under the bar. A listener swapped in is told the
	 * current height at once and the one it replaced gets 0; no listener
	 * hears one value twice. A listener made anew each render that sets state
	 * should store a plain number (or be memoized): each new function hears
	 * the height once, and a state equal to it stops the renders. One that
	 * stores an object is cut off after three arrivals with nothing measured
	 * between: the listener leaving still hears 0, and the one arriving
	 * waits for the next measure.
	 */
	onSpaceChange?: (pixels: number) => void;
}

/** The phone only bottom bar: the primary CTA and a call shortcut, sliding in once scrolled, or there from the top. */
export function StickyCTABar({
	primaryCTA,
	phone,
	threshold = 520,
	fromTop = false,
	callLabel = "Call us",
	onSpaceChange,
}: StickyCTABarProps) {
	const [show, setShow] = useState(fromTop);
	const barRef = useRef<HTMLDivElement>(null);
	// The latest listener, so a caller passing a new function each render
	// never restarts the measuring below. Whether there is one at all does: a
	// listener supplied after mount starts the measuring then.
	const spaceRef = useRef(onSpaceChange);
	spaceRef.current = onSpaceChange;
	const listening = onSpaceChange !== undefined;
	// The height last measured (-1 before any, and after the bar goes), and
	// what each listener was last told: no listener hears one value twice.
	const heightRef = useRef(-1);
	const toldRef = useRef(new WeakMap<(pixels: number) => void, number>());
	const tell = (listener: ((pixels: number) => void) | undefined, pixels: number) => {
		if (!listener || toldRef.current.get(listener) === pixels) return;
		toldRef.current.set(listener, pixels);
		listener(pixels);
	};

	useEffect(() => {
		if (fromTop) {
			setShow(true);
			return;
		}
		const onScroll = () => setShow(window.scrollY > threshold);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [threshold, fromTop]);

	// The bar's real height while it shows, measured again whenever it changes
	// size (a phone turned, a font loading, a label wrapping), never assumed.
	// Hidden by the stylesheet its height reads 0, so a desktop reserves nothing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: tell reads only refs
	useEffect(() => {
		const bar = barRef.current;
		if (!bar || !listening) return;
		const report = () => {
			heightRef.current = show ? bar.offsetHeight : 0;
			arrivalsRef.current = 0;
			tell(spaceRef.current, heightRef.current);
		};
		report();
		const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(report);
		sizes?.observe(bar);
		window.addEventListener("resize", report);
		return () => {
			sizes?.disconnect();
			window.removeEventListener("resize", report);
			// A final 0 on unmount, on hiding, and when the listener goes, so no
			// foot padding outlives the bar.
			heightRef.current = -1;
			tell(spaceRef.current, 0);
		};
	}, [show, listening]);

	// A listener swapped in is told the current height, and the one it
	// replaced gets 0, unless either already heard that value. A function made
	// anew each render (an inline listener) hears the height once a function
	// until the caller's state settles; a stable listener hears nothing here.
	const previousRef = useRef(onSpaceChange);
	// Arrivals told since the bar last measured. A listener that sets object
	// state is a new function on every render its own call causes, which no
	// test of identity tells from a real swap; past three arrivals in a row
	// with nothing measured between, the rest wait for the next measure, so
	// such a listener cannot loop. Three real swaps in a row are all told.
	const arrivalsRef = useRef(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: the listener is the trigger; tell reads only refs
	useEffect(() => {
		const previous = previousRef.current;
		previousRef.current = onSpaceChange;
		if (previous === onSpaceChange) return;
		if (onSpaceChange && arrivalsRef.current >= 3) {
			// Past the cap the outgoing one still gives back any space it holds;
			// only the arrival waits. Only a listener told a height is told 0, so
			// a looping listener hears it once: the function its 0 makes was
			// never told anything, and the next swap tells no one.
			if (previous && (toldRef.current.get(previous) ?? 0) > 0) tell(previous, 0);
			return;
		}
		arrivalsRef.current += 1;
		// The outgoing one gives its space back, the bar measured or not (a
		// listener taken away leaves the measuring off by now).
		tell(previous, 0);
		if (heightRef.current >= 0) tell(onSpaceChange, heightRef.current);
	}, [onSpaceChange]);

	return (
		// Inert while offscreen, so its links take no keyboard focus before it slides in.
		// data-dock-lift and data-showing tell the contact dock to ride above it.
		<div
			ref={barRef}
			className={show ? "sticky-cta show" : "sticky-cta"}
			inert={!show}
			data-dock-lift=""
			data-showing={show ? "true" : "false"}
		>
			<a
				className="btn btn-primary"
				href={primaryCTA.href}
				{...newTabProps(primaryCTA.href, primaryCTA.external)}
			>
				{primaryCTA.label}
			</a>
			{phone && (
				<a className="btn btn-ghost btn-call" href={`tel:${phone.e164}`} aria-label={callLabel}>
					<PhoneIcon size={18} aria-hidden="true" />
				</a>
			)}
		</div>
	);
}
