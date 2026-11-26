/**
 * The calendar a request for a day and a time is held to: which days a
 * business works, how far out the first day is, and the times offered on a
 * day. One implementation, read by the form in the browser and by the
 * endpoint on the server, so a day the form offers is a day the endpoint
 * takes and a forged or stale one is refused by the same rule.
 *
 * A day is written `2026-11-25` and a time `09:30`, both on the business's
 * own clock. Arithmetic on days is arithmetic on the calendar, the same in
 * every timezone; the one question that needs a timezone is what day it is
 * now, which `dayIn` answers in the business's named IANA zone, so a server
 * in UTC and a browser in Denver agree. `zonedInstant` turns a day and a
 * time on that clock into an instant with the zone's offset for that date.
 *
 * A business day is Monday to Friday, less the United States federal
 * holidays on the days they are observed (when `holidays` is on, which it is
 * by default) and any day the business lists as closed.
 *
 * Built with the gate (`@atelic-action/ui/forms/calendar`): plain
 * TypeScript, no React, relative imports carrying `.js`.
 */

/** A business's calendar: its clock, its working day, and how far out a request may ask. */
export interface CalendarRules {
	/** The business's IANA timezone, "America/Denver". */
	timeZone: string;
	/** When the office day opens, "08:00". */
	open: string;
	/** When it closes, "17:00": an appointment must finish by then. */
	close: string;
	/** The step between the times offered, in minutes. Defaults to 30. */
	slotMinutes?: number;
	/** How many business days out the first day is. Defaults to 2. */
	leadBusinessDays?: number;
	/** Whether the United States federal holidays are left out. Defaults to true. */
	holidays?: boolean;
	/** Any other day the business is shut, "2026-11-27". */
	closedDays?: string[];
	/** How many days past the first day the last one is. Defaults to 60. */
	horizonDays?: number;
}

export const DEFAULT_SLOT_MINUTES = 30;
export const DEFAULT_LEAD_BUSINESS_DAYS = 2;
export const DEFAULT_HORIZON_DAYS = 60;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MS_PER_DAY = 86_400_000;

/** The day's calendar date as UTC midnight, or null for a day that is not one. */
function utc(day: string): Date | null {
	const match = DAY_PATTERN.exec(day);
	if (!match) return null;
	const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const at = new Date(Date.UTC(year, month - 1, date));
	// 2026-02-30 rolls into March; a day that rolls is not a day.
	if (at.getUTCFullYear() !== year || at.getUTCMonth() !== month - 1 || at.getUTCDate() !== date) {
		return null;
	}
	return at;
}

function iso(at: Date): string {
	return at.toISOString().slice(0, 10);
}

/** Whether a string is a real calendar day written `2026-11-25`. */
export function isDay(day: string): boolean {
	return utc(day) !== null;
}

/** The day `count` days after `day` (before it, for a negative count). */
export function addDays(day: string, count: number): string {
	const at = utc(day);
	if (!at) throw new RangeError(`addDays: "${day}" is not a day`);
	return iso(new Date(at.getTime() + count * MS_PER_DAY));
}

/** The day of the week, 0 for Sunday to 6 for Saturday. */
export function weekday(day: string): number {
	const at = utc(day);
	if (!at) throw new RangeError(`weekday: "${day}" is not a day`);
	return at.getUTCDay();
}

