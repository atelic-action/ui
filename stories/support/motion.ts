/**
 * Turns the reader's `prefers-reduced-motion` setting on for this story's
 * page alone. It answers the query in script, which reaches a component that
 * decides in script (`FullBleedVideo`), and it copies every reduced motion
 * rule the loaded sheets hold into one sheet of its own, inside the same
 * cascade layers, which reaches a stylesheet's
 * `@media (prefers-reduced-motion: reduce)` the way the setting would.
 *
 * Emulating the setting through the browser instead (the DevTools protocol)
 * reaches every frame of the test page, so a story running beside it in
 * another file would see its motion stop; this touches only the story's own
 * document. Use it as a story's `beforeEach`: `beforeEach: withReducedMotion`.
 *
 * The copier is strict about the condition a rule sits under, since copying
 * one wrongly turns on rules the setting never would:
 *
 * - `(prefers-reduced-motion: reduce)` alone, or its boolean form
 *   `(prefers-reduced-motion)`, is copied with no condition.
 * - Joined by `and` to other features (`screen and (max-width: 600px) and
 *   (prefers-reduced-motion: reduce)`), it is copied under the rest of the
 *   condition, so a width the rule needs still has to hold.
 * - Nested under another media rule, it keeps that rule's condition too.
 * - Anything else that names the feature (a `no-preference` rule, which the
 *   real setting would turn off and this cannot, an `or`, a `not`, or a
 *   comma list) throws, naming the condition, so the story's author handles
 *   it rather than the copy silently differing from the setting.
 */
export function reduceMotion(): () => void {
	const copies: string[] = [];
	const wrap = (css: string, layers: string[]) =>
		layers.reduceRight((inner, name) => `@layer ${name} {\n${inner}\n}`, css);
	// A media rule inside another keeps the outer one's condition: a reduced
	// motion rule nested under a width is copied under that width.
	const walk = (rules: CSSRuleList, layers: string[], outer: string[]) => {
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSLayerBlockRule) {
				walk(rule.cssRules, [...layers, rule.name], outer);
			} else if (rule instanceof CSSMediaRule) {
				const rest = withoutReducedMotion(rule.conditionText);
				if (rest === undefined) {
					walk(rule.cssRules, layers, [...outer, rule.conditionText]);
					continue;
				}
				const inner = Array.from(rule.cssRules, (child) => child.cssText).join("\n");
				const conditions = [...outer, rest].filter(Boolean);
				const body = conditions.reduceRight(
					(css, condition) => `@media ${condition} {\n${css}\n}`,
					inner,
				);
				copies.push(wrap(body, layers));
			}
		}
	};
	for (const sheet of Array.from(document.styleSheets)) {
		let rules: CSSRuleList;
		try {
			rules = sheet.cssRules;
		} catch {
			// A cross origin sheet cannot be read; the package's are all local.
			continue;
		}
		walk(rules, [], []);
	}
	const style = document.createElement("style");
	style.dataset.story = "reduced-motion";
	style.textContent = copies.join("\n");
	document.head.append(style);

	const original = window.matchMedia;
	window.matchMedia = ((query: string) => {
		const list = original.call(window, query);
		if (!query.includes("prefers-reduced-motion")) return list;
		// Shadow `matches` on the real list, so its listeners and methods keep working.
		Object.defineProperty(list, "matches", {
			value: /prefers-reduced-motion:\s*reduce/.test(query),
		});
		return list;
	}) as typeof window.matchMedia;

	return () => {
		style.remove();
		window.matchMedia = original;
	};
}

/** A story's `beforeEach` that turns reduced motion on, and off after it. */
export const withReducedMotion = () => reduceMotion();

// The boolean form, `(prefers-reduced-motion)`, holds for every value but
// no-preference, so it means reduce too.
const REDUCE = /^\(\s*prefers-reduced-motion(\s*:\s*reduce)?\s*\)$/i;

/**
 * The rest of a media condition once its reduced motion feature is taken
 * out: `undefined` when the condition does not name the feature, `""` when
 * the feature is the whole of it, the other `and` parts otherwise. Throws on
 * a condition the setting cannot be emulated under by a copy.
 */
export function withoutReducedMotion(condition: string): string | undefined {
	if (!/prefers-reduced-motion/i.test(condition)) return undefined;
	const text = condition.trim();
	const unsupported = () =>
		new Error(
			`reduceMotion cannot emulate @media ${text}: only (prefers-reduced-motion: reduce) or (prefers-reduced-motion), alone or joined by "and", can be copied. Handle this rule in the story.`,
		);
	if (/,|\bor\b|\bnot\b|\bonly\b/i.test(text)) throw unsupported();
	const parts = text.split(/\s+and\s+/i).map((part) => part.trim());
	const feature = parts.filter((part) => /prefers-reduced-motion/i.test(part));
	if (feature.length !== 1 || !REDUCE.test(feature[0] ?? "")) throw unsupported();
	return parts.filter((part) => !REDUCE.test(part)).join(" and ");
}
