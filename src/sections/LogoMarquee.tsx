import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { Chip } from "../primitives/Chip";

export interface LogoMarqueeProps {
	/** Items scrolled across the band (credentials, client names, press). */
	items: string[];
	ariaLabel?: string;
	/**
	 * What a screen reader calls the control that stops and restarts the
	 * row; defaults to "Pause". It is a toggle, pressed while the row is
	 * still, so one name serves both ways.
	 */
	pauseLabel?: string;
}

/**
 * Dark band with an infinitely scrolling row of chips. The row is drawn
 * twice so the loop is seamless; the copy is hidden from assistive tech, so
 * each item is read once, and is not drawn at all under reduced motion,
 * where the row stands still and wraps. A quiet control pauses the row
 * (WCAG 2.2.2, moving content that runs past five seconds).
 */
export function LogoMarquee({
	items,
	ariaLabel = "Credentials",
	pauseLabel = "Pause",
}: LogoMarqueeProps) {
	const [paused, setPaused] = useState(false);
	const row = (copy: boolean) => (
		<div className="marquee-group" aria-hidden={copy || undefined}>
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: two items may share a label
				<Chip key={`${item}-${i}`} dot onDark>
					{item}
				</Chip>
			))}
		</div>
	);
	return (
		<section className="creds" data-ground="dark" aria-label={ariaLabel}>
			<div className="marquee" data-paused={paused || undefined}>
				<div className="marquee-track">
					{row(false)}
					{row(true)}
				</div>
			</div>
			<button
				type="button"
				className="marquee-pause"
				aria-label={pauseLabel}
				aria-pressed={paused}
				onClick={() => setPaused((current) => !current)}
			>
				{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
			</button>
		</section>
	);
}
