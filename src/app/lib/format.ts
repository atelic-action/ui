/**
 * Generic date and time phrasing shared across features. Domain vocab
 * (sport verbs, kitchen fractions) stays with its feature.
 */

const DAY_MS = 86_400_000;

/**
 * Compact `H:MM` (or `Nm`) duration. Differs from `formatDuration` in
 * src/features/activities — that one is the full `HH:MM:SS`. This one is
 * meant for tight UI (stats grid, card mod lines).
 */
export function fmtTimeShort(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	return h > 0 ? `${h}:${m.toString().padStart(2, "0")}` : `${m}m`;
}

export function shortDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Phrase a date relative to today: `today`, `yesterday`, weekday name for the
 * past week, then `Mon Day` afterwards. Used by the Today salut line and the
 * Training card mod row.
 */
export function relDay(iso: string, now: Date = new Date()): string {
	const then = new Date(iso);
	const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
	const diffDays = Math.round((startOfNow - startOfThen) / DAY_MS);
	if (diffDays === 0) return "today";
	if (diffDays === 1) return "yesterday";
	if (diffDays > 1 && diffDays < 7) return then.toLocaleDateString("en-US", { weekday: "long" });
	return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function partOfDay(d: Date = new Date()): string {
	const h = d.getHours();
	if (h < 5) return "Late night";
	if (h < 12) return "Morning";
	if (h < 17) return "Afternoon";
	if (h < 21) return "Evening";
	return "Tonight";
}

/**
 * Compact local time of day ("9:38 am").
 */
export function formatTimeOfDay(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}
