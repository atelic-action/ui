import {
	CredentialList,
	Gallery as PhotoGallery,
	PressQuotes,
	ProfileCards,
	ReviewCarousel,
	ReviewWall,
	SocialStrip,
} from "../src/sections";
import { reviews } from "./marketing-data";
import { Band, MarketingGroup, Specimen } from "./marketing-parts";

/** The sections that show who the business is and what people say about it. */
export function MarketingProof() {
	return (
		<MarketingGroup
			id="marketing-proof"
			title="People and Proof"
			lead="The team, the work, and what customers and the press have said. A rating shows only where the source shows one."
		>
			<Specimen
				id="review-carousel"
				name="ReviewCarousel"
				lead="The aggregate beside one large review at a time, stepped by dots and arrows; every quote ships in the HTML."
			>
				<ReviewCarousel
					eyebrow="What people say"
					score="4.9"
					outOf="5"
					rating={5}
					caption="212 reviews"
					profileUrl="https://reviews.example.com"
					lead="From the reviews on our profile, the newest first."
					stats={[
						{ value: "212", label: "Reviews" },
						{ value: "96%", label: "Five stars" },
						{ value: "12 yrs", label: "On Alder" },
					]}
					items={reviews.slice(0, 3)}
				/>
			</Specimen>

			<Specimen
				id="review-wall"
				name="ReviewWall"
				lead="The reviews page: a tag filter and a sort appear on their own when the data carries tags and dates; long quotes clamp behind Read more."
			>
				<Band alt>
					<ReviewWall
						eyebrow="Reviews"
						title="Twelve years of Saturday mornings."
						items={reviews}
						clampAt={4}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="press-quotes"
				name="PressQuotes"
				lead="Rows of press quotes and awards, each citing its source and year, newest first."
			>
				<Band>
					<PressQuotes
						items={[
							{
								quote: "The best morning bun in the county, and it is not close.",
								source: "Fairhaven Weekly",
								year: 2025,
								href: "https://press.example.com/1",
							},
							{ quote: "Best Bakery, readers' choice.", source: "Front Range Eats", year: 2023 },
							{
								quote: "A bakery that still closes when it sells out.",
								source: "The Mill Review",
								year: 2019,
							},
						]}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="profile-cards"
				name="ProfileCards"
				lead="Equal weight cards of media beside a short bio, for a team where nobody ranks first."
			>
				<ProfileCards
					eyebrow="The bakers"
					title="Who is up at three."
					items={[
						{
							name: "Ines Calder",
							meta: "Head baker",
							blurb: "Opened the shop in 2014 after a decade on the line in restaurant kitchens.",
							placeholder: "Portrait: Ines at the bench",
						},
						{
							name: "Theo Marsh",
							meta: "Pastry",
							blurb: "Runs the laminated doughs and the seasonal galette.",
							placeholder: "Portrait: Theo with a tray of buns",
						},
						{
							name: "Rosa Lind",
							meta: "Cakes",
							blurb: "Takes every cake order and letters every name.",
							placeholder: "Portrait: Rosa piping a cake",
						},
					]}
				/>
			</Specimen>

			<Specimen
				id="gallery"
				name="Gallery"
				lead="A captioned wall of the business's own work; a photo with no source renders its shot brief."
			>
				<PhotoGallery
					eyebrow="From the oven"
					title="This week's bake."
					columns={3}
					surface="alt"
					photos={[
						{ placeholder: "Country sourdough, scored", caption: "Country sourdough" },
						{ placeholder: "Morning buns in the tray", caption: "Morning buns" },
						{ placeholder: "A tiered birthday cake", caption: "A three tier birthday cake" },
					]}
					footnote="Photographed in the shop."
				/>
			</Specimen>

			<Specimen
				id="credential-list"
				name="CredentialList"
				lead="Credential cards with a mono code before each; two up on a wide screen."
			>
				<Band>
					<CredentialList
						items={[
							{
								code: "CFH",
								title: "Certified food handler",
								detail: "Every baker, renewed yearly",
							},
							{ code: "WBA", title: "Wholesale bakery license", detail: "Since 2016" },
							{ code: "GF", title: "Gluten free protocol", detail: "Separate oven, first bake" },
						]}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="social-strip"
				name="SocialStrip"
				lead="A static grid of the business's own social photos, every tile linking to the profile; never a live embed."
			>
				<SocialStrip
					eyebrow="Follow along"
					title="The bake, every morning."
					handle="@kestrelhollow"
					profileUrl="https://social.example.com/kestrelhollow"
					photos={[
						{ placeholder: "The morning shelf" },
						{ placeholder: "Scoring" },
						{ placeholder: "The line at 08:00" },
						{ placeholder: "Galette" },
						{ placeholder: "The walk in" },
					]}
				/>
			</Specimen>
		</MarketingGroup>
	);
}
