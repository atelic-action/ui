import { ImageFrame, ProseBlocks, QuoteCard, StarRow, TickList } from "../src/primitives";
import { Band, MarketingGroup, Specimen } from "./marketing-parts";

/** The five primitives that came with the marketing sections. */
export function MarketingPrimitives() {
	return (
		<MarketingGroup
			id="marketing-primitives"
			title="Marketing Primitives"
			lead="The small pieces the sections are set in, from @atelic-action/ui/primitives beside Button and Chip."
		>
			<Specimen
				id="image-frame"
				name="ImageFrame"
				lead="A rounded, shadowed media frame; with no source it renders a labeled shot brief."
			>
				<Band>
					<div className="mg-two">
						<ImageFrame
							src="/images/bakery-band.svg"
							alt="Loaves cooling on a rack"
							aspectRatio="4/3"
						/>
						<ImageFrame placeholder="Shot brief: the morning shelf, full" aspectRatio="4/3" />
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="quote-card"
				name="QuoteCard"
				lead="A serif italic pull quote with its attribution."
			>
				<Band alt>
					<div className="mg-two">
						<QuoteCard
							quote="We would rather sell out by two than sell yesterday's bread."
							by="Ines Calder, head baker"
						/>
						<QuoteCard quote="Worth the early line." by="Fairhaven Weekly" center />
					</div>
				</Band>
			</Specimen>

			<Specimen id="tick-list" name="TickList" lead="A checkmark bullet list.">
				<Band>
					<TickList
						items={["Milled within the state", "No commercial yeast", "Baked on the stone deck"]}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="star-row"
				name="StarRow"
				lead="A row of filled stars read as one image (five out of five stars), for a review that shows a rating; StarRating is the half step, editable kin."
			>
				<Band>
					<div className="gallery-row">
						<StarRow rating={5} />
						<StarRow rating={4} size={20} />
						<StarRow rating={3} size={24} />
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="prose-blocks"
				name="ProseBlocks"
				lead="The body of any ported document, from three kinds of block: a heading, a paragraph, and a list."
			>
				<Band>
					<ProseBlocks
						headingLevel="h3"
						blocks={[
							{
								type: "p",
								text: "The shop opened on Alder Street in 2014 with one deck oven and a borrowed mixer.",
							},
							{ type: "h", text: "What we still do by hand" },
							{ type: "ul", items: ["Shaping every loaf", "Scoring", "Lettering every cake"] },
						]}
					/>
				</Band>
			</Specimen>
		</MarketingGroup>
	);
}
