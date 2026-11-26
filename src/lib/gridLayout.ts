/**
 * The arithmetic behind `GridLayout`'s Show All: which items a closed grid
 * holds back at a column count. It is decided from the count alone, never by
 * measuring the page, so the server draws the same grid the browser does.
 */

/** How many items a closed grid shows at a column count: every cell of its visible rows. */
export function shownCount(visibleRows: number, columns: number): number {
	if (!(Math.floor(visibleRows) > 0) || !(Math.floor(columns) > 0)) return Number.POSITIVE_INFINITY;
	return Math.floor(visibleRows) * Math.floor(columns);
}

/** How many items a closed grid holds back behind Show All at a column count. */
export function hiddenCount(itemCount: number, visibleRows: number, columns: number): number {
	return Math.max(0, itemCount - shownCount(visibleRows, columns));
}

/**
 * The narrow screen's column count when a grid is given none: two, or the
 * wide count when that is fewer, so a short list keeps its shape on a phone.
 */
export function defaultNarrowColumns(columns: number): number {
	return Math.max(1, Math.min(Math.floor(columns), 2));
}
