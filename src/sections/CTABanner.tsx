import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";
import { Button } from "../primitives/Button";
import { useWithBase } from "../routing/BasePathProvider";

export interface CTABannerCTA {
	label: string;
	href: string;
	newTab?: boolean;
}

export interface CTABannerProps {
	id?: string;
	eyebrow?: string;
	/** Headline; use <em className="serif"> spans for the script accent. */
	title: ReactNode;
	lead?: ReactNode;
	/**
	 * Full-bleed background image behind the content. Omit it and the banner
	 * renders the token gradient fallback (the Hero treatment), so the section
	 * works before photography exists.
	 */
	image?: { src: string; alt?: string };
	primaryCTA?: CTABannerCTA;
	secondaryCTA?: CTABannerCTA;
	/**
	 * Wash over the image so the copy pops: "dark" (light text over a dark
	 * gradient, the hero treatment) or "light" (ink text over a surface wash,
	 * for bright imagery). The wash fades toward the far side so the image
	 * still reads.
	 */
	tone?: "dark" | "light";
}

/**
 * Mid-page full-bleed CTA banner: the image spans the viewport as a backdrop
 * with eyebrow, title, lead, and actions overlaid. The section-scale sibling
 * of Hero — same treatment, banner height, usable anywhere in the page flow.
 */
export function CTABanner({
	id,
	eyebrow,
	title,
	lead,
	image,
	primaryCTA,
	secondaryCTA,
	tone = "dark",
}: CTABannerProps) {
	const withBase = useWithBase();
	const onDark = tone === "dark";
	return (
		<section className={["cta-banner", tone].join(" ")} id={id}>
			{image ? (
				<img
					className="cta-banner-media"
					src={withBase(image.src)}
					alt={image.alt ?? ""}
					loading="lazy"
				/>
			) : (
				<div className="cta-banner-media cta-banner-fallback" aria-hidden="true" />
			)}
			<div className="cta-banner-wash" aria-hidden="true" />
			<div className="wrap">
				<div className="cta-banner-content">
					{eyebrow && <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>}
					<h2>{title}</h2>
					{lead && <Lead>{lead}</Lead>}
					{(primaryCTA || secondaryCTA) && (
						<div className="cta-banner-actions">
							{primaryCTA && (
								<Button href={primaryCTA.href} newTab={primaryCTA.newTab} arrow>
									{primaryCTA.label}
								</Button>
							)}
							{secondaryCTA && (
								<Button
									variant="ghost"
									onDark={onDark}
									href={secondaryCTA.href}
									newTab={secondaryCTA.newTab}
								>
									{secondaryCTA.label}
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
