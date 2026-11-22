import type { Decorator } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect } from "storybook/test";

/**
 * A mail client's column: 600 wide, or the screen's width when that is less,
 * the way a sent email's wrapping table answers its phone media query. The
 * email frame's own 680 column holds it. Its marker is the story harness's,
 * never the component's, so a story can find the column it set.
 */
export const MAIL_WIDTH = 600;

export function Column({ children }: { children?: ReactNode }) {
	return (
		<tr>
			<td align="center">
				<table
					role="presentation"
					cellPadding="0"
					cellSpacing="0"
					data-story-column=""
					style={{ width: "100%", maxWidth: `${MAIL_WIDTH}px`, tableLayout: "auto" }}
				>
					<tbody>{children}</tbody>
				</table>
			</td>
		</tr>
	);
}

/**
 * The decorator form of `Column`, for a meta. A story that shows a whole
 * document on its own sets `parameters.noColumn`, since a story's
 * `decorators: []` adds to the meta's and never replaces them.
 */
export const inColumn: Decorator = (Story, context) =>
	context.parameters.noColumn ? (
		<Story />
	) : (
		<Column>
			<Story />
		</Column>
	);

/** The column a story set, by its harness marker. */
export function columnOf(canvasElement: HTMLElement): HTMLElement {
	const column = canvasElement.querySelector<HTMLElement>("[data-story-column]");
	if (!column) throw new Error("The story has no mail column; decorate it with inColumn.");
	return column;
}

/**
 * The piece fits the column: a table grows past its width when what is in it
 * will not wrap, so the column's own width is the test. Nothing inside
 * reaches past its right edge, no block's words run out past its own box
 * (text that overflows a cell moves no element's edge), and the page never
 * scrolls sideways.
 */
export async function fitsTheColumn(canvasElement: HTMLElement) {
	const column = columnOf(canvasElement);
	const box = column.getBoundingClientRect();
	// The email frame pads the page by 12px a side (.storybook/decorators.tsx).
	const room = Math.min(MAIL_WIDTH, window.innerWidth - 24);
	await expect(Math.round(box.width)).toBeLessThanOrEqual(room);
	const widest = Math.max(
		...Array.from(column.querySelectorAll("*")).map(
			(element) => element.getBoundingClientRect().right,
		),
	);
	await expect(widest).toBeLessThanOrEqual(box.right + 0.5);
	const spilling = Array.from(column.querySelectorAll<HTMLElement>("*")).filter(
		(element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1,
	);
	await expect(spilling.map((element) => element.textContent?.slice(0, 40))).toEqual([]);
	await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
}
