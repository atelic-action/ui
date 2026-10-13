import { describe, expect, it } from "vitest";
import {
	fmtTimeShort,
	formatTimeOfDay,
	partOfDay,
	relDay,
	shortDate,
} from "../../src/app/lib/format";

describe("format", () => {
	it("fmtTimeShort keeps hours only when there are some", () => {
		expect(fmtTimeShort(5 * 60)).toBe("5m");
		expect(fmtTimeShort(3600 + 7 * 60)).toBe("1:07");
	});

	it("relDay phrases a date against a fixed now", () => {
		const now = new Date(2026, 8, 7, 12, 0, 0);
		expect(relDay(new Date(2026, 8, 7, 6).toISOString(), now)).toBe("today");
		expect(relDay(new Date(2026, 8, 6, 22).toISOString(), now)).toBe("yesterday");
		expect(relDay(new Date(2026, 8, 3, 9).toISOString(), now)).toBe("Thursday");
		expect(relDay(new Date(2026, 7, 20, 9).toISOString(), now)).toBe("Aug 20");
	});

	it("partOfDay follows the clock", () => {
		expect(partOfDay(new Date(2026, 8, 7, 3))).toBe("Late night");
		expect(partOfDay(new Date(2026, 8, 7, 9))).toBe("Morning");
		expect(partOfDay(new Date(2026, 8, 7, 14))).toBe("Afternoon");
		expect(partOfDay(new Date(2026, 8, 7, 19))).toBe("Evening");
		expect(partOfDay(new Date(2026, 8, 7, 22))).toBe("Tonight");
	});

	it("shortDate and formatTimeOfDay read a local ISO instant", () => {
		const at = new Date(2026, 8, 7, 9, 38).toISOString();
		expect(shortDate(at)).toBe("Sep 7");
		expect(formatTimeOfDay(at)).toBe("9:38 am");
	});

	it("reads a date only string as a local day, not UTC midnight", () => {
		expect(relDay("2026-10-13", new Date(2026, 9, 13, 12))).toBe("today");
		expect(shortDate("2026-06-08")).toBe("Jun 8");
	});
});
