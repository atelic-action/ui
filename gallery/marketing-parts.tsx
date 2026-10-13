import type { ReactNode } from "react";
import "../src/styles/sections.css";
import "./marketing.css";

/*
 * The frame the marketing groups share. A section is page scale, so it is
 * shown the way a site shows it, full width under a labeled band, never boxed
 * in an example card. Each group wears `.atelic-ui`, the scope the section and
 * primitive styles answer to.
 */

/** One group of sections: a heading band over the sections it shows. */
export function MarketingGroup({
	id,
	title,
	lead,
	children,
}: {
	id: string;
	title: string;
	lead: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="atelic-ui mg-group" id={id}>
			<header className="mg-group-head">
				<div className="wrap">
					<p className="mg-kicker">Marketing sections</p>
					<h2 id={`${id}-title`}>{title}</h2>
					<p className="mg-lead">{lead}</p>
				</div>
			</header>
			{children}
		</div>
	);
}

/** The label over one section: its name, in code, and a line on when to reach for it. */
export function Specimen({
	id,
	name,
	lead,
	children,
}: {
	id: string;
	name: string;
	lead: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="mg-specimen" id={id}>
			<div className="mg-label">
				<div className="wrap">
					<code>{name}</code>
					<span>{lead}</span>
				</div>
			</div>
			{children}
		</div>
	);
}

/** A section that renders no band of its own, set in one the way a page sets it. */
export function Band({ alt = false, children }: { alt?: boolean; children: ReactNode }) {
	return (
		<section className={["section", alt && "surface-alt"].filter(Boolean).join(" ")}>
			<div className="wrap">{children}</div>
		</section>
	);
}
