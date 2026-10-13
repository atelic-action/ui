import { useWithBase } from "../routing/BasePathProvider";

export interface MediaBandProps {
	image: { src: string; alt: string };
	/**
	 * CSS aspect-ratio for the band (viewport-width : height), e.g. "8/3" for
	 * a wide strip. The image covers the band and crops from center.
	 */
	aspectRatio?: string;
}

/** Full-bleed image band: edge to edge, no frame, no radius. */
export function MediaBand({ image, aspectRatio = "8/3" }: MediaBandProps) {
	const withBase = useWithBase();
	return (
		<div className="media-band" style={{ aspectRatio }}>
			<img src={withBase(image.src)} alt={image.alt} loading="lazy" />
		</div>
	);
}
