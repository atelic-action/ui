import { defaultNarrowColumns, hiddenCount, shownCount } from "../../src/lib/gridLayout";

describe("the grid's held back items", () => {
	it("shows every cell of the visible rows", () => {
		expect(shownCount(5, 3)).toBe(15);
		expect(shownCount(5, 2)).toBe(10);
	});

	it("holds back what the rows do not hold, at each column count", () => {
		expect(hiddenCount(20, 5, 3)).toBe(5);
		expect(hiddenCount(20, 5, 2)).toBe(10);
		expect(hiddenCount(12, 5, 3)).toBe(0);
		expect(hiddenCount(12, 5, 2)).toBe(2);
	});

	it("holds nothing back with no visible rows set", () => {
		expect(shownCount(0, 3)).toBe(Number.POSITIVE_INFINITY);
		expect(hiddenCount(40, 0, 3)).toBe(0);
	});

	it("sets two narrow columns, or fewer when the wide count is fewer", () => {
		expect(defaultNarrowColumns(4)).toBe(2);
		expect(defaultNarrowColumns(3)).toBe(2);
		expect(defaultNarrowColumns(1)).toBe(1);
	});
});
