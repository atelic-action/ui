import type { OpeningHours } from "../sections/siteConfig";

/**
 * Formats a 24 hour "HH:MM" time as the display style used across the
 * marketing components: "11:00" -> "11:00a", "19:00" -> "7:00p".
 * With short: true, whole hours drop their minutes: "11a", "7p".
 */
export function formatClock(time: string, opts: { short?: boolean } = {}): string {
	const [hourStr, minuteStr = "00"] = time.split(":");
	const hour24 = Number(hourStr);
	const suffix = hour24 >= 12 ? "p" : "a";
	const hour = hour24 % 12 || 12;
	if (opts.short && minuteStr === "00") return `${hour}${suffix}`;
	return `${hour}:${minuteStr}${suffix}`;
}

export function isClosed(row: OpeningHours): boolean {
	return !row.opens || !row.closes;
}

/**
 * "11:00a to 7:00p" (or "11a to 7p" with short: true). Rows without times
 * render their note ("By appointment") when present, else "Closed".
 */
export function formatHoursRange(row: OpeningHours, opts: { short?: boolean } = {}): string {
	if (!row.opens || !row.closes) return row.note ?? "Closed";
	return `${formatClock(row.opens, opts)} to ${formatClock(row.closes, opts)}`;
}
