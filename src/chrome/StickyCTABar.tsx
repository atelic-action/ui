import { Phone as PhoneIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import { PhoneLink, phoneHref } from "../primitives/PhoneLink";
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
	 * Hears the room the bar reserves at the foot of the page, in pixels: its
	 * measured height wherever it can show, from the first measure, whether
	 * or not it has slid in yet, and 0 on a desktop, where the stylesheet
	 * hides it. `SiteShell` pads the page's closing bar by it, so the
	 * copyright and the credit are never under the bar, even on a page whose
	 * bar slides in only once scrolled and a jump straight to its end: the
	 * page is already as long as it will be when the bar shows, so its
	 * arrival moves nothing under the reader. The bar remembers the one value
	 * it last told and tells a value only when it differs, to whichever
	 * listener is current: a caller swapping listeners (an inline function,
	 * made anew each render, storing a number or an object) is one caller, so
	 * a swap tells nothing, the new listener hears the next change, and
	 * nothing can loop. A listener taken away, and the last one when the bar
	 * goes, is told 0, so no foot padding outlives the bar (9.7.0).
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
	// The listener in place, so a caller passing a new function each render
	// never restarts the measuring below. Whether there is one at all does: a
	// listener supplied after mount starts the measuring then. It is set in
	// an effect, never during render, so the measuring's cleanup still reaches
	// the listener that is leaving and hands it back its space.
	const spaceRef = useRef(onSpaceChange);
	useEffect(() => {
		spaceRef.current = onSpaceChange;
	});
	const listening = onSpaceChange !== undefined;
	// The one value last told, whichever listener heard it: no value is told
	// twice in a row, so a listener that sets state, even object state, on
	// every call settles after one.
	const toldRef = useRef<number | null>(null);
	const tell = (pixels: number) => {
		const listener = spaceRef.current;
		if (!listener || toldRef.current === pixels) return;
		toldRef.current = pixels;
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

	// The bar's real height, measured again whenever it changes size (a phone
	// turned, a font loading, a label wrapping), never assumed. It is reported
	// while the bar waits below the screen too (its slide is a transform, which
	// leaves its height as it is), so the space at the page's end is reserved
	// from the start and never grows as the bar slides in, where a jump to the
	// end would stop short of it. Hidden by the stylesheet its height reads 0,
	// so a desktop reserves nothing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: tell reads only refs
	useEffect(() => {
		const bar = barRef.current;
		if (!bar || !listening) return;
		const report = () => tell(bar.offsetHeight);
		report();
		const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(report);
		sizes?.observe(bar);
		window.addEventListener("resize", report);
		return () => {
			sizes?.disconnect();
			window.removeEventListener("resize", report);
			// A final 0 on unmount and when the listener goes, so no foot padding
			// outlives the bar; a listener supplied again hears the next measure.
			tell(0);
			toldRef.current = null;
		};
	}, [listening]);

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
			{/* No number to dial, no call button: never a nameless empty one (8.6.0). */}
			{phone && phoneHref(phone) && (
				<PhoneLink className="btn btn-ghost btn-call" phone={phone} aria-label={callLabel}>
					<PhoneIcon size={18} aria-hidden="true" />
				</PhoneLink>
			)}
		</div>
	);
}
