import { useEffect, useId, useState } from "react";
import { type PageStop, useScrollSpy } from "../hooks/useScrollSpy";
import { newTabProps } from "../lib/newTabProps";
import type { Brand, CallToAction, MenuContact, NavLink } from "../types";
import { BrandLockup } from "./BrandLockup";
import { SiteMenu } from "./SiteMenu";

/**
 * `transparent` sits over a full bleed hero and turns solid on scroll,
 * `solid` is the light bar, and `dark` matches a dark page surface.
 */
export type SiteHeaderVariant = "transparent" | "solid" | "dark";

export interface SiteHeaderProps {
	/** The identity the lockup renders. */
	brand: Brand;
	/** The site's primary nav. Omit on a page with no site nav, such as an artifact. */
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
}

/**
 * The fixed header every page wears: the lockup, the nav or the page's
 * stops, the CTA, and the burger that opens the menu. It takes the current
 * path as a prop rather than asking a router, so it runs under any of them.
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
}: SiteHeaderProps) {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuId = useId();
	const activeId = useScrollSpy(stops ? stops.map((stop) => stop.id) : []);

	useEffect(() => {
		if (variant !== "transparent") return;
		const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [variant]);

	const solid = variant !== "transparent" || scrolled;
	const menuLinks = stops
		? stops.map((stop) => ({ label: stop.label, href: `#${stop.id}` }))
		: (links ?? []);
	const menuCTA = stops ? undefined : primaryCTA;
	const barCTA = hideCTA ? undefined : menuCTA;
	const hasMenu = menuLinks.length > 0 || menuCTA !== undefined;

	return (
		<>
			<header
				className={["nav", solid ? "is-solid" : "is-transparent", variant === "dark" && "nav-dark"]
					.filter(Boolean)
					.join(" ")}
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
								<nav className="nav-links" aria-label="Primary">
									{links.map((link) => (
										<a
											key={link.href}
											href={link.href}
											aria-current={currentPath === link.href ? "page" : undefined}
										>
											{link.label}
										</a>
									))}
								</nav>
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
				/>
			)}
		</>
	);
}
