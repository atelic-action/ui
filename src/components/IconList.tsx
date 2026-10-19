import { Dot } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "./tone";

export interface IconListItem {
	/** The item itself. */
	body: ReactNode;
	/** The icon it leads with, e.g. a lucide icon at size 16; the list's when left out. */
	icon?: ReactNode;
	/** The tone its bullet reads in; the list's when left out. */
	tone?: Tone;
}

export interface IconListProps {
	items: IconListItem[];
	/** The bullet every item without its own leads with; a dot when left out. */
	icon?: ReactNode;
	/** The tone every bullet without its own reads in; the text's color when left out. */
	tone?: Tone;
	className?: string;
}

/**
 * A list whose bullets are icons: one for the whole list, or one per item,
 * each in a tone set the same two ways. The bullets are decoration; the
 * items carry the meaning, so a screen reader hears the list and not the
 * icons.
 */
export function IconList({ items, icon, tone, className }: IconListProps) {
	return (
		<ul className={["icon-list", className].filter(Boolean).join(" ")} data-tone={tone}>
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: items are static content in a fixed order
				<li key={i} data-tone={item.tone}>
					<span className="icon-list-bullet" aria-hidden="true">
						{item.icon ?? icon ?? <Dot size={16} strokeWidth={4} />}
					</span>
					<span className="icon-list-body">{item.body}</span>
				</li>
			))}
		</ul>
	);
}
