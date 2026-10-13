import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export interface Crumb {
	label: string;
	/** Route to link to. Omit for the current (last) crumb. */
	to?: LinkProps["to"];
}

/**
 * The breadcrumb trail rendered in AppPage's `crumb` slot, above the title.
 * Every page passes one: section and root pages a single self crumb ("Eat"),
 * sub pages and detail pages a "Section / Page" trail.
 *
 * Two renderings, one per breakpoint, so the trail reads on a phone:
 *
 * - Below lg, a trail with a parent collapses to one thumb sized back link to
 *   the nearest linked ancestor ("‹ Recipes"). The current page is the title
 *   directly beneath, so repeating it in a tiny wrapped line bought nothing,
 *   and a root page's single self crumb shows nothing at all there.
 * - At lg and up, the full "Eat / Recipes / Name" trail, the current page
 *   truncated rather than wrapped.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
	if (items.length === 0) {
		return null;
	}

	// The nearest ancestor with a route; the back link on small screens.
	const parent = [...items.slice(0, -1)].reverse().find((crumb) => crumb.to);

	return (
		<nav aria-label="Breadcrumb" className="crumbs">
			{parent && (
				<Link to={parent.to} className="crumbs-back" aria-label={`Back to ${parent.label}`}>
					<ChevronLeft size={18} aria-hidden="true" />
					<span>{parent.label}</span>
				</Link>
			)}
			<ol className="crumbs-trail">
				{items.map((crumb, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: a label may repeat in a trail, and a trail never reorders
					<li key={`${crumb.label}-${index}`}>
						{index > 0 && <span aria-hidden="true">/</span>}
						{crumb.to ? (
							<Link to={crumb.to} className="hover:underline">
								{crumb.label}
							</Link>
						) : (
							<span aria-current="page">{crumb.label}</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
