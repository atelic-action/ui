import { Check } from "lucide-react";
import type { ReactNode } from "react";

export interface TickListProps {
	items: ReactNode[];
	className?: string;
}

/** Checkmark bullet list used in feature details and pricing cards. */
export function TickList({ items, className }: TickListProps) {
	return (
		<ul className={["ticks", className].filter(Boolean).join(" ")}>
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static content lists never reorder
				<li key={i}>
					<span className="tick" aria-hidden="true">
						<Check size={12} strokeWidth={3} />
					</span>
					{item}
				</li>
			))}
		</ul>
	);
}