/** How many days `to` is after `from`. */
export function daysBetween(from: string, to: string): number {
	const a = utc(from);
	const b = utc(to);
	if (!a || !b) throw new RangeError("daysBetween: both must be days");
	return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** One federal holiday, on the day it is observed. */
export interface Holiday {
	day: string;
	name: string;
}

function ymd(year: number, month: number, date: number): string {
	return iso(new Date(Date.UTC(year, month - 1, date)));
}

/** The nth given weekday of a month: the third Monday of January. */
function nth(year: number, month: number, dow: number, n: number): string {
	const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	return ymd(year, month, 1 + ((dow - first + 7) % 7) + (n - 1) * 7);
}

/** The last given weekday of a month: the last Monday of May. */
function last(year: number, month: number, dow: number): string {
	const end = new Date(Date.UTC(year, month, 0));
	const back = (end.getUTCDay() - dow + 7) % 7;
	return ymd(year, month, end.getUTCDate() - back);
}

/**
 * A holiday fixed to a date, on the day it is observed: one that falls on a
 * Saturday is kept the Friday before, one on a Sunday the Monday after
 * (5 U.S.C. 6103 and the executive order that applies it).
 */
function fixed(year: number, month: number, date: number): string {
	const day = ymd(year, month, date);
	const dow = weekday(day);
	if (dow === 6) return addDays(day, -1);
	if (dow === 0) return addDays(day, 1);
	return day;
}

/**
 * The United States federal holidays of a year, each on the day it is
 * observed. New Year's Day on a Saturday is observed on December 31 of the
 * year before, so that day is in the earlier year's list, named for the new
 * year. Juneteenth is a holiday from 2021.
 */
export function federalHolidays(year: number): Holiday[] {
	const days: Holiday[] = [
		{ day: fixed(year, 1, 1), name: "New Year's Day" },
		{ day: nth(year, 1, 1, 3), name: "Martin Luther King Jr. Day" },
		{ day: nth(year, 2, 1, 3), name: "Washington's Birthday" },
		{ day: last(year, 5, 1), name: "Memorial Day" },
		...(year >= 2021 ? [{ day: fixed(year, 6, 19), name: "Juneteenth" }] : []),
		{ day: fixed(year, 7, 4), name: "Independence Day" },
		{ day: nth(year, 9, 1, 1), name: "Labor Day" },
		{ day: nth(year, 10, 1, 2), name: "Columbus Day" },
		{ day: fixed(year, 11, 11), name: "Veterans Day" },
		{ day: nth(year, 11, 4, 4), name: "Thanksgiving Day" },
		{ day: fixed(year, 12, 25), name: "Christmas Day" },
	];
	// The next New Year's Day, when it is observed on this year's December 31.
	const next = fixed(year + 1, 1, 1);
	if (next.startsWith(`${year}-`)) days.push({ day: next, name: "New Year's Day" });
	// This year's, when it was observed on the December 31 before, belongs there.
	return days.filter((holiday) => holiday.day.startsWith(`${year}-`));
}

/** The federal holiday observed on a day, or undefined. */
export function holidayOn(day: string): Holiday | undefined {
	const year = Number(day.slice(0, 4));
	return federalHolidays(year).find((holiday) => holiday.day === day);
}

/** Why a day is not a working day, or null when it is one. */
export type ClosedReason = "weekend" | "holiday" | "closed";

/** Why the business does not work a day, or null when it does. */
export function closedReason(day: string, rules: CalendarRules): ClosedReason | null {
	const dow = weekday(day);
	if (dow === 0 || dow === 6) return "weekend";
	if (rules.closedDays?.includes(day)) return "closed";
	if ((rules.holidays ?? true) && holidayOn(day)) return "holiday";
	return null;
}

/** Whether the business works a day: Monday to Friday, less its holidays and closed days. */
export function isWorkingDay(day: string, rules: CalendarRules): boolean {
	return closedReason(day, rules) === null;
}

/** The working day `count` working days after `day`. */
export function addBusinessDays(day: string, count: number, rules: CalendarRules): string {
	let at = day;
	let left = count;
	// A year of days is past any count a business sets; the bound stops a
	// calendar with every day closed from spinning.
	for (let guard = 0; left > 0 && guard < 3660; guard++) {
		at = addDays(at, 1);
		if (isWorkingDay(at, rules)) left--;
	}
	return at;
}

/** What day it is now on the business's clock. */
export function dayIn(timeZone: string, now: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const part = (type: string) => parts.find((one) => one.type === type)?.value ?? "";
	return `${part("year")}-${part("month")}-${part("day")}`;
}

/** The first day a request made on `today` may ask for. */
export function firstDay(today: string, rules: CalendarRules): string {
	return addBusinessDays(today, rules.leadBusinessDays ?? DEFAULT_LEAD_BUSINESS_DAYS, rules);
}

/** The last day a request made on `today` may ask for. */
export function lastDay(today: string, rules: CalendarRules): string {
	return addDays(firstDay(today, rules), rules.horizonDays ?? DEFAULT_HORIZON_DAYS);
}

/** What the calendar makes of a day asked for on `today`. */
export type DayVerdict =
	| { ok: true }
	| { ok: false; reason: "invalid" }
	| { ok: false; reason: "weekend" | "closed" }
	| { ok: false; reason: "holiday"; holiday: string }
	| { ok: false; reason: "tooSoon" | "tooFar"; bound: string };

/**
 * Whether a day may be asked for on `today`, and why not when it may not:
 * a day that is not one, a weekend, a federal holiday, a day the business
 * lists as closed, a day before the first day, or one past the last.
 */
export function checkDay(day: string, today: string, rules: CalendarRules): DayVerdict {
	if (!isDay(day)) return { ok: false, reason: "invalid" };
	const reason = closedReason(day, rules);
	if (reason === "holiday") {
		return { ok: false, reason, holiday: holidayOn(day)?.name ?? "a holiday" };
	}
	if (reason) return { ok: false, reason };
	const first = firstDay(today, rules);
	if (day < first) return { ok: false, reason: "tooSoon", bound: first };
	const end = addDays(first, rules.horizonDays ?? DEFAULT_HORIZON_DAYS);
	if (day > end) return { ok: false, reason: "tooFar", bound: end };
	return { ok: true };
}

/** A time written `09:30` as minutes after midnight, or null for one that is not a time. */
export function minutesOf(time: string): number | null {
	const match = TIME_PATTERN.exec(time);
	return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Minutes after midnight written as a time, `09:30`. */
export function timeOf(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * The times offered on a working day for an appointment `length` minutes
 * long: every `slotMinutes` from opening, the last one early enough that the
 * appointment finishes by closing. An office whose hours do not read as
 * times offers none.
 */
export function timeSlots(rules: CalendarRules, length: number): string[] {
	const open = minutesOf(rules.open);
	const close = minutesOf(rules.close);
	const step = rules.slotMinutes ?? DEFAULT_SLOT_MINUTES;
	if (open === null || close === null || step <= 0 || length <= 0) return [];
	const times: string[] = [];
	for (let at = open; at + length <= close; at += step) times.push(timeOf(at));
	return times;
}

/** Whether a time is one the calendar offers for an appointment `length` minutes long. */
export function isOfferedTime(time: string, rules: CalendarRules, length: number): boolean {
	return timeSlots(rules, length).includes(time);
}

/** The zone's offset from UTC at an instant, in minutes (Denver in winter is -420). */
function offsetAt(timeZone: string, instant: number): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		hourCycle: "h23",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(new Date(instant));
	const part = (type: string) => Number(parts.find((one) => one.type === type)?.value ?? 0);
	const wall = Date.UTC(
		part("year"),
		part("month") - 1,
		part("day"),
		part("hour") % 24,
		part("minute"),
		part("second"),
	);
	return Math.round((wall - Math.floor(instant / 1000) * 1000) / 60_000);
}

function offsetText(minutes: number): string {
	const sign = minutes < 0 ? "-" : "+";
	const whole = Math.abs(minutes);
	return `${sign}${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * A day and a time on the business's clock as an ISO 8601 instant carrying
 * the zone's offset for that date: `2026-12-02T09:00:00-07:00` in Denver in
 * winter, `-06:00` in summer. `minutesLater` moves the time on first (the
 * appointment's end), across midnight if it must.
 */
export function zonedInstant(
	day: string,
	time: string,
	timeZone: string,
	minutesLater = 0,
): string {
	const start = utc(day);
	const minutes = minutesOf(time);
	if (!start || minutes === null) throw new RangeError("zonedInstant: a day and a time are needed");
	const total = minutes + minutesLater;
	const wall = start.getTime() + total * 60_000;
	// The offset is read twice: once at the wall clock taken as UTC, then at
	// the instant that gives, which settles a date whose offset changes.
	let offset = offsetAt(timeZone, wall);
	const second = offsetAt(timeZone, wall - offset * 60_000);
	if (second !== offset) offset = second;
	const localDay = iso(new Date(start.getTime() + Math.floor(total / 1440) * MS_PER_DAY));
	const localTime = timeOf(((total % 1440) + 1440) % 1440);
	return `${localDay}T${localTime}:00${offsetText(offset)}`;
}

/** Whether a name is an IANA timezone this runtime knows. */
export function isTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone });
		return true;
	} catch {
		return false;
	}
}

/** The zone's short name on a day, "MST" or "MDT", for a line the office reads. */
export function zoneName(day: string, time: string, timeZone: string): string {
	const instant = Date.parse(zonedInstant(day, time, timeZone));
	const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(
		new Date(instant),
	);
	return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
}

/** "Wednesday, December 2": a day as a person reads it. */
export function longDayLabel(day: string): string {
	const at = utc(day);
	if (!at) return day;
	return at.toLocaleDateString("en-US", {
		timeZone: "UTC",
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

/** "Wed, Dec 2": a day in the room of a phone's bar. */
export function shortDayLabel(day: string): string {
	const at = utc(day);
	if (!at) return day;
	return at.toLocaleDateString("en-US", {
		timeZone: "UTC",
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

/** "December 2026": a month as its calendar heads it, from any day in it. */
export function monthLabel(day: string): string {
	const at = utc(day);
	if (!at) return day;
	return at.toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: "numeric" });
}

/**
 * "9:00 am": a time as a person reads it, the mark joined by a no break
 * space so it never breaks before it, as the package's hours print.
 */
export function clockLabel(time: string): string {
	const minutes = minutesOf(time);
	if (minutes === null) return time;
	const hours = Math.floor(minutes / 60);
	const mark = hours >= 12 ? "pm" : "am";
	return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${mark}`;
}
