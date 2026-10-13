import { ChevronDown } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

export interface ExpandListItem {
	title: string;
	body: ReactNode;
}

export interface ExpandListProps {
	items: ExpandListItem[];
	className?: string;
}

function ExpandRow({ index, item }: { index: number; item: ExpandListItem }) {
	const [open, setOpen] = useState(false);
	const bodyRef = useRef<HTMLDivElement>(null);
	const num = String(index + 1).padStart(2, "0");

	return (
		<div className={["xl-row", open && "open"].filter(Boolean).join(" ")}>
			<button
				type="button"
				className="xl-head"
				aria-expanded={open}
				onClick={() => setOpen((prev) => !prev)}
			>
				<span className="xl-num">{num}</span>
				<span className="xl-title">{item.title}</span>
				<ChevronDown className="xl-chevron" size={18} strokeWidth={2} aria-hidden="true" />
			</button>
			<div
				className="xl-body"
				style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 0) : 0 }}
			>
				<div className="xl-body-inner" ref={bodyRef}>
					{item.body}
				</div>
			</div>
		</div>
	);
}

/**
 * A light accordion of numbered fold-out rows: mono index, title, and an
 * expandable body — for amenity lists, add-ons, and other compact
 * disclosures that don't warrant the full FAQBrowser help center. Bodies
 * ship in the static HTML (collapsed visually, present for crawlers),
 * matching how FAQBrowser handles answers.
 */
export function ExpandList({ items, className }: ExpandListProps) {
	return (
		<div className={["expand-list", className].filter(Boolean).join(" ")}>
			{items.map((item, index) => (
				<ExpandRow key={item.title} index={index} item={item} />
			))}
		</div>
	);
}
