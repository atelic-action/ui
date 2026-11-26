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
	/** Draws the eyebrow's trailing rule. Defaults to true; false sets the kicker alone. */
	eyebrowRule?: boolean;
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
	/**
	 * The shot brief the split layout's photo side shows as a labeled block
	 * while there is no `image`. The overlay layout keeps its token gradient.
	 */
	placeholder?: string;
	primaryCTA?: HeroCTA;
	secondaryCTA?: HeroCTA;
	/** Trust indicators rendered under the CTAs. */
	trust?: HeroTrustItem[];
	/** Anchor target for the scroll-down affordance, e.g. "#pain". */
	scrollTarget?: string;
	/**
	 * `overlay`, the default, sets the copy over a full bleed photo a screen
	 * tall. `split` sets the copy and its actions on the primary field on one
	 * side and the photo on the other, at the height the copy needs, stacking
	 * with the photo first on a phone; the scroll cue is left out.
	 */
	layout?: "overlay" | "split";
}

/** Full-bleed image hero with scrim, headline, CTA pair, and trust stats. */
export function Hero({
	eyebrow,
	eyebrowRule = true,
	title,
	subtitle,
	image,
	placeholder,
	primaryCTA,
	secondaryCTA,
	trust,
	scrollTarget,
	layout = "overlay",
}: HeroProps) {
	const withBase = useWithBase();
	const ctaProps = (cta: HeroCTA, extra: Partial<ButtonProps>) => ({
		href: cta.href,
		newTab: cta.newTab,
		...extra,
	});

	const copy = (
		<>
			{eyebrow && (
				<Eyebrow onDark rule={eyebrowRule}>
					{eyebrow}
				</Eyebrow>
			)}
			<h1>{title}</h1>
			{subtitle && <p className="hero-sub">{subtitle}</p>}
			{(primaryCTA || secondaryCTA) && (
				<div className="cta-row">
					{primaryCTA && (
						<Button {...ctaProps(primaryCTA, { size: "lg", arrow: true })}>
							{primaryCTA.label}
						</Button>
					)}
					{secondaryCTA && (
						<Button {...ctaProps(secondaryCTA, { variant: "ghost", size: "lg", onDark: true })}>
							{secondaryCTA.label}
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
		</>
	);
	const media = image ? (
		<img
			src={withBase(image.src)}
			alt={image.alt}
			fetchPriority="high"
			{...(image.position ? { style: { objectPosition: image.position } } : {})}
		/>
	) : (
		<div className="hero-media-fallback" />
	);

	if (layout === "split") {
		const splitMedia =
			!image && placeholder ? <div className="ph hero-split-ph">{placeholder}</div> : media;
		return (
			<section className="hero is-split" data-ground="dark">
				<div className="hero-split-copy on-primary">
					<div className="hero-split-inner">{copy}</div>
				</div>
				<div className="hero-split-media">{splitMedia}</div>
			</section>
		);
	}

	return (
		<section className="hero" data-ground="dark">
			<div className="hero-media">
				{media}
				<div className="hero-scrim" />
			</div>
			<div className="wrap hero-content">{copy}</div>
			{scrollTarget && (
				<a className="hero-scroll" href={withBase(scrollTarget)} aria-label="Scroll down">
					↓
				</a>
			)}
		</section>
	);
}
