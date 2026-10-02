import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface CollapsibleProps {
	/** What is inside, e.g. "Your Main Pages". Always visible. */
	label: ReactNode;
	/**
	 * What the detail shows, in a sentence, so a reader who never opens it
	 * still has the point and the detail needs no explaining once open.
	 */
	summary?: ReactNode;
	/** Open on first render; closed by default. */
	defaultOpen?: boolean;
	className?: string;
	children: ReactNode;
}

/**
 * A labeled line the reader opens to see the detail behind it. It is a
 * native details element, so it opens with a click, a tap, Enter, or Space,
 * works before any script loads, and a browser's find in page opens it. It
 * prints open.
 */
export function Collapsible({
	label,
	summary,
	defaultOpen,
	className,
	children,
}: CollapsibleProps) {
	return (
		<details className={["collapsible", className].filter(Boolean).join(" ")} open={defaultOpen}>
			<summary>
				<span className="collapsible-text">
					<span className="collapsible-label">{label}</span>
					{summary && <span className="collapsible-summary">{summary}</span>}
				</span>
				<ChevronDown className="collapsible-chevron" size={18} aria-hidden="true" />
			</summary>
			<div className="collapsible-body">{children}</div>
		</details>
	);
}
