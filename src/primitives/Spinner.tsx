export interface SpinnerProps {
	/**
	 * What a screen reader hears, and what the eye reads under reduced
	 * motion, where the ring stops turning. Defaults to "Loading".
	 */
	label?: string;
	className?: string;
}

/**
 * A turning ring that says something is on its way, in the primary color on
 * a faint track of it. The label is words a screen reader hears; under
 * `prefers-reduced-motion` the ring holds still and the label shows beside
 * it, so the wait still reads without the motion. It is no live region of
 * its own: where the wait is a status a reader should hear, the caller sets
 * it inside an `<output>`, which can then say what came instead (the way
 * `EmbeddedScriptFrame` swaps it for its fallback in place).
 */
export function Spinner({ label = "Loading", className }: SpinnerProps) {
	return (
		<span className={["spinner", className].filter(Boolean).join(" ")}>
			<span className="spinner-ring" aria-hidden="true" />
			<span className="spinner-label visually-hidden">{label}</span>
		</span>
	);
}
