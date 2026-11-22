import type { NavGroupColumn, NavLink, NavPanelSection } from "../types";

/** Whether a panel section is a link column, the kind a section is when it names none. */
export function isLinkColumn(section: NavPanelSection): section is NavGroupColumn {
	return section.kind === undefined || section.kind === "links";
}

const KNOWN_KINDS: ReadonlySet<string | undefined> = new Set([
	undefined,
	"links",
	"picture",
	"rows",
	"cards",
]);

/**
 * Whether the chrome knows how to draw a section. A config written against a
 * later version (or a typo the types never saw, from JSON) can name a kind
 * this one lacks; that section is left out rather than drawn as the wrong
 * kind, which would read fields it does not have.
 */
export function isKnownSection(section: NavPanelSection): boolean {
	return (
		typeof section === "object" &&
		section !== null &&
		KNOWN_KINDS.has((section as { kind?: string }).kind)
	);
}

/** A group's sections that the chrome can draw, in order. */
export function panelSections(link: NavLink): NavPanelSection[] {
	return (link.columns ?? []).filter(isKnownSection);
}

/** Whether an entry is a group: it holds at least one section the chrome can draw. */
export function isGroup(link: NavLink): boolean {
	return panelSections(link).length > 0;
}

/** Every href a group's panel holds, its column headings, links, and their children included. */
export function groupHrefs(group: NavLink): string[] {
	const hrefs: string[] = [];
	for (const section of panelSections(group)) {
		if (isLinkColumn(section)) {
			if (section.href) hrefs.push(section.href);
			for (const link of section.links) {
				hrefs.push(link.href);
				for (const child of link.children ?? []) hrefs.push(child.href);
			}
		} else if (section.kind === "picture") hrefs.push(section.href);
		else if (section.kind === "rows") for (const row of section.rows) hrefs.push(row.href);
		else for (const card of section.cards) hrefs.push(card.href);
	}
	return hrefs;
}
