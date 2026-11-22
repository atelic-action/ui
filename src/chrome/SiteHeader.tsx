import { ChevronDown, Phone as PhoneIcon } from "lucide-react";
import {
	type FocusEvent,
	type KeyboardEvent,
	type PointerEvent,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { type PageStop, useScrollSpy } from "../hooks/useScrollSpy";
import { newTabProps } from "../lib/newTabProps";
import type { Brand, CallToAction, HeaderPhone, MenuContact, NavLink } from "../types";
import { BrandLockup } from "./BrandLockup";
import { NavMegaPanel } from "./NavMegaPanel";
import { SiteMenu } from "./SiteMenu";

/**
 * `transparent` sits over a full bleed hero and turns solid on scroll,
 * `solid` is the light bar, and `dark` matches a dark page surface.
 */
export type SiteHeaderVariant = "transparent" | "solid" | "dark";

export interface SiteHeaderProps {
	/** The identity the lockup renders. */
	brand: Brand;
	/**
	 * The site's primary nav. Omit on a page with no site nav, such as an
	 * artifact. An entry with `columns` is a group: on a desktop it opens a
	 * mega menu panel, and in the phone's menu an accordion.
	 */
	links?: NavLink[];
	/** The primary action, in the bar on desktop and in the menu. */
	primaryCTA?: CallToAction;
	/** Defaults to `solid`. */
	variant?: SiteHeaderVariant;
	/** The current path, marking the matching nav link with aria-current. */
	currentPath?: string;
	/**
	 * Presentation mode: the page's own stops replace the nav links, scroll
	 * spied, on desktop and in the menu. The CTA and the menu's contact block
	 * step aside, since both are site chrome and the page owns its close.
	 */
	stops?: PageStop[];
	/** Hides the bar's CTA (e.g. a reveal, where the ask is the letter). The menu keeps it. */
	hideCTA?: boolean;
	/** The contact block at the foot of the menu. */
	contact?: MenuContact;
	/**
	 * Up to two numbers the bar shows on a desktop, each a tel link, with the
	 * first as a call button beside the burger on a phone. A third is dropped.
	 */
	phones?: HeaderPhone[];
}

/** The keys that move focus along the bar and down into an open panel. */
const BAR_ITEMS = ".nav-links > a, .nav-links .nav-group-btn";
const PANEL_ITEMS = "a[href], button:not([disabled])";

/**
 * A keyboard focus opens a group the way a hover does; a click focuses the
 * control too, and that focus must not count. jsdom and older engines that
 * cannot answer the question get the keyboard reading.
 */
function isKeyboardFocus(element: Element): boolean {
	try {
		return element.matches(":focus-visible");
	} catch {
		return true;
	}
}

/** The spoken name of a header number: its label, then the number. */
function phoneName(phone: HeaderPhone): string {
	return phone.label ? `${phone.label} ${phone.display}` : phone.display;
}

/**
 * The fixed header every page wears: the lockup, the nav or the page's
 * stops, the numbers, the CTA, and the burger that opens the menu. It takes
 * the current path as a prop rather than asking a router, so it runs under
 * any of them.
 *
 * A nav group opens its panel on a mouse hover or a keyboard focus, and a
 * click on its control pins it open (a second click closes it). Escape, a
 * click outside the header, the pointer leaving the header, and focus
 * leaving the group close an unpinned panel; Escape and an outside click
 * close a pinned one too. Left and right arrows walk the bar, the down arrow
 * steps into a panel, and up and down walk the panel's links. A closed panel
 * stays in the HTML, `inert`, so its links are crawlable and out of the tab
 * order.
 */
export function SiteHeader({
	brand,
	links,
	primaryCTA,
	variant = "solid",
	currentPath,
	stops,
	hideCTA = false,
	contact,
	phones,
}: SiteHeaderProps) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	// The open group's index, and whether a click pinned it open.
	const [openGroup, setOpenGroup] = useState<number | null>(null);
	const [pinned, setPinned] = useState(false);
	const [focusPanel, setFocusPanel] = useState(false);
	const headerRef = useRef<HTMLElement>(null);
	const baseId = useId();
	const menuId = `${baseId}menu`;
	const activeId = useScrollSpy(stops ? stops.map((stop) => stop.id) : []);

	useEffect(() => {
		if (variant !== "transparent") return;
		const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [variant]);

	const close = () => {
		setOpenGroup(null);
		setPinned(false);
	};

	// Escape and a click outside the header close whatever is open, pinned or not.
	useEffect(() => {
		if (openGroup === null) return;
		const onKey = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape") return;
			const header = headerRef.current;
			const control = header?.querySelector<HTMLElement>(
				`#${CSS.escape(`${baseId}g${openGroup}`)}`,
			);
			if (header?.contains(document.activeElement)) control?.focus();
			setOpenGroup(null);
			setPinned(false);
		};
		const onPointer = (event: globalThis.PointerEvent) => {
			if (headerRef.current?.contains(event.target as Node)) return;
			setOpenGroup(null);
			setPinned(false);
		};
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPointer);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPointer);
		};
	}, [openGroup, baseId]);

	// The down arrow opens a panel and moves into it once it is no longer inert.
	useEffect(() => {
		if (!focusPanel || openGroup === null) return;
		setFocusPanel(false);
		const panel = document.getElementById(`${baseId}p${openGroup}`);
		panel?.querySelector<HTMLElement>(PANEL_ITEMS)?.focus();
	}, [focusPanel, openGroup, baseId]);

	const solid = variant !== "transparent" || scrolled || openGroup !== null;
	const flatLinks = (links ?? []).map(({ label, href, columns, allLabel }) => ({
		label,
		href,
		columns,
		allLabel,
	}));
	const menuLinks = stops
		? stops.map((stop) => ({ label: stop.label, href: `#${stop.id}` }))
		: flatLinks;
	const menuCTA = stops ? undefined : primaryCTA;
	const barCTA = hideCTA ? undefined : menuCTA;
	const hasMenu = menuLinks.length > 0 || menuCTA !== undefined;
	const barPhones = stops ? [] : (phones ?? []).slice(0, 2);
	const hasGroups = !stops && (links ?? []).some((link) => (link.columns?.length ?? 0) > 0);
	// A bar holding groups or numbers needs more width before the burger steps aside.
	const wide = hasGroups || barPhones.length > 0;

	const isCurrent = (link: NavLink) =>
		currentPath !== undefined &&
		(link.href === currentPath ||
			(link.columns ?? []).some((column) =>
				column.links.some((item) => item.href === currentPath),
			));

	// One handler for the whole nav: left and right walk the bar's entries,
	// up and down walk the links of the panel focus is in.
	function onNavKeyDown(event: KeyboardEvent<HTMLElement>) {
		const target = event.target as HTMLElement;
		const panel = target.closest(".nav-mega");
		const vertical = event.key === "ArrowDown" || event.key === "ArrowUp";
		const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
		if (!(panel ? vertical : horizontal)) return;
		const scope = panel ?? event.currentTarget;
		const items = Array.from(scope.querySelectorAll<HTMLElement>(panel ? PANEL_ITEMS : BAR_ITEMS));
		const at = items.indexOf(target);
		if (at === -1) return;
		event.preventDefault();
		const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
		const next = forward ? at + 1 : at - 1;
		items[(next + items.length) % items.length]?.focus();
	}

	// Focus leaving the open group for anywhere else closes it. Focus lost to
	// nothing is a click on the page, which the outside click closes.
	function onNavBlur(event: FocusEvent<HTMLElement>) {
		if (openGroup === null) return;
		const next = event.relatedTarget as Node | null;
		if (!next) return;
		const item = document.getElementById(`${baseId}g${openGroup}`)?.closest(".nav-item");
		if (item && !item.contains(next)) close();
	}

	function onHeaderLeave(event: PointerEvent<HTMLElement>) {
		if (event.pointerType === "mouse" && !pinned) close();
	}

	return (
		<>
			<header
				ref={headerRef}
				className={[
					"nav",
					solid ? "is-solid" : "is-transparent",
					variant === "dark" && "nav-dark",
					wide && "is-wide",
				]
					.filter(Boolean)
					.join(" ")}
				onPointerLeave={onHeaderLeave}
			>
				<div className="nav-inner">
					<BrandLockup brand={brand} />
					{stops
						? stops.length > 0 && (
								<nav className="nav-links" aria-label="Page sections">
									{stops.map((stop) => (
										<a
											key={stop.id}
											href={`#${stop.id}`}
											className={activeId === stop.id ? "active" : undefined}
										>
											{stop.label}
										</a>
									))}
								</nav>
							)
						: links &&
							links.length > 0 && (
								<nav
									className="nav-links"
									aria-label="Primary"
									onKeyDown={onNavKeyDown}
									onBlur={onNavBlur}
								>
									{links.map((link, index) =>
										link.columns && link.columns.length > 0 ? (
											<div className="nav-item" key={link.href}>
												<button
													type="button"
													id={`${baseId}g${index}`}
													className={["nav-group-btn", isCurrent(link) && "is-current"]
														.filter(Boolean)
														.join(" ")}
													aria-expanded={openGroup === index}
													aria-controls={`${baseId}p${index}`}
													onPointerEnter={(event) => {
														if (event.pointerType !== "mouse") return;
														if (openGroup !== index) {
															setOpenGroup(index);
															setPinned(false);
														}
													}}
													onFocus={(event) => {
														if (openGroup !== index && isKeyboardFocus(event.currentTarget)) {
															setOpenGroup(index);
															setPinned(false);
														}
													}}
													onClick={() => {
														if (openGroup === index && pinned) close();
														else {
															setOpenGroup(index);
															setPinned(true);
														}
													}}
													onKeyDown={(event) => {
														if (event.key !== "ArrowDown") return;
														event.preventDefault();
														setOpenGroup(index);
														setPinned(true);
														setFocusPanel(true);
													}}
												>
													{link.label}
													<ChevronDown className="nav-chevron" size={16} aria-hidden="true" />
												</button>
												<NavMegaPanel
													id={`${baseId}p${index}`}
													group={link}
													open={openGroup === index}
													currentPath={currentPath}
													onNavigate={close}
												/>
											</div>
										) : (
											<a
												key={link.href}
												href={link.href}
												aria-current={currentPath === link.href ? "page" : undefined}
												onPointerEnter={(event) => {
													if (event.pointerType === "mouse" && !pinned) close();
												}}
											>
												{link.label}
											</a>
										),
									)}
								</nav>
							)}
					{barPhones.length > 0 && (
						<div className="nav-phones">
							{barPhones.map((phone) => (
								<a
									key={phone.e164}
									className="nav-phone"
									href={`tel:${phone.e164}`}
									aria-label={phoneName(phone)}
								>
									<PhoneIcon size={17} aria-hidden="true" />
									<span className="nav-phone-text">
										{phone.label && <span className="nav-phone-label">{phone.label}</span>}
										<span className="nav-phone-number">{phone.display}</span>
									</span>
								</a>
							))}
						</div>
					)}
					{barCTA && (
						// The class sits on a wrapper, not the button: a site's own .btn
						// display rule lives outside the atelic-ui layer and would beat
						// any rule here that hid the button itself.
						<span className="nav-cta">
							<a
								className="btn btn-primary"
								href={barCTA.href}
								{...newTabProps(barCTA.href, barCTA.external)}
							>
								{barCTA.label}
							</a>
						</span>
					)}
					{barPhones[0] && (
						<a
							className="nav-call"
							href={`tel:${barPhones[0].e164}`}
							aria-label={phoneName(barPhones[0])}
						>
							<PhoneIcon size={19} aria-hidden="true" />
						</a>
					)}
					{hasMenu && (
						<button
							type="button"
							className="nav-burger"
							aria-label={menuOpen ? "Close menu" : "Open menu"}
							aria-expanded={menuOpen}
							aria-controls={menuId}
							onClick={() => setMenuOpen((open) => !open)}
						>
							<span />
							<span />
							<span />
						</button>
					)}
				</div>
			</header>
			{hasMenu && (
				<SiteMenu
					id={menuId}
					open={menuOpen}
					onClose={() => setMenuOpen(false)}
					links={menuLinks}
					primaryCTA={menuCTA}
					contact={stops ? undefined : contact}
					phones={barPhones.length > 0 ? barPhones : undefined}
					currentPath={currentPath}
				/>
			)}
		</>
	);
}
