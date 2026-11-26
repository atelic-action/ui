// @vitest-environment node
import {
	addBusinessDays,
	type CalendarRules,
	checkDay,
	clockLabel,
	dayIn,
	federalHolidays,
	firstDay,
	holidayOn,
	isDay,
	isOfferedTime,
	isWorkingDay,
	lastDay,
	longDayLabel,
	timeSlots,
	zonedInstant,
	zoneName,
} from "../../src/forms/calendar";

const RULES: CalendarRules = { timeZone: "America/Denver", open: "08:00", close: "17:00" };

describe("the federal holidays", () => {
	it("lists the eleven of 2026 on the days they are observed", () => {
		expect(federalHolidays(2026).map((holiday) => holiday.day)).toEqual([
			"2026-01-01",
			"2026-01-19",
			"2026-02-16",
			"2026-05-25",
			"2026-06-19",
			// Independence Day falls on a Saturday and is kept the Friday before.
			"2026-07-03",
			"2026-09-07",
			"2026-10-12",
			"2026-11-11",
			"2026-11-26",
			"2026-12-25",
		]);
	});

	it("keeps a Sunday holiday on the Monday after", () => {
		expect(holidayOn("2021-07-05")?.name).toBe("Independence Day");
		expect(holidayOn("2022-06-20")?.name).toBe("Juneteenth");
		expect(holidayOn("2021-07-04")).toBeUndefined();
	});

	it("keeps a Saturday holiday on the Friday before", () => {
		expect(holidayOn("2027-06-18")?.name).toBe("Juneteenth");
		expect(holidayOn("2027-12-24")?.name).toBe("Christmas Day");
		expect(holidayOn("2027-12-25")).toBeUndefined();
	});

	it("observes a Saturday New Year's Day on the December 31 before", () => {
		expect(holidayOn("2021-12-31")?.name).toBe("New Year's Day");
		expect(holidayOn("2022-01-01")).toBeUndefined();
		expect(federalHolidays(2022).some((holiday) => holiday.name === "New Year's Day")).toBe(false);
	});

	it("has no Juneteenth before 2021", () => {
		expect(federalHolidays(2020).some((holiday) => holiday.name === "Juneteenth")).toBe(false);
	});
});

describe("the working days", () => {
	it("is Monday to Friday, less the holidays and the closed days", () => {
		expect(isWorkingDay("2026-11-25", RULES)).toBe(true);
		expect(isWorkingDay("2026-11-28", RULES)).toBe(false);
		expect(isWorkingDay("2026-11-29", RULES)).toBe(false);
		expect(isWorkingDay("2026-11-26", RULES)).toBe(false);
		expect(isWorkingDay("2026-11-27", { ...RULES, closedDays: ["2026-11-27"] })).toBe(false);
	});

	it("keeps the holidays when told to leave them in", () => {
		expect(isWorkingDay("2026-11-26", { ...RULES, holidays: false })).toBe(true);
	});

	it("counts business days past a weekend and a holiday", () => {
		// Wednesday before Thanksgiving: Friday is one, the Monday after is two.
		expect(addBusinessDays("2026-11-25", 2, RULES)).toBe("2026-11-30");
		expect(firstDay("2026-11-25", RULES)).toBe("2026-11-30");
		// With the Friday after closed too, the first day is the Tuesday.
		expect(firstDay("2026-11-25", { ...RULES, closedDays: ["2026-11-27"] })).toBe("2026-12-01");
		expect(firstDay("2026-11-25", { ...RULES, leadBusinessDays: 0 })).toBe("2026-11-25");
	});

	it("runs the calendar sixty days past the first day by default", () => {
		expect(lastDay("2026-11-25", RULES)).toBe("2027-01-29");
		expect(lastDay("2026-11-25", { ...RULES, horizonDays: 14 })).toBe("2026-12-14");
	});
});

describe("checkDay", () => {
	const today = "2026-11-25";

	it("takes an open day between the first and the last", () => {
		expect(checkDay("2026-12-02", today, RULES)).toEqual({ ok: true });
		expect(checkDay("2026-11-30", today, RULES)).toEqual({ ok: true });
	});

	it("refuses each kind of day by name", () => {
		expect(checkDay("2026-12-05", today, RULES)).toEqual({ ok: false, reason: "weekend" });
		expect(checkDay("2026-12-25", today, RULES)).toEqual({
			ok: false,
			reason: "holiday",
			holiday: "Christmas Day",
		});
		expect(checkDay("2026-12-03", today, { ...RULES, closedDays: ["2026-12-03"] })).toEqual({
			ok: false,
			reason: "closed",
		});
		expect(checkDay("2026-11-27", today, RULES)).toEqual({
			ok: false,
			reason: "tooSoon",
			bound: "2026-11-30",
		});
		expect(checkDay("2027-02-01", today, RULES)).toEqual({
			ok: false,
			reason: "tooFar",
			bound: "2027-01-29",
		});
	});

	it("refuses what is not a day", () => {
		for (const day of ["2026-02-30", "12/02/2026", "2026-12-2", "", "tomorrow"]) {
			expect(checkDay(day, today, RULES)).toEqual({ ok: false, reason: "invalid" });
		}
		expect(isDay("2028-02-29")).toBe(true);
		expect(isDay("2027-02-29")).toBe(false);
	});
});

