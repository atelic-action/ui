import { Children, type CSSProperties, type ReactNode, useId, useState } from "react";
import { defaultNarrowColumns, hiddenCount, shownCount } from "../lib/gridLayout";

interface GridLayoutBase {
	/** The items, each child one cell of the grid. */
	children: ReactNode;
	/** The space between cells, any CSS length (default 16px). With `rules` it is the space between columns alone. */
	gap?: string;
	/** A hairline under every item and no space between rows, for a grid of short lines. */
	rules?: boolean;
	/** `ul` (the default) draws a list, each item an `li`; `div` draws plain cells. */
	as?: "ul" | "div";
	/** The list's accessible name. Omit for none. */
	ariaLabel?: string;
	id?: string;
	className?: string;
}

/** Columns counted outright: the count from 700px up, and the count below it. */
export interface GridLayoutByColumns extends GridLayoutBase {
	/** Columns from 700px up. */
	columns: number;
	/** Columns below 700px. Defaults to two, or `columns` when that is fewer. */
	narrowColumns?: number;
	/**
	 * Rows a closed grid shows at every width; the rest wait behind a Show
	 * All button, still in the page so a search engine reads them. Which
	 * items wait is decided from the column counts, so the server draws it.
	 */
	visibleRows?: number;
	/** The button's words while items wait. Defaults to "Show all". */
	showAllLabel?: string;
	/** The button's words while every item shows. Defaults to "Show fewer". */
	showFewerLabel?: string;
	minItemWidth?: never;
	stretch?: never;
}

/** Columns that fill the row: as many as fit at a least width. */
export interface GridLayoutByWidth extends GridLayoutBase {
	/** The least width of an item in pixels; the grid fits as many across as the row holds. */
	minItemWidth: number;
	/** Items stretch to fill the row when fewer than fit (`auto-fit`); by default the empty tracks stay (`auto-fill`). */
	stretch?: boolean;
	columns?: never;
	narrowColumns?: never;
	visibleRows?: never;
	showAllLabel?: never;
	showFewerLabel?: never;
}

export type GridLayoutProps = GridLayoutByColumns | GridLayoutByWidth;

/**
 * One aligned grid of anything. Columns are counted outright (`columns`,
 * `narrowColumns`) or fill the row at a least width (`minItemWidth`). With
 * counted columns, `visibleRows` holds a long grid to that many rows at every
 * width behind a Show All button: every item stays in the markup, and the
 * ones held back are hidden by the sheet at each width from the counts
 * alone, so nothing is measured and the server draws the closed grid. Hidden
 * items are not displayed, so they leave the tab order and the accessibility
 * tree until the grid opens; the button says which way it goes by
 * `aria-expanded`.
 */
export function GridLayout(props: GridLayoutProps) {
	const {
		children,
		gap,
		rules = false,
		as: Tag = "ul",
		ariaLabel,
		id,
		className,
		columns,
		narrowColumns,
		visibleRows,
		showAllLabel = "Show all",
		showFewerLabel = "Show fewer",
		minItemWidth,
		stretch = false,
	} = props;
	const fallbackID = useId();
	const gridID = id ?? `grid-layout${fallbackID.replace(/:/g, "")}`;
	const [open, setOpen] = useState(false);
	const items = Children.toArray(children);
	const Item = Tag === "ul" ? "li" : "div";

	const byColumns = columns != null;
	const wide = byColumns ? Math.max(1, Math.floor(columns)) : 0;
	const narrow = byColumns
		? Math.max(1, Math.floor(narrowColumns ?? defaultNarrowColumns(wide)))
		: 0;
	const rows = byColumns && visibleRows ? visibleRows : 0;
	const wideShown = shownCount(rows, wide);
	const narrowShown = shownCount(rows, narrow);
	const wideWaits = hiddenCount(items.length, rows, wide) > 0;
	const narrowWaits = hiddenCount(items.length, rows, narrow) > 0;

	const style = {
		...(gap ? { "--_grid-gap": gap } : {}),
		...(byColumns ? { "--_grid-cols": wide, "--_grid-cols-narrow": narrow } : {}),
		...(minItemWidth != null ? { "--_grid-min": `${minItemWidth}px` } : {}),
	} as CSSProperties;
	const classes = [
		"grid-layout",
		byColumns ? "by-columns" : "by-width",
		stretch && !byColumns && "stretch",
		rules && "has-rules",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<>
			<Tag
				className={classes}
				id={gridID}
				style={style}
				aria-label={ariaLabel}
				data-open={(rows > 0 && open) || undefined}
			>
				{items.map((item, at) => (
					<Item
						// biome-ignore lint/suspicious/noArrayIndexKey: the cells are fixed content in a fixed order
						key={at}
						data-past-wide={at >= wideShown || undefined}
						data-past-narrow={at >= narrowShown || undefined}
					>
						{item}
					</Item>
				))}
			</Tag>
			{(wideWaits || narrowWaits) && (
				<button
					type="button"
					className="grid-layout-more"
					aria-expanded={open}
					aria-controls={gridID}
					data-only={wideWaits && narrowWaits ? undefined : wideWaits ? "wide" : "narrow"}
					onClick={() => setOpen((current) => !current)}
				>
					{open ? showFewerLabel : showAllLabel}
				</button>
			)}
		</>
	);
}
