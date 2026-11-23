import { type LucideIcon, Navigation } from "lucide-react";
import { type ReactNode, useId } from "react";
import { navIcons } from "../chrome/icons";
import { newTabProps } from "../lib/newTabProps";
import { useWithBase } from "../routing/BasePathProvider";
import type { NavIcon } from "../types";

/** The icons a row and its action draw: the mega menu's set, and the directions arrow. */
export type InfoRowIcon = NavIcon | "directions";

const rowIcons: Record<InfoRowIcon, LucideIcon> = { ...navIcons, directions: Navigation };

/** The one thing a row does, drawn on its right as an icon over its words. */
export interface InfoRowAction {
	/** The link's words, under the icon. */
	label: string;
	href: string;
	icon: InfoRowIcon;
	/**
	 * Opens in a new tab, as a directions link to a map should. A `tel:` or
	 * `mailto:` link never does, whatever this says (Component Rules 12).
	 */
	newTab?: boolean;
}

export interface InfoRow {
	/** The row's title: an office's name, a question. */
	title: ReactNode;
	/** The lines under the title, each on its own line: an address, a sentence. */
	lines?: ReactNode[];
	/** Anything under the lines: an office's hours, say, as a `HoursTable`. */
	detail?: ReactNode;
	/** An icon before the title, decorative. */
	icon?: InfoRowIcon;
	action?: InfoRowAction;
	/** A key for the row when its title is not a string. */
	id?: string;
}

export interface InfoRowsProps {
	rows: InfoRow[];
	/** The level each row's title is read at. Defaults to 3. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	className?: string;
}

/**
 * A list of rows, each a title over a few lines with one action on its
 * right, the way a map pack lists a place with its directions: an office
 * and its Get Directions, an estimate and the link to it. The action is an
 * icon in a filled circle over its words; it is described by its row's
 * title, so two Get Directions links tell themselves apart to a screen
 * reader. A row's title is a heading by role (Component Rules 21).
 */
export function InfoRows({ rows, headingLevel = 3, className }: InfoRowsProps) {
	const uid = useId();
	const withBase = useWithBase();
	return (
		<ul className={["info-rows", className].filter(Boolean).join(" ")}>
			{rows.map((row, index) => {
				const titleId = `${uid}-${index}`;
				const Lead = row.icon ? rowIcons[row.icon] : null;
				const ActionIcon = row.action ? rowIcons[row.action.icon] : null;
				return (
					<li
						className={["info-row", row.detail && "has-detail"].filter(Boolean).join(" ")}
						key={row.id ?? (typeof row.title === "string" ? row.title : titleId)}
					>
						{Lead && <Lead className="info-row-icon" size={22} aria-hidden="true" />}
						<div className="info-row-text">
							{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
							<div className="info-row-title" id={titleId} role="heading" aria-level={headingLevel}>
								{row.title}
							</div>
							{row.lines && row.lines.length > 0 && (
								<p className="info-row-lines">
									{row.lines.map((line, at) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: the lines are a fixed list, never reordered
										<span key={at}>{line}</span>
									))}
								</p>
							)}
							{row.detail && <div className="info-row-detail">{row.detail}</div>}
						</div>
						{row.action && ActionIcon && (
							<a
								className="info-row-action"
								href={withBase(row.action.href)}
								aria-describedby={titleId}
								{...newTabProps(row.action.href, row.action.newTab)}
							>
								<span className="info-row-action-icon">
									<ActionIcon size={22} aria-hidden="true" />
								</span>
								<span>{row.action.label}</span>
							</a>
						)}
					</li>
				);
			})}
		</ul>
	);
}
