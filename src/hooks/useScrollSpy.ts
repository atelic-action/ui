import { useEffect, useState } from "react";

/** One stop in a page's own navigation: an anchor already on the page. */
export interface PageStop {
	/** Anchor id of an element already on the page. */
	id: string;
	label: string;
}

/**
 * Scroll spy over a list of anchor ids: returns the id whose section is in
 * the reading band, or null before any section has entered it. The header's
 * page stops and a page's own jump rail both highlight from it.
 */
export function useScrollSpy(ids: string[]): string | null {
	const [activeId, setActiveId] = useState<string | null>(null);
	// Key on the joined ids so callers can pass a freshly mapped array
	// without tearing down the observer every render.
	const key = ids.join("|");

	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return;
		const sections = key
			.split("|")
			.filter(Boolean)
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);
		if (sections.length === 0) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) setActiveId(entry.target.id);
				}
			},
			{ rootMargin: "-30% 0px -60% 0px" },
		);
		for (const el of sections) observer.observe(el);
		return () => observer.disconnect();
	}, [key]);

	return activeId;
}
