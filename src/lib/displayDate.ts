const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

/**
 * "2025-03-27" or a full ISO timestamp -> "March 27, 2025". The calendar date
 * is read off the string, never through Date(), which lands a bare date a day
 * early west of UTC. Anything unreadable is returned as given.
 */
export function displayDate(iso: string): string {
	const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
	if (!year || !month || !day || month > 12) return iso;
	return `${MONTHS[month - 1]} ${day}, ${year}`;
}
