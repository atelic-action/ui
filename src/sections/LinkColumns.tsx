import type { ReactNode } from "react";
import { newTabProps } from "../lib/newTabProps";
import { useWithBase } from "../routing/BasePathProvider";

/** One link in a column, with a figure set right aligned on its line when it has one. */
export interface LinkColumnLink {
	label: string;
	href: string;
	/**
	 * A figure the row carries, e.g. a city's count of finished jobs. It sits
	 * right aligned on the label's line in tabular numerals, so a column of
	 * counts lines up digit under digit.
	 */
	count?: ReactNode;
	/** Opens in a new tab, except on mailto, tel, and sms links. */
	external?: boolean;
}

/** A column: a heading, itself a link when it has an `href`, over its links. */
export interface LinkColumn {
	heading: string;
	href?: string;
	links: LinkColumnLink[];
}

export interface LinkColumnsProps {
	columns: LinkColumn[];
	className?: string;
}

/**
 * Columns of links under a section's heading, each column a heading over
 * its links, as many across as fit: a site's service areas by region, or a
 * hub page's children. A link can carry a figure on its own line, right
 * aligned, so a list of cities reads with their counts in one column.
 */
export function LinkColumns({ columns, className }: LinkColumnsProps) {
	const withBase = useWithBase();
	return (
		<div className={["link-columns", className].filter(Boolean).join(" ")}>
			{columns.map((column) => (
				<div className="lc-col" key={column.heading}>
					<h3 className="lc-head">
						{column.href ? <a href={withBase(column.href)}>{column.heading}</a> : column.heading}
					</h3>
					<ul>
						{column.links.map((link) => (
							<li key={link.href}>
								<a
									className="lc-link"
									href={withBase(link.href)}
									{...newTabProps(link.href, link.external)}
								>
									<span className="lc-label">{link.label}</span>
									{link.count != null && <span className="lc-count">{link.count}</span>}
								</a>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
