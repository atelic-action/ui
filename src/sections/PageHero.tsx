import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import type { Surface } from "./siteConfig";

export interface PageHeroProps {
	eyebrow?: string;
	/** Draws the eyebrow's trailing rule. Defaults to true; false sets the kicker alone, as `Hero`'s does. */
	eyebrowRule?: boolean;
	title: ReactNode;
	lead?: ReactNode;
	center?: boolean;
	/** Extra content under the lead (e.g. jump-link chips). */
	children?: ReactNode;
	/**
	 * The band's background. Defaults to `alt`, the band an interior page
	 * opens on; `primary` (8.5.0) sets it on the primary fill, its words in
	 * `--on-primary`, as the callout panel and the price band are.
	 */
	surface?: Surface | "primary";
}

/** Interior page opener on the alternate surface band, the page surface, or the primary fill. */
export function PageHero({
	eyebrow,
	eyebrowRule = true,
	title,
	lead,
	center = false,
	children,
	surface = "alt",
}: PageHeroProps) {
	return (
		<section
			className={[
				"page-hero",
				center && "center",
				surface === "default" && "surface-default",
				surface === "primary" && "on-primary",
			]
				.filter(Boolean)
				.join(" ")}
			data-ground={surface === "primary" ? "primary" : undefined}
		>
			<div className="wrap">
				{eyebrow && (
					<Eyebrow center={center} rule={eyebrowRule}>
						{eyebrow}
					</Eyebrow>
				)}
				<h1>{title}</h1>
				{lead && <Lead style={center ? { marginInline: "auto" } : undefined}>{lead}</Lead>}
				{children}
			</div>
		</section>
	);
}
