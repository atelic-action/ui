/**
 * Turns the reader's `prefers-reduced-motion` setting on for this story's
 * page alone. Answering `matchMedia` in script, as FullBleedVideo's story
 * does, reaches a component that decides in script and never a stylesheet's
 * `@media (prefers-reduced-motion: reduce)`, so this does both: it answers
 * the query in script, and it copies every reduced motion rule the loaded
 * sheets hold into one sheet of its own, unconditioned, inside the same
 * cascade layers, where it wins exactly as the media query would.
 *
 * Emulating the setting through the browser instead (the DevTools
 * protocol) reaches every frame of the test page, so a story running beside
 * it in another file would see its motion stop; this touches only the
 * story's own document.
 *
 * Kept with the sections' stories because the sections' writer may write
 * only here; it belongs in stories/support/ beside the viewports.
 */
export function reduceMotion(): () => void {
	const copies: string[] = [];
	const wrap = (css: string, layers: string[]) =>
		layers.reduceRight((inner, name) => `@layer ${name} {\n${inner}\n}`, css);
	const walk = (rules: CSSRuleList, layers: string[]) => {
		for (const rule of Array.from(rules)) {
			if (rule instanceof CSSLayerBlockRule) {
				walk(rule.cssRules, [...layers, rule.name]);
			} else if (rule instanceof CSSMediaRule) {
				if (/prefers-reduced-motion:\s*reduce/.test(rule.conditionText)) {
					const inner = Array.from(rule.cssRules, (child) => child.cssText).join("\n");
					copies.push(wrap(inner, layers));
				} else {
					walk(rule.cssRules, layers);
				}
			}
		}
	};
	for (const sheet of Array.from(document.styleSheets)) {
		try {
			walk(sheet.cssRules, []);
		} catch {
			// A cross origin sheet cannot be read; the package's are all local.
		}
	}
	const style = document.createElement("style");
	style.dataset.story = "reduced-motion";
	style.textContent = copies.join("\n");
	document.head.append(style);

	const original = window.matchMedia;
	window.matchMedia = ((query: string) => {
		const list = original.call(window, query);
		if (!query.includes("prefers-reduced-motion")) return list;
		return { ...list, matches: /reduce/.test(query), media: query } as MediaQueryList;
	}) as typeof window.matchMedia;

	return () => {
		style.remove();
		window.matchMedia = original;
	};
}

/** A story's `beforeEach` that turns reduced motion on and back off after. */
export const withReducedMotion = () => reduceMotion();
