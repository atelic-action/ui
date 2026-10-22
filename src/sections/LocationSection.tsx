import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { Button } from "../primitives/Button";
import { HoursTable } from "./HoursTable";
import { MapEmbed, type MapEmbedSite } from "./MapEmbed";
import type { SiteConfig } from "./siteConfig";

/** The keys of the site config the section reads; a whole `SiteConfig` passes as it is. */
export type LocationSectionSite = MapEmbedSite &
	Pick<SiteConfig, "serviceAreas" | "hours" | "clock" | "phone">;

export interface LocationSectionProps {
	site: LocationSectionSite;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
}

/** Joins service areas into readable prose: "A, B, and C". */
function areasSentence(areas: string[]): string {
	if (areas.length <= 1) return areas[0] ?? "";
	return `${areas.slice(0, -1).join(", ")}, and ${areas[areas.length - 1]}`;
}

/**
 * Local SEO section: NAP copy, service areas, hours, directions, and the
 * map embed. Identical on every page that uses it — the service areas
 * render as plain prose (crawlable text) from the site config.
 */
export function LocationSection({ site, eyebrow = "Find us", title, lead }: LocationSectionProps) {
	return (
		<section className="section location">
			<div className="wrap location-grid">
				<div>
					<Eyebrow>{eyebrow}</Eyebrow>
					<h2>{title}</h2>
					{lead && <Lead>{lead}</Lead>}
					{site.serviceAreas.length > 0 && (
						<p className="loc-areas">Proudly serving {areasSentence(site.serviceAreas)}.</p>
					)}

					<div className="loc-block">
						<h4>Hours</h4>
						<HoursTable hours={site.hours} clock={site.clock} />
					</div>

					<div className="loc-actions">
						{site.mapLinkURL && (
							<Button variant="dark" href={site.mapLinkURL} newTab arrow>
								Get Directions
							</Button>
						)}
						{site.phone && (
							<Button variant="ghost" href={`tel:${site.phone.e164}`}>
								{site.phone.display}
							</Button>
						)}
					</div>
				</div>
				<div>
					<MapEmbed site={site} />
				</div>
			</div>
		</section>
	);
}
