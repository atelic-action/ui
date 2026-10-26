import { BlogIndex, BlogPost, LegalPage } from "../src/sections";
import { MarketingGroup, Specimen } from "./marketing-parts";

/** The sections that carry long form words: the blog and the legal pages. */
export function MarketingWriting() {
	return (
		<MarketingGroup
			id="marketing-writing"
			title="Writing"
			lead="Pages of words carried as data: a post list, a post, and a legal document, each rendered through ProseBlocks."
		>
			<Specimen
				id="blog-index"
				name="BlogIndex"
				lead="The post listing as a readable stack, the whole row the link; dates format without a date library."
			>
				<BlogIndex
					basePath="#blog-index"
					items={[
						{
							slug: "cold-proof",
							title: "Why our dough sleeps in the walk in",
							description: "Eighteen hours, four degrees, and where the flavor comes from.",
							publishedAt: "2026-09-30",
							readingMinutes: 4,
						},
						{
							slug: "morning-bun",
							title: "The morning bun, from the start",
							publishedAt: "2026-06-12",
							readingMinutes: 3,
						},
					]}
				/>
			</Specimen>

			<Specimen
				id="blog-post"
				name="BlogPost"
				lead="One article: a back link, the title, the byline and dateline, and the body."
			>
				<BlogPost
					basePath="#blog-index"
					doc={{
						title: "Why our dough sleeps in the walk in",
						publishedAt: "2026-09-30",
						updatedAt: "2026-10-02",
						author: "Ines Calder",
						blocks: [
							{
								type: "p",
								text: "Every loaf we sell was mixed the afternoon before. It spends the night in the walk in at four degrees, and the slow rise is where the flavor comes from.",
							},
							{ type: "h", text: "What the cold does" },
							{
								type: "ul",
								items: [
									"Slows the yeast so the bacteria can catch up",
									"Firms the dough so it scores cleanly",
									"Lets us bake at six instead of mixing at midnight",
								],
							},
							{ type: "h", level: 3, text: "The shaping" },
							{
								type: "figure",
								src: "/images/bakery-band.svg",
								alt: "A row of shaped loaves on a floured bench",
								caption: "Shaped cold, straight from the walk in, and scored before the oven.",
							},
							{
								type: "p",
								text: "A cold loaf holds its shape under the blade, which is why the ears open the way they do.",
							},
						],
					}}
				/>
			</Specimen>

			<Specimen
				id="legal-page"
				name="LegalPage"
				lead="A legal document from data, with its last revised date first; a client's wording is carried verbatim."
			>
				<LegalPage
					doc={{
						title: "Privacy",
						lastUpdated: "2026-01-15",
						blocks: [
							{
								type: "p",
								text: "This is example text for the gallery, not a policy. A real site carries its client's own published wording here.",
							},
							{ type: "h", text: "What we collect" },
							{ type: "ul", items: ["Your name and email when you write to us", "Nothing else"] },
						],
					}}
				/>
			</Specimen>
		</MarketingGroup>
	);
}
