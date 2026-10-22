import { describe, expect, it } from "vitest";
import { formatClock, formatHoursRange, isClosed } from "../../src/lib/hours";
import type { OpeningHours } from "../../src/sections/siteConfig";

const monday: OpeningHours = {
	label: "Monday",
	labelShort: "Mon",
	days: ["Monday"],
	opens: "11:00",
	closes: "19:00",
};

const weekend: OpeningHours = {
	label: "Friday to Sunday",
	labelShort: "Fri to Sun",
	days: [],
};

describe("formatClock", () => {
	it("formats morning times", () => {
		expect(formatClock("07:00")).toBe("7:00a");
	});

	it("formats afternoon times", () => {
		expect(formatClock("19:00")).toBe("7:00p");
	});

	it("formats noon and midnight correctly", () => {
		expect(formatClock("12:00")).toBe("12:00p");
		expect(formatClock("00:00")).toBe("12:00a");
	});

	it("drops minutes on whole hours in short mode", () => {
		expect(formatClock("11:00", { short: true })).toBe("11a");
		expect(formatClock("15:30", { short: true })).toBe("3:30p");
	});

	it("stays on the 12 hour clock when asked for it by name", () => {
		expect(formatClock("09:00", { clock: "12h" })).toBe("9:00a");
		expect(formatClock("17:00", { short: true, clock: "12h" })).toBe("5p");
	});

	it("prints the 24 hour clock with leading zeros, short or not", () => {
		expect(formatClock("09:00", { clock: "24h" })).toBe("09:00");
		expect(formatClock("17:00", { clock: "24h" })).toBe("17:00");
		expect(formatClock("9:30", { clock: "24h" })).toBe("09:30");
		expect(formatClock("00:00", { clock: "24h" })).toBe("00:00");
		expect(formatClock("12:00", { short: true, clock: "24h" })).toBe("12:00");
	});
});

describe("formatHoursRange", () => {
	it("formats an open row", () => {
		expect(formatHoursRange(monday)).toBe("11:00a to 7:00p");
	});

	it("formats compactly in short mode", () => {
		expect(formatHoursRange(monday, { short: true })).toBe("11a to 7p");
	});

	it("formats on the 24 hour clock, and short changes nothing there", () => {
		const weekdays: OpeningHours = {
			label: "Monday to Friday",
			labelShort: "Mon to Fri",
			days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			opens: "09:00",
			closes: "17:00",
		};
		expect(formatHoursRange(weekdays, { clock: "24h" })).toBe("09:00 to 17:00");
		expect(formatHoursRange(weekdays, { short: true, clock: "24h" })).toBe("09:00 to 17:00");
		expect(formatHoursRange(weekdays, { short: true, clock: "12h" })).toBe("9a to 5p");
		expect(formatHoursRange(weekend, { clock: "24h" })).toBe("Closed");
	});

	it("returns Closed for closed rows", () => {
		expect(formatHoursRange(weekend)).toBe("Closed");
	});

	it("renders the note for time-less rows that carry one", () => {
		const byAppointment: OpeningHours = {
			label: "Monday to Sunday",
			labelShort: "Every day",
			days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
			note: "By appointment",
		};
		expect(formatHoursRange(byAppointment)).toBe("By appointment");
		expect(formatHoursRange(byAppointment, { short: true })).toBe("By appointment");
	});
});

describe("isClosed", () => {
	it("detects open and closed rows", () => {
		expect(isClosed(monday)).toBe(false);
		expect(isClosed(weekend)).toBe(true);
	});
});
