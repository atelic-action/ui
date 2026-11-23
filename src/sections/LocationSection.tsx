import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { Button } from "../primitives/Button";
import { phoneHref } from "../primitives/PhoneLink";
import { HoursTable } from "./HoursTable";
import { MapEmbed, type MapEmbedSite } from "./MapEmbed";
import type { SiteConfig, Surface } from "./siteConfig";

/** The keys of the site config the section reads; a whole `SiteConfig` passes as it is. */
export type LocationSectionSite = MapEmbedSite &
	Pick<SiteConfig, "serviceAreas" | "hours" | "clock" | "meridiem" | "phone">;

export interface LocationSectionProps {
	site: LocationSectionSite;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	/** The band's background, so adjacent sections never wear the same one. Defaults to the page surface. */
	surface?: Surface;
	/**
	 * The level of the section's title; the hours heading sits one below it,
	 * so the outline never skips a level. Defaults to 2.
	 */
	headingLevel?: 2 | 3 | 4 | 5;
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
export function LocationSection({
	site,
	eyebrow = "Find us",
	title,
	lead,
	surface = "default",
	headingLevel = 2,
}: LocationSectionProps) {
	const Title = `h${headingLevel}` as const;
	return (
		<section
			className={["section location", surface === "alt" && "surface-alt"].filter(Boolean).join(" ")}
		>
			<div className="wrap location-grid">
				<div>
					<Eyebrow>{eyebrow}</Eyebrow>
					<Title className="location-title">{title}</Title>
					{lead && <Lead>{lead}</Lead>}
					{site.serviceAreas.length > 0 && (
						<p className="loc-areas">Proudly serving {areasSentence(site.serviceAreas)}.</p>
					)}

					<div className="loc-block">
						{/* A heading by role, as the footer's column labels are
						    (Footer.tsx): a site's own bare heading rules would
						    restyle this small mono label. */}
						{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules, see above */}
						<div className="loc-heading" role="heading" aria-level={headingLevel + 1}>
							Hours
						</div>
						<HoursTable hours={site.hours} clock={site.clock} meridiem={site.meridiem} />
					</div>

					<div className="loc-actions">
						{site.mapLinkURL && (
							<Button variant="dark" href={site.mapLinkURL} newTab arrow>
								Get Directions
							</Button>
						)}
						{/* No number to dial, no call button (8.6.0). */}
						{site.phone && phoneHref(site.phone) && (
							<Button variant="ghost" href={phoneHref(site.phone)}>
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
