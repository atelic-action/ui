import { MARQUEE_SPEED, marqueeCopies, marqueeDuration } from "../../src/lib/marquee";

describe("marqueeCopies", () => {
	it("draws the seamless pair before anything is measured", () => {
		expect(marqueeCopies(0, 1280)).toBe(2);
		expect(marqueeCopies(1025, 0)).toBe(2);
		expect(marqueeCopies(Number.NaN, 1280)).toBe(2);
	});

	it("draws the pair when one row is wider than the band", () => {
		expect(marqueeCopies(1600, 1280)).toBe(2);
		expect(marqueeCopies(1280, 1280)).toBe(2);
	});

	it("draws one copy more than the band holds when a row is narrower", () => {
		// 1025 into 1280 is two rows to cover it, and one more to slide in.
		expect(marqueeCopies(1025, 1280)).toBe(3);
		expect(marqueeCopies(300, 1280)).toBe(6);
		expect(marqueeCopies(320, 1280)).toBe(5);
	});
});

describe("marqueeDuration", () => {
	it("is the row's width over the pace, so a longer row takes longer at the same speed", () => {
		expect(marqueeDuration(600, 60)).toBe(10);
		expect(marqueeDuration(1200, 60)).toBe(20);
		expect(marqueeDuration(1200, 120)).toBe(10);
	});

	it("reads a missing or broken pace as the default", () => {
		expect(marqueeDuration(600)).toBe(600 / MARQUEE_SPEED);
		expect(marqueeDuration(600, 0)).toBe(600 / MARQUEE_SPEED);
		expect(marqueeDuration(600, -5)).toBe(600 / MARQUEE_SPEED);
	});

	it("is 0 for a row not yet measured", () => {
		expect(marqueeDuration(0, 60)).toBe(0);
	});
});
