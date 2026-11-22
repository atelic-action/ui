/** Where an element's words begin on screen, whatever padding its box carries. */
export function textLeft(element: Element) {
	const range = document.createRange();
	range.selectNodeContents(element);
	return Math.min(...Array.from(range.getClientRects()).map((rect) => rect.left));
}

/** How many lines an element's words run to. */
export function lines(element: Element) {
	const range = document.createRange();
	range.selectNodeContents(element);
	return new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))).size;
}
