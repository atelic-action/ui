export interface SpinnerProps {
	/**
	 * What a screen reader hears, and what the eye reads under reduced
	 * motion, where the ring stops turning. Defaults to "Loading".
	 */
	label?: string;
	/**
	 * The ring's size: `sm`, 20 pixels across on a 2 pixel stroke, beside a
	 * line of text or inside a button; `md`, 32 across on a 3 pixel stroke,
	 * the default; or `lg`, 72 across on a 6 pixel stroke, for a wait that
	 * holds a large space on its own.
	 */
	size?: "sm" | "md" | "lg";
	className?: string;
}

/**
 * The package's one loading animation: a turning ring that says something
 * is on its way, in the primary color on a faint track of it, in three
 * sizes. A component that waits reaches for it rather than drawing its
 * own. The label is words a screen reader hears; under
 * `prefers-reduced-motion` the ring holds still and the label shows beside
 * it, at every size, so the wait still reads without the motion. It is no
 * live region of its own: where the wait is a status a reader should hear,
 * the caller sets it inside an `<output>`, which can then say what came
 * instead (the way `EmbeddedScriptFrame` swaps it for its fallback in
 * place).
 */
export function Spinner({ label = "Loading", size = "md", className }: SpinnerProps) {
	return (
		<span
			className={["spinner", size !== "md" && `spinner-${size}`, className]
				.filter(Boolean)
				.join(" ")}
		>
			<span className="spinner-ring" aria-hidden="true" />
			<span className="spinner-label visually-hidden">{label}</span>
		</span>
	);
}
