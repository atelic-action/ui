import {
	Calculator,
	CalendarDays,
	ChevronRight,
	ClipboardList,
	type LucideIcon,
	Mail,
	MapPin,
	MessageCircle,
	Phone as PhoneIcon,
	X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { ContactDockConfig, ContactDockIcon } from "../types";

export interface ContactDockProps extends ContactDockConfig {
	/**
	 * A selector for the element the dock never covers: as it scrolls into
	 * view the dock rides up to sit just above its top edge. Defaults to the
	 * page's `footer`; `null` avoids nothing.
	 */
	avoid?: string | null;
	/**
	 * Whether the dock tracks the page: it lifts over the phone's sticky bar
	 * once that bar shows, and rises above the footer. Off holds it at its
	 * corner inset (a preview frame). Defaults on.
	 */
	track?: boolean;
	/** The launcher's words while the panel is open. Defaults to "Close". */
	closeLabel?: string;
	/** Start with the panel open (a preview of the open state). */
	defaultOpen?: boolean;
}

const icons: Record<ContactDockIcon, LucideIcon> = {
	chat: MessageCircle,
	phone: PhoneIcon,
	calendar: CalendarDays,
	mail: Mail,
	form: ClipboardList,
	calculator: Calculator,
	map: MapPin,
};

/** Where the phone layout starts, the sticky bar's own breakpoint. */
const PHONE_MAX = 899;

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
	return { inset, bottom: Math.round(Math.max(overBar, overFooter)) };
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
	track = true,
	closeLabel = "Close",
	defaultOpen = false,
}: ContactDockProps) {
	const [open, setOpen] = useState(defaultOpen);
	const [place, setPlace] = useState({ inset: 24, bottom: 24 });
	const rootRef = useRef<HTMLDivElement>(null);
	const launchRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();
	const headingId = `${panelId}h`;

	useEffect(() => {
		if (!track) return;
		let frame = 0;
		const measure = () => {
			const bar = document.querySelector<HTMLElement>(".sticky-cta.show");
			const showing = bar !== null && getComputedStyle(bar).display !== "none";
			const footer = avoid ? document.querySelector(avoid) : null;
			const next = dockPlacement({
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
				barHeight: showing && bar ? bar.getBoundingClientRect().height : 0,
				avoidTop: footer ? footer.getBoundingClientRect().top : null,
			});
			setPlace((current) =>
				current.inset === next.inset && current.bottom === next.bottom ? current : next,
			);
		};
		// Read after the frame, so the sticky bar's own scroll handler has rendered.
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("resize", schedule);
		// The bar slides in on a class change that no scroll may follow (a bar
		// shown from the top), so watch it as well.
		const watcher =
			typeof MutationObserver === "undefined" ? undefined : new MutationObserver(schedule);
		const bar = document.querySelector(".sticky-cta");
		if (watcher && bar) watcher.observe(bar, { attributes: true, attributeFilter: ["class"] });
		measure();
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("resize", schedule);
			watcher?.disconnect();
		};
	}, [avoid, track]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			setOpen(false);
			launchRef.current?.focus();
		};
		const onPointer = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPointer);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPointer);
		};
	}, [open]);

	const heading = title ?? label;

	return (
		<div
			ref={rootRef}
			className={["contact-dock", open && "is-open"].filter(Boolean).join(" ")}
			style={{ right: place.inset, bottom: place.bottom }}
		>
			<section
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
						aria-label={closeLabel}
						onClick={() => {
							setOpen(false);
							launchRef.current?.focus();
						}}
					>
						<X size={20} aria-hidden="true" />
					</button>
				</div>
				<ul className="cd-items">
					{items.map((item) => {
						const Icon = icons[item.icon ?? "chat"];
						const inner = (
							<>
								<span className="cd-item-icon">
									<Icon size={20} aria-hidden="true" />
								</span>
								<span className="cd-item-text">
									<span className="cd-item-label">{item.label}</span>
									{item.description && <span className="cd-item-desc">{item.description}</span>}
								</span>
								<ChevronRight className="cd-item-go" size={18} aria-hidden="true" />
							</>
						);
						const className = ["cd-item", item.lead && "is-lead"].filter(Boolean).join(" ");
						return (
							<li key={item.label}>
								{item.href && !item.onSelect ? (
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
