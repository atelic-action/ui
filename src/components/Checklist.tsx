import { CircleCheck, CircleX } from "lucide-react";
import type { ReactNode } from "react";

export interface ChecklistItem {
	label: ReactNode;
	/** One line on what was checked or what failed. */
	detail?: ReactNode;
	pass: boolean;
}

export interface ChecklistProps {
	items: ChecklistItem[];
	/** What a screen reader calls a pass and a fail. */
	passLabel?: string;
	failLabel?: string;
	className?: string;
}

/** A short list of checks, each passed or failed, in two columns when there is room. */
export function Checklist({
	items,
	passLabel = "Passes",
	failLabel = "Fails",
	className,
}: ChecklistProps) {
	return (
		<ul className={["checklist", className].filter(Boolean).join(" ")}>
			{items.map((item, i) => {
				const Icon = item.pass ? CircleCheck : CircleX;
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: checks are static content in a fixed order
					<li key={i} data-tone={item.pass ? "good" : "bad"}>
						<Icon size={18} role="img" aria-label={item.pass ? passLabel : failLabel} />
						<span>
							<span className="checklist-label">{item.label}</span>
							{item.detail && <span className="checklist-detail">{item.detail}</span>}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
