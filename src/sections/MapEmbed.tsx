import { MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import { useWithBase } from "../routing/BasePathProvider";
import type { SiteConfig } from "./siteConfig";

/** The keys of the site config the map reads; a whole `SiteConfig` passes as it is. */
export type MapEmbedSite = Pick<
	SiteConfig,
	"name" | "address" | "mapImage" | "mapLinkUrl" | "mapEmbedUrl"
>;

export interface MapEmbedProps {
	site: MapEmbedSite;
}

/**
 * The location map. Preferred form is a static screenshot (`site.mapImage`):
 * one image request, no third-party chain, and a real map on first paint,
 * linking straight to directions. Falls back to a click-to-load facade over
 * the live Google embed when no static image is provided (the embed's utility
 * chain weighs ~450 KiB, so it never loads on its own).
 */
export function MapEmbed({ site }: MapEmbedProps) {
	const withBase = useWithBase();
	const [loaded, setLoaded] = useState(false);

	const address = `${site.address.street}, ${site.address.locality} ${site.address.region} ${site.address.postalCode}`;

	if (site.mapImage) {
		return (
			<a
				className="map-frame map-static"
				href={site.mapLinkUrl ?? "#"}
				{...(site.mapLinkUrl ? { target: "_blank", rel: "noopener" } : {})}
				aria-label={`Get directions to ${site.name}, ${address}`}
			>
				<img src={withBase(site.mapImage)} alt={`Map to ${site.name}, ${address}`} loading="lazy" />
				<span className="map-directions">
					<Navigation size={15} aria-hidden />
					Get Directions
				</span>
			</a>
		);
	}

	if (!site.mapEmbedUrl) return null;

	if (!loaded) {
		return (
			<div className="map-frame">
				<button
					type="button"
					className="map-facade"
					onClick={() => setLoaded(true)}
					aria-label={`Load the map to ${site.name}, ${address}`}
				>
					<MapPin size={28} aria-hidden />
					<span className="map-facade-address">{address}</span>
					<span className="map-facade-hint">Tap to load the map</span>
				</button>
			</div>
		);
	}

	return (
		<div className="map-frame">
			<iframe
				title={`Map to ${site.name}, ${address}`}
				src={site.mapEmbedUrl}
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
			/>
		</div>
	);
}
