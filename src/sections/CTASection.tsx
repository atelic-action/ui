import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { Button } from "../primitives/Button";
import type { SiteConfig } from "./siteConfig";

export interface CTASectionProps {
	/** The site's primary action, `site.cta`; a whole `SiteConfig` passes as it is. */
	site: Pick<SiteConfig, "cta">;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	/**
	 * Overrides the primary action; by default the site's primary CTA
	 * (site.cta) renders so every page closes with the same conversion
	 * action in the same style.
	 */
	primary?: { label: string; href: string; newTab?: boolean };
	/** Page-contextual secondary action; always a ghost button, always second. */
	secondary?: { label: string; href: string; newTab?: boolean };
	surface?: "default" | "alt";
}

/** The standard closing CTA: primary action from the site config, ghost secondary. */
export function CTASection({
	site,
	eyebrow,
	title,
	lead,
	primary,
	secondary,
	surface = "alt",
}: CTASectionProps) {
	const classes = ["section", "final-cta", surface === "alt" && "surface-alt"]
		.filter(Boolean)
		.join(" ");
	const primaryAction = primary ?? {
		label: site.cta.label,
		href: site.cta.href,
		newTab: site.cta.external,
	};
	return (
		<section className={classes}>
			<div className="wrap center">
				{eyebrow && <Eyebrow center>{eyebrow}</Eyebrow>}
				<h2>{title}</h2>
				{lead && <Lead className="cta-lead">{lead}</Lead>}
				<div className="cta-row center">
					<Button href={primaryAction.href} newTab={primaryAction.newTab} size="lg" arrow>
						{primaryAction.label}
					</Button>
					{secondary && (
						<Button href={secondary.href} newTab={secondary.newTab} variant="ghost" size="lg">
							{secondary.label}
						</Button>
					)}
				</div>
			</div>
		</section>
	);
}
