import type { Clock, OpeningHours } from "../sections/siteConfig";

/** How a time prints. */
export interface ClockOptions {
	/** "12h" (the default) or "24h"; see `SiteConfig.clock`. */
	clock?: Clock;
}

/**
 * Formats a 24 hour "HH:MM" time as the display style used across the
 * marketing components: "08:00" -> "8:00 am", "17:30" -> "5:30 pm", the
 * mark joined by a no break space so a time never breaks before it.
 * With clock: "24h", the time prints as "HH:MM" with a leading zero
 * ("08:00", "17:30").
 */
export function formatClock(time: string, opts: ClockOptions = {}): string {
	const [hourStr, minuteStr = "00"] = time.split(":");
	const hour24 = Number(hourStr);
	if (opts.clock === "24h") return `${String(hour24 % 24).padStart(2, "0")}:${minuteStr}`;
	const mark = hour24 % 24 >= 12 ? "pm" : "am";
	const hour = hour24 % 12 || 12;
	return `${hour}:${minuteStr} ${mark}`;
}

export function isClosed(row: OpeningHours): boolean {
	return !row.opens || !row.closes;
}

/**
 * "8:00 am to 5:00 pm" (or "08:00 to 17:00" with clock: "24h"). Rows
 * without times render their note ("By appointment") when present, else
 * "Closed".
 */
export function formatHoursRange(row: OpeningHours, opts: ClockOptions = {}): string {
	if (!row.opens || !row.closes) return row.note ?? "Closed";
	return `${formatClock(row.opens, opts)} to ${formatClock(row.closes, opts)}`;
}
