/**
 * Check whether any of the given fields contain the search query.
 * Accepts both string and string-array fields (e.g. tags).
 */
export function matchesSearch(
	query: string,
	fields: (string | string[] | null | undefined)[],
): boolean {
	const lower = query.toLowerCase();
	return fields.some((field) => {
		if (!field) return false;
		if (Array.isArray(field)) {
			return field.some((item) => item.toLowerCase().includes(lower));
		}
		return field.toLowerCase().includes(lower);
	});
}
