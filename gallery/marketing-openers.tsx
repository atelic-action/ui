import { ImageFrame, QuoteCard, StarRow } from "../src/primitives";
import {
	CTASection,
	FullBleedVideo,
	Hero,
	LogoMarquee,
	PageHero,
	PricingBand,
	ProofStrip,
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
					primaryCTA={{ label: "Order ahead", href: "#hero" }}
					secondaryCTA={{ label: "See the menu", href: "#hero" }}
					trust={[
						{ value: "1,200", label: "Loaves a week" },
						{ value: "4.9", label: "Average review" },
						{ value: "11", label: "Cafes we supply" },
					]}
					scrollTarget="#page-hero"
				/>
			</Specimen>

			<Specimen
				id="hero-split"
				name="Hero, layout split"
				lead="The same opener with the copy and its actions on the primary field beside the photo, at the height the copy needs; a phone stacks the photo first. The primary button turns light on the field."
			>
				<Hero
					layout="split"
					eyebrow="Alder Street, since 2014"
					title="Bread worth the early line."
					subtitle="Sourdough, morning buns, and cakes to order, baked in the back of the shop every day but Monday."
					image={{ src: "/images/bakery-band.svg", alt: "Loaves cooling on a rack" }}
					primaryCTA={{ label: "Order ahead", href: "#hero-split" }}
					secondaryCTA={{ label: "Call (555) 555-0142", href: "tel:+15555550142" }}
				/>
			</Specimen>

			<Specimen
				id="proof-strip"
				name="ProofStrip"
				lead="One row of short proof facts under a hero, a figure over its label each, wrapping to a clean grid on a phone."
			>
				<ProofStrip
					ariaLabel="Why the line is long"
					items={[
						{
							value: (
								<>
									4.9 <StarRow rating={5} size={15} />
								</>
							),
							label: "212 reviews",
						},
						{ value: "Since 2014", label: "On Alder Street" },
						{ value: "1,200 loaves", label: "Baked every week" },
						{ value: "11 cafes", label: "Carry the morning bake" },
						{ value: "Two days", label: "Notice for a cake" },
					]}
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
				lead="The recurring two column band: copy beside copy, or media beside copy. Shown at the narrow first ratio, then at the media ratio, whose fixed 420px shot column and card row gap line a photo up with a case study entry above it."
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
				<SplitSection
					ratio="media"
					surface="alt"
					left={
						<ImageFrame
							placeholder="Shot brief: Ines at the bench, shaping the first loaves"
							aspectRatio="4/3"
						/>
					}
					right={
						<>
							<h2>The baker behind the bench.</h2>
							<p className="lead">
								Ines opened the shop with one oven and a starter she carried across the country, and
								she still shapes the first loaves of every morning herself.
							</p>
						</>
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
				id="full-bleed-video"
				name="FullBleedVideo"
				lead="A silent looping clip edge to edge. The first frame shows at once as a picture; the clip loads behind it, starts once it can play through, plays only while on screen, and stays on the picture under reduced motion. Shown with its pause button on, then as the shot brief before the footage exists."
			>
				<FullBleedVideo
					src="/video/bakery-loop.mp4"
					poster="/images/bakery-loop-first-frame.jpg"
					label="The ovens warming before the first bake"
					controls
				/>
				<FullBleedVideo
					src="/video/bakery-loop.mp4"
					label="The ovens warming before the first bake"
					placeholder="Video: the ovens at dawn, one slow pan, no people"
					height="220px"
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
