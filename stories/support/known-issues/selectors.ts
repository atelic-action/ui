/**
 * The selectors of a selector list, split on its top level commas only, so
 * a comma inside `:not(a, b)`, `:is(...)`, an attribute value, or a string
 * stays inside its selector.
 */
export function selectorList(list: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let quote: string | null = null;
	let start = 0;
	for (let i = 0; i < list.length; i += 1) {
		const char = list[i];
		if (quote) {
			if (char === "\\") i += 1;
			else if (char === quote) quote = null;
		} else if (char === '"' || char === "'") quote = char;
		else if (char === "(" || char === "[") depth += 1;
		else if (char === ")" || char === "]") depth -= 1;
		else if (char === "," && depth === 0) {
			parts.push(list.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(list.slice(start));
	return parts.map((part) => part.trim()).filter(Boolean);
}
