import { ChevronRight, MessageCircle, X } from "lucide-react";
import { type RefObject, useEffect, useId, useRef, useState } from "react";
import { useDismiss } from "../hooks/useDismiss";
import { newTabProps } from "../lib/newTabProps";
import { holdPhoneNumbers, isTel } from "../lib/phoneText";
import type { ContactDockConfig } from "../types";
import { dockIcons } from "./icons";

export interface ContactDockProps extends ContactDockConfig {
	/**
	 * The element the dock never covers: as it scrolls into view the dock
	 * rides up to sit just above its top edge. A ref to it, or a selector;
	 * defaults to the page's `footer`, and `null` avoids nothing.
	 */
	avoid?: string | RefObject<Element | null> | null;
	/**
	 * A selector for the bar the dock lifts over while that bar shows. The
	 * bar says it is showing with `data-showing="true"`, or, for a bar that
	 * sets no `data-showing`, with the `show` class the sticky bar wore before
	 * 8.0.0. `StickyCTABar` wears `data-dock-lift` and keeps `data-showing`
	 * current; the default finds it, or failing that a site's own
	 * `.sticky-cta`. `null` lifts over nothing.
	 */
	lift?: string | null;
	/**
	 * Whether the dock tracks the page: it lifts over the phone's sticky bar
	 * once that bar shows, and rises above the footer. Off holds it at its
	 * corner inset (a preview frame). Defaults on.
	 */
	track?: boolean;
	/** The launcher's words while the panel is open. Defaults to "Close". */
	closeLabel?: string;
	/**
	 * The accessible name of the close button in the panel's head, kept apart
	 * from the launcher's so the two controls never share a name. Defaults to
	 * "Close panel".
	 */
	panelCloseLabel?: string;
	/** Start with the panel open (a preview of the open state). */
	defaultOpen?: boolean;
}

/** The default lift: the package's own bar, or a site's bar of the old class. */
const DEFAULT_LIFT = "[data-dock-lift], .sticky-cta";

/**
 * Whether the bar the dock lifts over is showing: its `data-showing` when it
 * keeps one, else the `show` class, and never while the stylesheet hides it
 * (a desktop). Exported for the tests; a site never calls it.
 */
export function barShowing(bar: HTMLElement | null): boolean {
	if (!bar) return false;
	const flag = bar.dataset.showing;
	const shown = flag === undefined ? bar.classList.contains("show") : flag === "true";
	return shown && getComputedStyle(bar).display !== "none";
}

/** Where the phone layout starts, the sticky bar's own breakpoint. */
const PHONE_MAX = 899;

/** The launcher's height, matching `.cd-launch`. */
const LAUNCHER_HEIGHT = 52;

/**
 * The corner the dock sits in: the same inset from the right and the bottom
 * edge (16 on a phone, 24 above), lifted over the phone's sticky bar once
 * that bar is showing, and never over the footer: as the footer's top edge
 * comes up the viewport, the dock rides up to stay just above it. Exported
 * for the tests; a site never calls it.
 */
export function dockPlacement({
	viewportWidth,
	viewportHeight,
	barHeight,
	avoidTop,
}: {
	viewportWidth: number;
	viewportHeight: number;
	/** The sticky bar's height when it is showing, else 0. */
	barHeight: number;
	/** The avoided element's top edge in the viewport, or null when there is none. */
	avoidTop: number | null;
}): { inset: number; bottom: number } {
	const phone = viewportWidth <= PHONE_MAX;
	const inset = phone ? 16 : 24;
	const overBar = phone && barHeight > 0 ? barHeight + inset : inset;
	const covered = avoidTop === null ? 0 : Math.max(0, viewportHeight - avoidTop);
	const overFooter = covered > 0 ? covered + inset : 0;
	// Never past the top of the screen: a footer taller than the viewport
	// leaves the launcher at the top edge, still reachable.
	const ceiling = Math.max(inset, viewportHeight - LAUNCHER_HEIGHT - inset);
	return { inset, bottom: Math.round(Math.min(ceiling, Math.max(overBar, overFooter))) };
}

/**
 * A floating launcher in the page's corner that opens a small panel of the
 * ways to reach the business: a chat, a call, a form, each an item passed as
 * data. The open state lives in React state; every measurement runs in an
 * effect, so it prerenders closed and at its default inset. The panel stays
 * in the HTML while closed, `inert`. Escape and a click outside close it.
 * On a phone the launcher is its icon alone and the panel is a sheet across
 * the bottom of the screen.
 */
