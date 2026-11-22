import type { ReactNode } from "react";
import { newTabProps } from "../lib/newTabProps";
import { useWithBase } from "../routing/BasePathProvider";

/** One link in a column, with a figure set right aligned on its line when it has one. */
export interface LinkColumnLink {
	label: string;
	/**
	 * The row's page. Left out, the row is plain words (its name and its
	 * count) with no link, for a page that does not exist yet.
	 */
	href?: string;
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
 * aligned, so a list of cities reads with their counts in one column. A
 * row with no `href` is words alone. The least a column narrows to is
 * `--link-columns-min` (170px), so a theme can fit two across a phone.
 */
export function LinkColumns({ columns, className }: LinkColumnsProps) {
	const withBase = useWithBase();
	return (
		<div className={["link-columns", className].filter(Boolean).join(" ")}>
			{columns.map((column, place) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: two columns may share a heading, so the place keeps the key unique; columns never reorder
				<div className="lc-col" key={`${place} ${column.heading}`}>
					<h3 className="lc-head">
						{column.href ? <a href={withBase(column.href)}>{column.heading}</a> : column.heading}
					</h3>
					<ul>
						{column.links.map((link, at) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: a column may link one page twice, so the place keeps the key unique; links never reorder
							<li key={`${at} ${link.href ?? ""}`}>
								{link.href ? (
									<a
										className="lc-link"
										href={withBase(link.href)}
										{...newTabProps(link.href, link.external)}
									>
										<span className="lc-label">{link.label}</span>
										{link.count != null && <span className="lc-count">{link.count}</span>}
									</a>
								) : (
									// No page yet: the name and its count as words, nothing to follow.
									<span className="lc-link">
										<span className="lc-label">{link.label}</span>
										{link.count != null && <span className="lc-count">{link.count}</span>}
									</span>
								)}
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
