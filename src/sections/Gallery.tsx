import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { useWithBase } from "../routing/BasePathProvider";

export interface GalleryPhoto {
	src?: string;
	/** Alt text: describe the work in the frame, never the brand. */
	alt?: string;
	/** Placeholder shot brief rendered when no src exists yet. */
	placeholder?: string;
	/** Short caption rendered under the photo. Keep it to one honest line. */
	caption?: string;
}

export interface GalleryProps {
	id?: string;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	photos: GalleryPhoto[];
	/** Tiles per row at desktop width (default 3). */
	columns?: 2 | 3;
	surface?: "default" | "alt";
	/** Small note under the grid, e.g. photo provenance. */
	footnote?: ReactNode;
}

/**
 * A captioned photo grid for a business's own work. Built for trade and
 * service clients whose proof is the job itself: every tile is a real
 * photograph with a caption that says what it is, never a stock frame.
 *
 * Tiles crop to a fixed aspect so a mixed bag of phone photos still reads
 * as one wall. Photos without a `src` render their shot brief as a labeled
 * placeholder, so the wall can be composed before the photography exists.
 */
export function Gallery({
	id,
	eyebrow,
	title,
	lead,
	photos,
	columns = 3,
	surface = "default",
	footnote,
}: GalleryProps) {
	const withBase = useWithBase();
	return (
		<section
			id={id}
			className={["section gallery-section", surface === "alt" && "surface-alt"]
				.filter(Boolean)
				.join(" ")}
		>
			<div className="wrap">
				{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
				<h2>{title}</h2>
				{lead && <Lead style={{ maxWidth: "60ch" }}>{lead}</Lead>}
				<ul className={`gallery-grid cols-${columns}`}>
					{photos.map((photo) => (
						<li className="gallery-item" key={photo.src ?? photo.placeholder ?? photo.caption}>
							<figure>
								{photo.src ? (
									<div className="gallery-frame">
										<img
											src={withBase(photo.src)}
											alt={photo.alt ?? ""}
											loading="lazy"
											decoding="async"
										/>
									</div>
								) : (
									<div className="gallery-frame ph">{photo.placeholder ?? "Photo"}</div>
								)}
								{photo.caption && <figcaption>{photo.caption}</figcaption>}
							</figure>
						</li>
					))}
				</ul>
				{footnote && <p className="muted gallery-footnote">{footnote}</p>}
			</div>
		</section>
	);
}
