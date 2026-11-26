import { Chip } from "../primitives/Chip";
import { Marquee } from "./Marquee";

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

/** The band's pace in pixels a second: the speed its row always moved at. */
const LOGO_MARQUEE_SPEED = 32;

/**
 * Dark band with an infinitely scrolling row of chips, a use of `Marquee`:
 * the chips at the band's own pace, no dividers, and no pause on hover, as
 * the band always was. Under reduced motion the row stands still and wraps
 * to a centered block (its sheet's own rule), so nothing needs scrolling.
 */
export function LogoMarquee({
	items,
	ariaLabel = "Credentials",
	pauseLabel = "Pause",
}: LogoMarqueeProps) {
	return (
		<Marquee
			className="creds"
			ground="dark"
			ariaLabel={ariaLabel}
			pauseLabel={pauseLabel}
			speed={LOGO_MARQUEE_SPEED}
			dividers={false}
			pauseOnHover={false}
		>
			{items.map((item, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: two items may share a label
				<Chip key={`${item}-${i}`} dot onDark>
					{item}
				</Chip>
			))}
		</Marquee>
	);
}
