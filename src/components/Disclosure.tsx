import { ChevronDown } from "lucide-react";
import { type ReactNode, useId } from "react";

export interface DisclosureProps {
	/** What the section is, and the toggle's accessible name. */
	label: ReactNode;
	open: boolean;
	onToggle: () => void;
	/**
	 * Sits beside the label and outside the toggle's name: a count, a flag, a
	 * small chart. A tap on it still folds the section.
	 */
	meta?: ReactNode;
	/** Makes the label a real heading at this level; leave it out for none. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** The panel's id; minted when left out. */
	panelId?: string;
	className?: string;
	children: ReactNode;
}

/**
 * A section the page opens and closes: a header row that folds a body the
 * caller controls. Where `Collapsible` is a native details element that keeps
 * its own state and its detail in the page, this one is for an app. The
 * caller holds `open`, so it can remember which sections were folded, and a
 * closed body is not rendered, so a long list costs nothing until asked for.
 *
 * The label is the toggle, so its name reads "Produce, collapsed" and not
 * "Produce 10 items"; `meta` is a sibling for that reason. The toggle's
 * `::after` stretches over the whole header row, so a tap anywhere on it,
 * meta and chevron included, folds the section.
 */
export function Disclosure({
	label,
	open,
	onToggle,
	meta,
	headingLevel,
	panelId,
	className,
	children,
}: DisclosureProps) {
	const minted = useId();
	const id = panelId ?? minted;
	const Root = headingLevel ? "section" : "div";
	const Title = headingLevel ? (`h${headingLevel}` as const) : "div";

	return (
		<Root className={["disclosure", open && "is-open", className].filter(Boolean).join(" ")}>
			<div className="disclosure-head">
				<Title className="disclosure-title">
					<button
						type="button"
						className="disclosure-toggle"
						onClick={onToggle}
						aria-expanded={open}
						aria-controls={id}
					>
						{label}
					</button>
				</Title>
				{meta != null && meta !== false && <span className="disclosure-meta">{meta}</span>}
				<ChevronDown className="disclosure-chevron" size={16} aria-hidden="true" />
			</div>
			{open && (
				<div className="disclosure-body" id={id}>
					{children}
				</div>
			)}
		</Root>
	);
}
