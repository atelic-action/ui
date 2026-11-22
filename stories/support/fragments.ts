/**
 * The jump a browser makes for an in page link, made by hand: following a
 * `#` link inside the test frame closes the test run's connection, so a
 * story holds the click and scrolls the target into view the way the
 * browser does, its scroll margin honored. Use as a story's `beforeEach`;
 * it returns its own cleanup.
 */
export function holdFragmentJumps() {
	const jump = (event: MouseEvent) => {
		const link = (event.target as Element | null)?.closest?.("a[href^='#']");
		if (!link) return;
		event.preventDefault();
		const target = document.getElementById((link.getAttribute("href") ?? "").slice(1));
		target?.scrollIntoView({ behavior: "instant", block: "start" });
	};
	document.addEventListener("click", jump);
	return () => document.removeEventListener("click", jump);
}
