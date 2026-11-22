import type { ReactNode } from "react";

/** One callout: a heavy title over a short subtitle. */
export interface CalloutPanelItem {
	title: ReactNode;
	subtitle?: ReactNode;
}

export interface CalloutPanelProps {
	items: CalloutPanelItem[];
	className?: string;
}

/**
 * A set of short callouts on the primary field, set inside a section after
 * its copy: four across on a desktop and two by two below. The titles share
 * one line across a row and the subtitles another, whatever a title's
 * length, so a two line title never pushes its subtitle out of step with its
 * neighbors' (each item spans two rows of a subgrid). Not `Callout`, which is
 * one finding with a tone; these are the business's headline claims.
 */
export function CalloutPanel({ items, className }: CalloutPanelProps) {
	return (
		<ul
			className={["callout-panel", "on-primary", className].filter(Boolean).join(" ")}
			data-ground="primary"
		>
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: callouts are static content in a fixed order
				<li key={i}>
					<strong className="callout-panel-title">{item.title}</strong>
					<span className="callout-panel-sub">{item.subtitle}</span>
				</li>
			))}
		</ul>
	);
}
