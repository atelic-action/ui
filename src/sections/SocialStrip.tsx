import { AtSign } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeading } from "../primitives";
import { Button } from "../primitives/Button";

export interface SocialPhoto {
	src?: string;
	alt?: string;
	/** Placeholder shot brief rendered when no src exists yet. */
	placeholder?: string;
}

export interface SocialStripProps {
	eyebrow?: string;
	/** Deprecated no-op: the eyebrow's trailing fade is now its only rendering. */
	eyebrowRun?: boolean;
	title: ReactNode;
	lead?: string;
	/** Display handle, e.g. "@platformstrength". */
	handle: string;
	/** The profile the strip links out to. */
	profileUrl: string;
	photos: SocialPhoto[];
	/** Follow button label; defaults to "Follow {handle}". */
	followLabel?: string;
	surface?: "default" | "alt";
	id?: string;
}

/**
 * A static strip of the business's own social photos with a follow link out.
 * Deliberately not a live embed: third-party embed scripts are heavy,
 * render-blocking, and break silently on static exports. Photos ship as local
 * assets; the platform link carries the relationship.
 */
export function SocialStrip({
	eyebrow,
	title,
	lead,
	handle,
	profileUrl,
	photos,
	followLabel,
	surface = "default",
	id,
}: SocialStripProps) {
	const sectionClasses = ["section", surface === "alt" && "surface-alt"].filter(Boolean).join(" ");
	return (
		<section className={sectionClasses} id={id}>
			<div className="wrap">
				<SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
				<div className="social-strip">
					{photos.map((photo) =>
						photo.src ? (
							<a
								key={photo.src}
								className="social-tile"
								href={profileUrl}
								target="_blank"
								rel="noopener"
								aria-label={`${photo.alt} (opens ${handle})`}
							>
								<img src={photo.src} alt={photo.alt ?? ""} loading="lazy" />
							</a>
						) : (
							<div key={photo.placeholder} className="social-tile ph">
								{photo.placeholder ?? "Photo"}
							</div>
						),
					)}
				</div>
				<div className="social-follow">
					<Button href={profileUrl} newTab variant="dark">
						<AtSign size={17} aria-hidden />
						{followLabel ?? `Follow ${handle}`}
					</Button>
				</div>
			</div>
		</section>
	);
}
