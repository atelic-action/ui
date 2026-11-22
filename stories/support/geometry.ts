import { expect } from "storybook/test";

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

/** The page never scrolls sideways: the check every phone story ends on. */
export async function expectNoSidewaysScroll() {
	await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
}

/**
 * Every word of an element's text that the browser broke across two lines,
 * read from the text's own line boxes: a word whose characters sit on more
 * than one line was broken inside itself. Spaces are where a line may end;
 * anything else broken is a word cut in two.
 */
export function brokenWords(element: Element): string[] {
	const broken: string[] = [];
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const text = node.textContent ?? "";
		for (const match of text.matchAll(/\S+/g)) {
			const range = document.createRange();
			range.setStart(node, match.index);
			range.setEnd(node, match.index + match[0].length);
			const tops = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top)));
			if (tops.size > 1) broken.push(match[0]);
		}
	}
	return broken;
}
