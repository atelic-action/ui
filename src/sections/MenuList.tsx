import type { ReactNode } from "react";

/**
 * A priced menu group: uppercase heading over dotted rows of name, optional
 * note, and price, with an optional fine-print foot line. Composes into a
 * page column; pair with Menu structured data in the route's head().
 * Styles live in menu-list.css beside it, with the `.menu-stack` and
 * `.menu-cols` layouts a page stacks its groups in.
 */

export interface MenuListItem {
	name: string;
	/** Modifier or description line under the name. */
	note?: string;
	/** Rendered as text so ranges ("Small 5 / Large 6") stay expressible. */
	price: string;
}

export interface MenuListProps {
	heading: string;
	items: MenuListItem[];
	/** Fine print after the rows, e.g. "All sandwiches available as a salad." */
	foot?: ReactNode;
}

export function MenuList({ heading, items, foot }: MenuListProps) {
	return (
		<div className="menu-list">
			<h3>{heading}</h3>
			<ul>
				{items.map((item) => (
					<li key={item.name}>
						<span className="ml-item">
							<span className="ml-name">{item.name}</span>
							{item.note && <span className="ml-note">{item.note}</span>}
						</span>
						<span className="ml-price">{item.price}</span>
					</li>
				))}
			</ul>
			{foot && <p className="ml-foot">{foot}</p>}
		</div>
	);
}
