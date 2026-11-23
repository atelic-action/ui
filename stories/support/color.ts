/**
 * The color a value resolves to where `element` sits, as the browser
 * computes it: `resolvedColor(heading, "var(--on-primary)")`. Measured on a
 * probe inside the element, so a token a band restates resolves as the band
 * has it. An element that holds no children (an input) is measured from
 * its parent.
 */
export function resolvedColor(element: Element, value: string): string {
	const host = element instanceof HTMLInputElement ? (element.parentElement ?? element) : element;
	const probe = document.createElement("span");
	probe.style.color = value;
	host.appendChild(probe);
	const color = getComputedStyle(probe).color;
	probe.remove();
	return color;
}