describe("the times offered", () => {
	it("steps every half hour from opening, the last one finishing by closing", () => {
		const half = timeSlots(RULES, 30);
		expect(half[0]).toBe("08:00");
		expect(half.at(-1)).toBe("16:30");
		expect(half).toHaveLength(18);
		expect(timeSlots(RULES, 60).at(-1)).toBe("16:00");
		expect(timeSlots(RULES, 20).at(-1)).toBe("16:30");
	});

	it("follows the step and the hours a business sets", () => {
		expect(timeSlots({ ...RULES, open: "09:30", close: "11:00", slotMinutes: 15 }, 30)).toEqual([
			"09:30",
			"09:45",
			"10:00",
			"10:15",
			"10:30",
		]);
	});

	it("offers nothing off the grid or past closing", () => {
		expect(isOfferedTime("09:00", RULES, 30)).toBe(true);
		expect(isOfferedTime("09:15", RULES, 30)).toBe(false);
		expect(isOfferedTime("16:30", RULES, 60)).toBe(false);
		expect(isOfferedTime("07:30", RULES, 30)).toBe(false);
		expect(isOfferedTime("9:00", RULES, 30)).toBe(false);
	});
});

describe("the business's clock", () => {
	it("reads today in the business's zone, whatever the server's", () => {
		// 05:00 UTC on the 26th is 22:00 on the 25th in Denver.
		const late = new Date("2026-11-26T05:00:00Z");
		expect(dayIn("America/Denver", late)).toBe("2026-11-25");
		expect(dayIn("UTC", late)).toBe("2026-11-26");
		expect(dayIn("Asia/Kolkata", new Date("2026-11-25T19:00:00Z"))).toBe("2026-11-26");
	});

	it("writes a day and a time as an instant with the offset for that date", () => {
		expect(zonedInstant("2026-12-02", "09:00", "America/Denver")).toBe("2026-12-02T09:00:00-07:00");
		expect(zonedInstant("2026-07-01", "09:00", "America/Denver")).toBe("2026-07-01T09:00:00-06:00");
		// The days the clocks change.
		expect(zonedInstant("2026-03-08", "09:00", "America/Denver")).toBe("2026-03-08T09:00:00-06:00");
		expect(zonedInstant("2026-11-01", "09:00", "America/Denver")).toBe("2026-11-01T09:00:00-07:00");
		expect(zonedInstant("2026-12-02", "09:00", "Asia/Kolkata")).toBe("2026-12-02T09:00:00+05:30");
		expect(zonedInstant("2026-12-02", "09:00", "UTC")).toBe("2026-12-02T09:00:00+00:00");
	});

	it("names the same instant whichever zone the runtime is in", () => {
		const instant = Date.parse(zonedInstant("2026-12-02", "09:00", "America/Denver"));
		expect(new Date(instant).toISOString()).toBe("2026-12-02T16:00:00.000Z");
	});

	it("moves the end on by the length, across midnight when it must", () => {
		expect(zonedInstant("2026-12-02", "09:00", "America/Denver", 30)).toBe(
			"2026-12-02T09:30:00-07:00",
		);
		expect(zonedInstant("2026-12-02", "23:30", "America/Denver", 60)).toBe(
			"2026-12-03T00:30:00-07:00",
		);
	});

	it("names the zone as the office reads it", () => {
		expect(zoneName("2026-12-02", "09:00", "America/Denver")).toBe("MST");
		expect(zoneName("2026-07-01", "09:00", "America/Denver")).toBe("MDT");
	});
});

describe("the words", () => {
	it("reads a day and a time as a person does", () => {
		expect(longDayLabel("2026-12-02")).toBe("Wednesday, December 2");
		expect(clockLabel("09:00")).toBe("9:00 am");
		expect(clockLabel("12:30")).toBe("12:30 pm");
		expect(clockLabel("16:30")).toBe("4:30 pm");
	});
});