export function ContactDock({
	label,
	title,
	subtitle,
	items,
	footnote,
	avoid = "footer",
	lift = DEFAULT_LIFT,
	track = true,
	closeLabel = "Close",
	panelCloseLabel = "Close panel",
	defaultOpen = false,
}: ContactDockProps) {
	const [open, setOpen] = useState(defaultOpen);
	// Unmeasured, the dock sits at the corner chrome.css gives it for the
	// viewport; tracking sets its place inline once it has measured.
	const [place, setPlace] = useState<{ inset: number; bottom: number } | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const launchRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLElement>(null);
	const opened = useRef(defaultOpen);
	const panelId = useId();
	const headingId = `${panelId}h`;

	useEffect(() => {
		if (!track) {
			setPlace(null);
			return;
		}
		let frame = 0;
		let bound = 0;
		// The bar and the avoided element are found once and again only when
		// the page's elements change, never on a scroll frame.
		let bar: HTMLElement | null = null;
		let footer: Element | null = null;
		const measure = () => {
			const showing = barShowing(bar);
			const next = dockPlacement({
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
				barHeight: showing && bar ? bar.getBoundingClientRect().height : 0,
				avoidTop: footer ? footer.getBoundingClientRect().top : null,
			});
			setPlace((current) =>
				current && current.inset === next.inset && current.bottom === next.bottom ? current : next,
			);
		};
		// Read after the frame, so the sticky bar's own scroll handler has rendered.
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		const sizes = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
		// The bar slides in on an attribute change no scroll may follow (a bar
		// shown from the top), so its own element is watched as well.
		const shows =
			typeof MutationObserver === "undefined" ? undefined : new MutationObserver(schedule);
		const findBar = () => (lift ? document.querySelector<HTMLElement>(lift) : null);
		const findFooter = () =>
			avoid === null
				? null
				: typeof avoid === "string"
					? document.querySelector(avoid)
					: avoid.current;
		const bind = () => {
			bar = findBar();
			footer = findFooter();
			sizes?.disconnect();
			shows?.disconnect();
			// The page's own height moves the footer (a late image, an opened
			// fold), and the bar and the footer can change size themselves.
			sizes?.observe(document.body);
			if (bar) {
				sizes?.observe(bar);
				shows?.observe(bar, { attributes: true, attributeFilter: ["data-showing", "class"] });
			}
			if (footer) sizes?.observe(footer);
			measure();
		};
		// A route change swaps the footer, and a bar can mount after the dock:
		// either is an element added or removed. The page's other changes (a
		// carousel stepping, a form's message) add elements too, so a frame's
		// worth of them is gathered into one look, and that look only asks the
		// two selectors again: the dock rebinds, observing and measuring anew,
		// only when the bar or the footer it finds is not the one it holds.
		const check = () => {
			if (findBar() !== bar || findFooter() !== footer) bind();
		};
		// The dock's own changes (its icon swapping as it opens) never move the bar
		// or the footer, so they are not looked at.
		const rebind = (records: MutationRecord[]) => {
			const own = rootRef.current;
			if (own && records.every((record) => own.contains(record.target))) return;
			cancelAnimationFrame(bound);
			bound = requestAnimationFrame(check);
		};
		const added =
			typeof MutationObserver === "undefined" ? undefined : new MutationObserver(rebind);
		added?.observe(document.body, { childList: true, subtree: true });
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		bind();
		return () => {
			cancelAnimationFrame(frame);
			cancelAnimationFrame(bound);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
			sizes?.disconnect();
			shows?.disconnect();
			added?.disconnect();
		};
	}, [avoid, lift, track]);

	useDismiss(open, rootRef, (reason) => {
		setOpen(false);
		if (reason === "escape") launchRef.current?.focus();
	});

	// The panel sits before the launcher in the DOM (it opens upward), so Tab
	// from the launcher would skip it: opening by hand moves focus in.
	useEffect(() => {
		if (!open) return;
		if (!opened.current) panelRef.current?.querySelector<HTMLElement>(".cd-close")?.focus();
		opened.current = true;
		return () => {
			opened.current = false;
		};
	}, [open]);

	const heading = title ?? label;

	return (
		<div
			ref={rootRef}
			className={["contact-dock", open && "is-open"].filter(Boolean).join(" ")}
			// While open the dock sits in the corner: the phone's panel is a sheet that
			// reserves room for the launcher there, and a desktop panel opens upward
			// and would run off the top if the dock were riding above the footer.
			style={place ? { right: place.inset, bottom: open ? place.inset : place.bottom } : undefined}
		>
			<section
				ref={panelRef}
				id={panelId}
				className="cd-panel"
				aria-labelledby={headingId}
				inert={!open}
				hidden={!open}
			>
				<div className="cd-head">
					<div className="cd-head-text">
						<h2 className="cd-title" id={headingId}>
							{heading}
						</h2>
						{subtitle && <p className="cd-sub">{subtitle}</p>}
					</div>
					<button
						type="button"
						className="cd-close"
						aria-label={panelCloseLabel}
						onClick={() => {
							setOpen(false);
							launchRef.current?.focus();
						}}
					>
						<X size={20} aria-hidden="true" />
					</button>
				</div>
				<ul className="cd-items">
					{items.map((item, at) => {
						const Icon = dockIcons[item.icon ?? "chat"];
						// A call row holds its number whole and wraps its words.
						const words = (text: string) => (isTel(item.href) ? holdPhoneNumbers(text) : text);
						const inner = (
							<>
								<span className="cd-item-icon">
									<Icon size={20} aria-hidden="true" />
								</span>
								<span className="cd-item-text">
									<span className="cd-item-label">{words(item.label)}</span>
									{item.description && (
										<span className="cd-item-desc">{words(item.description)}</span>
									)}
								</span>
								<ChevronRight className="cd-item-go" size={18} aria-hidden="true" />
							</>
						);
						const className = ["cd-item", item.lead && "is-lead"].filter(Boolean).join(" ");
						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: two items may share a label or a link, so the place keeps the key unique; items never reorder
							<li key={at}>
								{item.href !== undefined ? (
									<a
										className={className}
										href={item.href}
										onClick={() => setOpen(false)}
										{...newTabProps(item.href, item.external)}
									>
										{inner}
									</a>
								) : (
									<button
										type="button"
										className={className}
										onClick={() => {
											setOpen(false);
											item.onSelect?.();
										}}
									>
										{inner}
									</button>
								)}
							</li>
						);
					})}
				</ul>
				{footnote && <p className="cd-foot">{footnote}</p>}
			</section>
			<button
				ref={launchRef}
				type="button"
				className="cd-launch"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((current) => !current)}
			>
				{open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={22} aria-hidden="true" />}
				{/* Visually hidden on a phone, where the launcher is its icon, and still its name. */}
				<span className="cd-launch-text">{open ? closeLabel : label}</span>
			</button>
		</div>
	);
}
