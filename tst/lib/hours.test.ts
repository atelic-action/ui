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
	// The mark joins with a no break space, so "pm" never wraps alone.
	it("formats morning times with their minutes and am", () => {
		expect(formatClock("07:00")).toBe("7:00\u00a0am");
		expect(formatClock("09:30")).toBe("9:30\u00a0am");
	});

	it("formats afternoon times with pm", () => {
		expect(formatClock("19:00")).toBe("7:00\u00a0pm");
		expect(formatClock("17:30")).toBe("5:30\u00a0pm");
	});

	it("formats noon and midnight correctly", () => {
		expect(formatClock("12:00")).toBe("12:00\u00a0pm");
		expect(formatClock("00:00")).toBe("12:00\u00a0am");
		expect(formatClock("12:00")).not.toContain(" ");
	});

	it("stays on the 12 hour clock when asked for it by name", () => {
		expect(formatClock("09:00", { clock: "12h" })).toBe("9:00\u00a0am");
	});

	it("prints the 24 hour clock with leading zeros", () => {
		expect(formatClock("09:00", { clock: "24h" })).toBe("09:00");
		expect(formatClock("17:00", { clock: "24h" })).toBe("17:00");
		expect(formatClock("9:30", { clock: "24h" })).toBe("09:30");
		expect(formatClock("00:00", { clock: "24h" })).toBe("00:00");
	});
});

describe("formatHoursRange", () => {
	it("formats an open row", () => {
		expect(formatHoursRange(monday)).toBe("11:00\u00a0am to 7:00\u00a0pm");
	});

	it("formats on the 24 hour clock", () => {
		const weekdays: OpeningHours = {
			label: "Monday to Friday",
			labelShort: "Mon to Fri",
			days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			opens: "09:00",
			closes: "17:00",
		};
		expect(formatHoursRange(weekdays, { clock: "24h" })).toBe("09:00 to 17:00");
		expect(formatHoursRange(weekdays, { clock: "12h" })).toBe("9:00\u00a0am to 5:00\u00a0pm");
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
		expect(formatHoursRange(byAppointment, { clock: "24h" })).toBe("By appointment");
	});
});

describe("isClosed", () => {
	it("detects open and closed rows", () => {
		expect(isClosed(monday)).toBe(false);
		expect(isClosed(weekend)).toBe(true);
	});
});
