import type { ComponentType } from "react";

/**
 * Canonical navigation — the single source of truth for every nav
 * surface the app shell renders: the desktop rail, the mobile tab bar, the
 * mobile menu sheet, and a section's landing cards. Active state is derived
 * from the current route against each item's `href`, so there is one place to
 * add or reorder a destination. The items are the app's, handed to
 * `AppProvider` as `nav`; this module holds the types and the active path
 * helpers.
 */
export interface NavChild {
	label: string;
	href: string;
	icon: ComponentType<{ className?: string; size?: number }>;
	/** One line for the section landing card. */
	blurb: string;
}

export interface NavItem {
	label: string;
	href: string;
	icon: ComponentType<{ className?: string; size?: number }>;
	/** Sub destinations inside this section, rendered beneath it in the rail
	 * and the menu sheet, and as cards on the section's landing page. */
	children?: NavChild[];
	/** Show only in the mobile tab bar. */
	mobileOnly?: boolean;
	/** Show only in the desktop nav rail. */
	desktopOnly?: boolean;
	/** Other paths that belong to this section though they sit outside its
	 * `href`, such as a record's own page at a short top level path. */
	matches?: string[];
}

/** True when `pathname` is `href` or sits beneath it. The root ("/") only
 * matches itself, since every path sits beneath it. */
export function isActivePath(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

/** True when `pathname` belongs to the section: its `href` or one of its
 * `matches`, or anything beneath them. */
export function isActiveSection(pathname: string, item: NavItem): boolean {
	return [item.href, ...(item.matches ?? [])].some((href) => isActivePath(pathname, href));
}

/** The section (top level nav item) the current path belongs to, if any. */
export function activeSection(pathname: string, items: NavItem[]): NavItem | undefined {
	return items.find((item) => isActiveSection(pathname, item));
}
