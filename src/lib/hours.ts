import type { Clock, OpeningHours } from "../sections/siteConfig";

/** How a time prints: `short` drops a whole hour's minutes on the 12 hour clock. */
export interface ClockOptions {
	short?: boolean;
	/** "12h" (the default) or "24h"; see `SiteConfig.clock`. */
	clock?: Clock;
}

/**
 * Formats a 24 hour "HH:MM" time as the display style used across the
 * marketing components: "11:00" -> "11:00a", "19:00" -> "7:00p".
 * With short: true, whole hours drop their minutes: "11a", "7p".
 * With clock: "24h", the time prints as "HH:MM" with a leading zero
 * ("09:00", "17:00") and short changes nothing.
 */
export function formatClock(time: string, opts: ClockOptions = {}): string {
	const [hourStr, minuteStr = "00"] = time.split(":");
	const hour24 = Number(hourStr);
	if (opts.clock === "24h") return `${String(hour24 % 24).padStart(2, "0")}:${minuteStr}`;
	const suffix = hour24 % 24 >= 12 ? "p" : "a";
	const hour = hour24 % 12 || 12;
	if (opts.short && minuteStr === "00") return `${hour}${suffix}`;
	return `${hour}:${minuteStr}${suffix}`;
}

export function isClosed(row: OpeningHours): boolean {
	return !row.opens || !row.closes;
}

/**
 * "11:00a to 7:00p" (or "11a to 7p" with short: true, or "11:00 to 19:00"
 * with clock: "24h"). Rows without times render their note ("By
 * appointment") when present, else "Closed".
 */
export function formatHoursRange(row: OpeningHours, opts: ClockOptions = {}): string {
	if (!row.opens || !row.closes) return row.note ?? "Closed";
	return `${formatClock(row.opens, opts)} to ${formatClock(row.closes, opts)}`;
}
