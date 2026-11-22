import type { NavGroupColumn, NavLink, NavPanelSection } from "../types";

/** Whether a panel section is a link column, the kind a section is when it names none. */
export function isLinkColumn(section: NavPanelSection): section is NavGroupColumn {
	return section.kind === undefined || section.kind === "links";
}

/** Every href a group's panel holds, its column headings, links, and their children included. */
export function groupHrefs(group: NavLink): string[] {
	const hrefs: string[] = [];
	for (const section of group.columns ?? []) {
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
