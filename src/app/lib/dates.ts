// Local calendar helpers shared across features. Everything here works on ISO
// date strings (YYYY-MM-DD) or local date parts, never on an ISO instant, so a
// date never shifts a day across time zones.

export const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

// Today as a local YYYY-MM-DD string, for lexical comparison against other ISO
// dates and for asking the api about the day the user is standing in. `now` is
// injectable for tests.
export function todayIso(now: Date = new Date()): string {
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
}

// The IANA zone the browser is running in, which is the zone the user is
// standing in for anything read from the app. Undefined where the runtime
// cannot say, so the caller can leave the parameter off and let the api resolve
// the zone from the user's own record instead of asserting UTC.
export function localTimeZone(): string | undefined {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
	} catch {
		return undefined;
	}
}

// Format an ISO date without constructing a Date. "2026-06-08" -> "Jun 8, 2026".
// Returns the input untouched when it does not parse, so a bad value is visible
// rather than blank.
export function formatIsoDate(iso: string | null): string | null {
	if (!iso) return null;
	const [year, month, day] = iso.split("-").map(Number);
	if (!year || !month || !day || month < 1 || month > 12) return iso;
	return `${MONTHS[month - 1]} ${day}, ${year}`;
}

// "Jun 8" from an ISO date, no year. Null on a bad or absent input.
export function monthDay(iso: string | null): string | null {
	if (!iso) return null;
	const [year, month, day] = iso.split("-").map(Number);
	if (!year || !month || !day || month < 1 || month > 12) return null;
	return `${MONTHS[month - 1]} ${day}`;
}
