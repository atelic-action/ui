import { describe, expect, it } from "vitest";
import { formatIsoDate, localTimeZone, monthDay, todayIso } from "../../src/app/lib/dates";

describe("todayIso", () => {
	it("reads the local date parts, never the UTC instant", () => {
		// 23:30 local on Aug 30 is already Aug 31 in UTC for any zone west of it;
		// the local date is the one the user is standing in.
		expect(todayIso(new Date(2026, 7, 30, 23, 30))).toBe("2026-08-30");
	});

	it("pads the month and the day", () => {
		expect(todayIso(new Date(2026, 0, 5))).toBe("2026-01-05");
	});
});

describe("localTimeZone", () => {
	it("names the zone the runtime is in", () => {
		expect(localTimeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
	});
});

describe("formatIsoDate", () => {
	it("formats without shifting a day", () => {
		expect(formatIsoDate("2026-06-08")).toBe("Jun 8, 2026");
	});

	it("passes an unreadable value through and a missing one as null", () => {
		expect(formatIsoDate("nonsense")).toBe("nonsense");
		expect(formatIsoDate(null)).toBeNull();
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
