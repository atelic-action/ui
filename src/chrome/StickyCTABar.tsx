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
	 * credit are never under the bar.
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
	// never restarts the measuring below, and a render alone never calls a
	// listener: an inline listener that sets state cannot loop. Whether there
	// is one at all does matter: a listener supplied after mount starts the
	// measuring then. A caller that swaps listeners is heard at the next
	// measure (a resize, the bar changing size, the bar showing or hiding).
	const spaceRef = useRef(onSpaceChange);
	spaceRef.current = onSpaceChange;
	const listening = onSpaceChange !== undefined;

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
	useEffect(() => {
		const bar = barRef.current;
		if (!bar || !listening) return;
		let last = -1;
		// The listener last told a height: the one holding the space, which
		// the cleanup hands back. Never the caller's latest, which after a
		// swap is a listener that was never told anything.
		let heard: ((pixels: number) => void) | undefined;
		const report = () => {
			const next = show ? bar.offsetHeight : 0;
			const listener = spaceRef.current;
			if (next === last && listener === heard) return;
			// A caller swapped listeners since the last report: the old one
			// gives its space back before the new one is told the height.
			if (heard && heard !== listener) heard(0);
			last = next;
			heard = listener;
			heard?.(next);
		};
		report();
		const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(report);
		sizes?.observe(bar);
		window.addEventListener("resize", report);
		return () => {
			sizes?.disconnect();
			window.removeEventListener("resize", report);
			// A final 0 on unmount, on hiding, and when the listener goes, to the
			// listener that holds the space, so no foot padding outlives the bar.
			heard?.(0);
		};
	}, [show, listening]);

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
