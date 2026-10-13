import { QuoteCard } from "../src/primitives";
import {
	CTABanner,
	CTASection,
	Hero,
	LogoMarquee,
	MediaBand,
	PageHero,
	PricingBand,
	SplitSection,
} from "../src/sections";
import { bakery } from "./marketing-data";
import { MarketingGroup, Specimen } from "./marketing-parts";

/** The sections that open, punctuate, and close a page. */
export function MarketingOpeners() {
	return (
		<MarketingGroup
			id="marketing-openers"
			title="Openers and Closers"
			lead="The bands a marketing page starts on, breaks with, and ends on. Each is shown full width, the way a site sets it, from @atelic-action/ui/sections."
		>
			<Specimen
				id="hero"
				name="Hero"
				lead="The home page opener: a full bleed image (or the token gradient, as here) under the headline, a pair of actions, and trust figures."
			>
				<Hero
					eyebrow="Alder Street, since 2014"
					title={
						<>
							Bread worth the <em className="serif">early line</em>.
						</>
					}
					subtitle="Sourdough, morning buns, and cakes to order, baked in the back of the shop every day but Monday."
					primaryCta={{ label: "Order ahead", href: "#hero" }}
					secondaryCta={{ label: "See the menu", href: "#hero" }}
					trust={[
						{ value: "1,200", label: "Loaves a week" },
						{ value: "4.9", label: "Average review" },
						{ value: "11", label: "Cafes we supply" },
					]}
					scrollTarget="#page-hero"
				/>
			</Specimen>

			<Specimen
				id="page-hero"
				name="PageHero"
				lead="The interior page opener on the alternate band; anything passed as children sits under the lead."
			>
				<PageHero
					eyebrow="Wholesale"
					title="Bread for the places you already eat."
					lead="Eleven cafes and two grocers carry the morning bake, delivered before they open."
				/>
			</Specimen>

			<Specimen
				id="logo-marquee"
				name="LogoMarquee"
				lead="A dark band of chips scrolling without end: credentials, clients, or press."
			>
				<LogoMarquee
					ariaLabel="Where our bread is served"
					items={[
						"Lantern Coffee",
						"Old Mill Grocery",
						"The Birch Room",
						"Fairhaven Farmers Market",
						"Riverside Deli",
					]}
				/>
			</Specimen>

			<Specimen
				id="split-section"
				name="SplitSection"
				lead="The recurring two column band: copy beside copy, or media beside copy."
			>
				<SplitSection
					ratio="narrow-first"
					align="center"
					left={
						<>
							<h2>Mixed by hand, baked by noon.</h2>
							<p className="lead">
								Every dough rests overnight in the walk in, so the first loaves come out of the oven
								at six and the shelves are full by the time the door opens.
							</p>
						</>
					}
					right={
						<QuoteCard
							quote="We would rather sell out by two than sell yesterday's bread."
							by="Ines Calder, head baker"
						/>
					}
				/>
			</Specimen>

			<Specimen
				id="pricing-band"
				name="PricingBand"
				lead="A brand colored band with the price set in a card beside it, informational by design."
			>
				<PricingBand
					eyebrow="Bread club"
					title="A loaf a week, held for you."
					lead="Pick it up any morning; skip a week whenever you like."
					price="$9"
					unit="/ week"
					detail={{ label: "How the club works", href: "#pricing-band" }}
				/>
			</Specimen>

			<Specimen
				id="media-band"
				name="MediaBand"
				lead="A plain full bleed image, edge to edge, cropped from the center."
			>
				<MediaBand
					image={{ src: "/images/bakery-band.svg", alt: "Loaves cooling on a rack" }}
					aspectRatio="8/3"
				/>
			</Specimen>

			<Specimen
				id="cta-banner"
				name="CTABanner"
				lead="A mid page banner behind a directional wash; shown here on its token gradient, before any photography exists."
			>
				<CTABanner
					eyebrow="Cakes to order"
					title={
						<>
							A birthday deserves a <em className="serif">real</em> cake.
						</>
					}
					lead="Two days' notice for most cakes, a week for anything tiered."
					primaryCta={{ label: "Order a cake", href: "#cta-banner" }}
					secondaryCta={{ label: "See flavors", href: "#cta-banner" }}
				/>
			</Specimen>

			<Specimen
				id="cta-section"
				name="CTASection"
				lead="The standard page closer: the site's own primary action, and an optional ghost second."
			>
				<CTASection
					site={bakery}
					eyebrow="Saturday mornings"
					title="Skip the line, keep the bread."
					lead="Order by Friday at noon and your loaf waits on the shelf by the door."
					secondary={{ label: "Call the shop", href: "tel:+15555550142" }}
				/>
			</Specimen>
		</MarketingGroup>
	);
}
