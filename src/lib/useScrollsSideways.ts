import { useEffect, useRef, useState } from "react";

/**
 * Whether a box is narrower than what it holds, kept current as either
 * resizes. False on the server and until the first measure, so the box only
 * takes a tab stop and a name once it actually scrolls: a scrolling region a
 * keyboard cannot reach fails axe's `scrollable-region-focusable`, and one
 * that takes a tab stop while it holds nothing to scroll is a stop for
 * nothing. Used by `DataTable` and `ComparisonTable`.
 */
export function useScrollsSideways<T extends HTMLElement = HTMLDivElement>() {
	const ref = useRef<T>(null);
	const [active, setActive] = useState(false);
	useEffect(() => {
		const box = ref.current;
		if (!box) return;
		const measure = () => setActive(box.scrollWidth > box.clientWidth + 1);
		measure();
		if (typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(measure);
		observer.observe(box);
		if (box.firstElementChild) observer.observe(box.firstElementChild);
		return () => observer.disconnect();
	}, []);
	return { ref, active };
}
