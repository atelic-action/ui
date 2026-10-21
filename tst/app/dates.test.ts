import { describe, expect, it } from "vitest";
import { formatISODate, localTimeZone, monthDay, todayISO } from "../../src/app/lib/dates";

describe("todayISO", () => {
	it("reads the local date parts, never the UTC instant", () => {
		// 23:30 local on Aug 30 is already Aug 31 in UTC for any zone west of it;
		// the local date is the one the user is standing in.
		expect(todayISO(new Date(2026, 7, 30, 23, 30))).toBe("2026-08-30");
	});

	it("pads the month and the day", () => {
		expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("localTimeZone", () => {
	it("names the zone the runtime is in", () => {
		expect(localTimeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
	});
});

describe("formatISODate", () => {
	it("formats without shifting a day", () => {
		expect(formatISODate("2026-06-08")).toBe("Jun 8, 2026");
	});

	it("passes an unreadable value through and a missing one as null", () => {
		expect(formatISODate("nonsense")).toBe("nonsense");
		expect(formatISODate(null)).toBeNull();
	});
});

describe("monthDay", () => {
	it("drops the year", () => {
		expect(monthDay("2026-08-30")).toBe("Aug 30");
	});

	it("is null on a bad or absent input", () => {
		expect(monthDay("2026-13-01")).toBeNull();
		expect(monthDay(null)).toBeNull();
	});
});
