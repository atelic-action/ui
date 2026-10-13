import { type PageStop, useScrollSpy } from "../hooks";

/** One tab on the rail: an anchor already on the page. */
export type JumpRailItem = PageStop;

export interface JumpRailProps {
	items: JumpRailItem[];
	ariaLabel?: string;
}

/**
 * Sticky in page navigation: a pill tab per section anchor, highlighted by
 * scroll spy as its section enters the reading band. Extracted from the FAQ
 * browser's category tabs so any long page can share it. The scroll spy
 * comes from @atelic-action/ui, the same hook the header's page stops use.
 */
export function JumpRail({ items, ariaLabel = "Page sections" }: JumpRailProps) {
	const activeId = useScrollSpy(items.map((item) => item.id));

	return (
		<nav className="jump-rail" aria-label={ariaLabel}>
			<div className="wrap jump-rail-inner">
				{items.map((item) => (
					<a
						key={item.id}
						href={`#${item.id}`}
						className={activeId === item.id ? "active" : undefined}
					>
						{item.label}
					</a>
				))}
			</div>
		</nav>
	);
}
