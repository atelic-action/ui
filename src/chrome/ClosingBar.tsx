/**
 * The line that closes every page: the copyright with the business's name on
 * the left and the made with note on the far right, crediting the practice
 * in one link. Footer renders it at its foot, and a page with no footer,
 * like a sent document, renders it on its own; given no name it is the note
 * alone, centered.
 *
 * The heart ships as an escape sequence: the no emoji test bars literal
 * pictographs from `src/`.
 */
const DEFAULT_NOTE = "Made with \u{1F49A} in Denver, CO";

export interface ClosingBarProps {
	/** The business's name, printed in the copyright. Omit it on a page that names no business. */
	name?: string;
	/** Suffix on the copyright, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
	/** The made with note at the far right. Defaults to the practice's own line. */
	note?: string;
	/**
	 * Credit the practice after the note. Defaults on (client sites carry it);
	 * the practice's own site turns it off, since crediting yourself on your
	 * own page reads as noise.
	 */
	credit?: boolean;
}

export function ClosingBar({
	name,
	attribution,
	note = DEFAULT_NOTE,
	credit = true,
}: ClosingBarProps) {
	return (
		<div className={name ? "closing-bar" : "closing-bar is-solo"}>
			<div className="wrap closing-bar-line">
				{name && (
					<span>
						© {new Date().getFullYear()} {name}
						{attribution ? ` · ${attribution}` : ""}
					</span>
				)}
				<span className="closing-bar-note">
					{note}
					{credit && (
						<>
							{" by "}
							<a href="https://atelic.me" target="_blank" rel="noopener">
								Atelic
							</a>
						</>
					)}
				</span>
			</div>
		</div>
	);
}
