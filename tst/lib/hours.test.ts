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
});

describe("formatHoursRange", () => {
	it("formats an open row", () => {
		expect(formatHoursRange(monday)).toBe("11:00a to 7:00p");
	});

	it("formats compactly in short mode", () => {
		expect(formatHoursRange(monday, { short: true })).toBe("11a to 7p");
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
