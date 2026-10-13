import type { ReactNode } from "react";
import { Eyebrow } from "../primitives";
import { Button, type ButtonProps } from "../primitives/Button";
import { useWithBase } from "../routing/BasePathProvider";

export interface HeroCTA {
	label: string;
	href: string;
	newTab?: boolean;
}

export interface HeroTrustItem {
	value: string;
	label: string;
}

export interface HeroProps {
	eyebrow?: string;
	/** Headline; use <em className="serif"> spans for the serif accent. */
	title: ReactNode;
	subtitle?: ReactNode;
	/** Full-bleed hero image; omit to render the token-gradient fallback. */
	image?: {
		src: string;
		alt: string;
		/**
		 * CSS object-position anchoring the photo's subject, e.g. "27% 35%".
		 * Narrow viewports crop the sides of a cover-fit hero; without an
		 * anchor the default center crop can push the subject out of frame.
		 */
		position?: string;
	};
	primaryCta?: HeroCTA;
	secondaryCta?: HeroCTA;
	/** Trust indicators rendered under the CTAs. */
	trust?: HeroTrustItem[];
	/** Anchor target for the scroll-down affordance, e.g. "#pain". */
	scrollTarget?: string;
}

/** Full-bleed image hero with scrim, headline, CTA pair, and trust stats. */
export function Hero({
	eyebrow,
	title,
	subtitle,
	image,
	primaryCta,
	secondaryCta,
	trust,
	scrollTarget,
}: HeroProps) {
	const withBase = useWithBase();
	const ctaProps = (cta: HeroCTA, extra: Partial<ButtonProps>) => ({
		href: cta.href,
		newTab: cta.newTab,
		...extra,
	});

	return (
		<section className="hero">
			<div className="hero-media">
				{image ? (
					<img
						src={withBase(image.src)}
						alt={image.alt}
						fetchPriority="high"
						{...(image.position ? { style: { objectPosition: image.position } } : {})}
					/>
				) : (
					<div className="hero-media-fallback" />
				)}
				<div className="hero-scrim" />
			</div>
			<div className="wrap hero-content">
				{eyebrow && <Eyebrow onDark>{eyebrow}</Eyebrow>}
				<h1>{title}</h1>
				{subtitle && <p className="hero-sub">{subtitle}</p>}
				{(primaryCta || secondaryCta) && (
					<div className="cta-row">
						{primaryCta && (
							<Button {...ctaProps(primaryCta, { size: "lg", arrow: true })}>
								{primaryCta.label}
							</Button>
						)}
						{secondaryCta && (
							<Button {...ctaProps(secondaryCta, { variant: "ghost", size: "lg", onDark: true })}>
								{secondaryCta.label}
							</Button>
						)}
					</div>
				)}
				{trust && trust.length > 0 && (
					<ul className="hero-trust">
						{trust.map((item) => (
							<li key={item.label}>
								<strong>{item.value}</strong>
								<span>{item.label}</span>
							</li>
						))}
					</ul>
				)}
			</div>
			{scrollTarget && (
				<a className="hero-scroll" href={withBase(scrollTarget)} aria-label="Scroll down">
					↓
				</a>
			)}
		</section>
	);
}
