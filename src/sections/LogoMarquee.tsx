import { Chip } from "../primitives/Chip";

export interface LogoMarqueeProps {
	/** Items scrolled across the band (credentials, client names, press). */
	items: string[];
	ariaLabel?: string;
}

/** Dark band with an infinitely scrolling row of chips. */
export function LogoMarquee({ items, ariaLabel = "Credentials" }: LogoMarqueeProps) {
	// The track is duplicated so the -50% translate loops seamlessly.
	const track = [...items, ...items];
	return (
		<section className="creds" aria-label={ariaLabel}>
			<div className="marquee">
				<div className="marquee-track">
					{track.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: intentional duplicates for the loop
						<Chip key={`${item}-${i}`} dot onDark>
							{item}
						</Chip>
					))}
				</div>
			</div>
		</section>
	);
}
