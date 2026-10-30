import { render } from "@testing-library/react";
import { SplitSection } from "../../src/sections/SplitSection";

/*
 * The ratio is the whole of the layout contract: each value names a class the
 * sheet sizes the columns from, and the media ratio is the one a frame inside
 * it is held to the column's edge by. Lock the class each value renders.
 */
describe("SplitSection", () => {
	it("renders the even ratio when none is given", () => {
		const { container } = render(<SplitSection left="Copy" right="More copy" />);
		const grid = container.querySelector(".split");
		expect(grid?.classList.contains("ratio-even")).toBe(true);
	});

	it.each(["narrow-first", "media"] as const)("renders the %s ratio class", (ratio) => {
		const { container } = render(<SplitSection ratio={ratio} left="Shot" right="Copy" />);
		const grid = container.querySelector(".split");
		expect(grid?.classList.contains(`ratio-${ratio}`)).toBe(true);
		expect(grid?.children).toHaveLength(2);
	});
});
