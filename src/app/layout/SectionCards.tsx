import { Link } from "@tanstack/react-router";

import { useNav } from "../context/AppContext";

/**
 * A section's sub pages as cards on its landing page, read from the nav
 * config so the rail, the menu sheet, and the landing page never disagree.
 * Renders nothing for a section without children.
 */
export function SectionCards({ section }: { section: string }) {
	const navItems = useNav();
	const item = navItems.find((candidate) => candidate.href === section);
	if (!item?.children?.length) return null;

	return (
		<nav className="ap-sections" aria-label={`${item.label} pages`}>
			{item.children.map((child) => {
				const Icon = child.icon;
				return (
					<Link key={child.href} to={child.href} className="ap-section-card">
						<span className="ic">
							<Icon size={20} />
						</span>
						<span className="flex flex-col gap-1">
							<span className="lb">{child.label}</span>
							<span className="bl">{child.blurb}</span>
						</span>
					</Link>
				);
			})}
		</nav>
	);
}
