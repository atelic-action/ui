import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { Chip } from "../primitives/Chip";
import { ImageFrame } from "../primitives/ImageFrame";
import { TickList } from "../primitives/TickList";

export interface FeatureDetailProps {
	/** Anchor id for jump links, e.g. "dry-needling". */
	id?: string;
	/** Optional mono index label, e.g. "01". Rendered above the eyebrow; omit for no number. */
	num?: string;
	eyebrow?: string;
	title: ReactNode;
	tags?: string[];
	lead?: ReactNode;
	ticks?: ReactNode[];
	image?: { src: string; alt: string };
	/** Placeholder label rendered in the media frame until a real image exists. */
	placeholder?: string;
	/** Media on the left on wide screens (alternating rows). */
	flip?: boolean;
}

/** Alternating copy-and-media feature row (the services page pattern). */
export function FeatureDetail({
	id,
	num,
	eyebrow,
	title,
	tags,
	lead,
	ticks,
	image,
	placeholder,
	flip = false,
}: FeatureDetailProps) {
	return (
		<article className={["feature-detail", flip && "flip"].filter(Boolean).join(" ")} id={id}>
			<div>
				{num && <span className="feature-num">{num}</span>}
				{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
				<h2>{title}</h2>
				{tags && tags.length > 0 && (
					<div className="chip-row tag-row">
						{tags.map((tag) => (
							<Chip key={tag} dot>
								{tag}
							</Chip>
						))}
					</div>
				)}
				{lead && <Lead>{lead}</Lead>}
				{ticks && ticks.length > 0 && <TickList items={ticks} className="detail-ticks" />}
			</div>
			<div className="feature-detail-media">
				<ImageFrame src={image?.src} alt={image?.alt} placeholder={placeholder} aspectRatio="4/3" />
			</div>
		</article>
	);
}
