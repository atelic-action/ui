import { Navigation, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { MapEmbed, type MapEmbedSite } from "./MapEmbed";

export interface LocationEntry {
	name: string;
	address: string;
	/** Hours lines, already formatted, e.g. "Mon to Sat · 5am to 3pm". */
	hours: string[];
	phoneDisplay: string;
	phoneE164: string;
	mapLink: string;
	/** Optional one-line note, e.g. "The original, since 1979". */
	note?: string;
}

export interface LocationsProps {
	/** Drives the static map (the primary/flagship location); a whole `SiteConfig` passes as it is. */
	site: MapEmbedSite;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	locations: LocationEntry[];
}

/**
 * Multi-location block: the flagship's static map beside a grid of location
 * cards (address, hours, call, directions). Reusable for any business that
 * runs more than one address.
 */
export function Locations({ site, eyebrow = "Find us", title, lead, locations }: LocationsProps) {
	return (
		<section className="section locs">
			<div className="wrap">
				<Eyebrow>{eyebrow}</Eyebrow>
				<h2>{title}</h2>
				{lead && <Lead style={{ maxWidth: "58ch" }}>{lead}</Lead>}
				<div className="locs-layout">
					<div className="locs-map">
						<MapEmbed site={site} />
					</div>
					<div className="locs-cards">
						{locations.map((loc) => (
							<div className="loc-card" key={loc.name}>
								<h3>{loc.name}</h3>
								{loc.note && <p className="loc-note">{loc.note}</p>}
								<p className="loc-addr">{loc.address}</p>
								<div className="loc-hours">
									{loc.hours.map((line) => (
										<span key={line}>{line}</span>
									))}
								</div>
								<div className="loc-links">
									<a href={`tel:${loc.phoneE164}`}>
										<Phone size={14} aria-hidden />
										{loc.phoneDisplay}
									</a>
									<a href={loc.mapLink} target="_blank" rel="noopener">
										<Navigation size={14} aria-hidden />
										Directions
									</a>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
