import {
	ComparisonTable,
	DeviceShowcase,
	ExpandList,
	FeatureDetail,
	FeatureGrid,
	MenuList,
	PricingCard,
	ProcessSteps,
	RevealSlider,
} from "../src/sections";
import { Band, MarketingGroup, Specimen } from "./marketing-parts";

/** The sections that say what the business offers and how it works. */
export function MarketingOffer() {
	return (
		<MarketingGroup
			id="marketing-offer"
			title="The Offer"
			lead="What the business sells, how it works, and what it costs: the cards, rows, and tables a services or menu page is made of."
		>
			<Specimen
				id="feature-grid"
				name="FeatureGrid"
				lead="Numbered cards with a hover lift; a card is a link or holds one, never both."
			>
				<FeatureGrid
					eyebrow="What we bake"
					title="Four things, done every morning."
					columns={4}
					items={[
						{
							num: "01",
							title: "Sourdough",
							description: "Country, seeded rye, and a weekend olive loaf.",
							href: "#feature-grid",
							linkLabel: "The breads",
						},
						{
							num: "02",
							title: "Pastry",
							description: "Morning buns, croissants, and a seasonal galette.",
						},
						{
							num: "03",
							title: "Cakes",
							description: "Layer cakes to order with two days' notice.",
						},
						{ num: "04", title: "Wholesale", description: "Delivered to cafes before they open." },
					]}
				/>
			</Specimen>

			<Specimen
				id="feature-detail"
				name="FeatureDetail"
				lead="Alternating copy and media rows with tags and a tick list; a row without an image renders its shot brief."
			>
				<Band>
					<FeatureDetail
						num="01"
						eyebrow="The breads"
						title="A long, cold proof."
						tags={["Sourdough", "Overnight", "Stone baked"]}
						lead="Every loaf rests eighteen hours before it meets the oven, which is where the flavor and the crust come from."
						ticks={["Milled within the state", "No commercial yeast", "Baked on the stone deck"]}
						placeholder="Shot brief: a loaf being scored at the bench, flour in the air."
					/>
				</Band>
			</Specimen>

			<Specimen
				id="process-steps"
				name="ProcessSteps"
				lead="A dark band of numbered steps beside a frame."
			>
				<ProcessSteps
					eyebrow="Ordering a cake"
					title="Three steps, two days."
					placeholder="Shot brief: a finished layer cake on the counter, candles in."
					steps={[
						{ title: "Pick a flavor", description: "Six standing flavors and one seasonal." },
						{
							title: "Choose a size",
							description: "Six inch for eight people, eight inch for twelve.",
						},
						{ title: "Pick it up", description: "Boxed and cold, ready at the time you chose." },
					]}
				/>
			</Specimen>

			<Specimen
				id="pricing-card"
				name="PricingCard"
				lead="A standalone price card with a tick list and its booking action, the centerpiece of a pricing page."
			>
				<Band alt>
					<div style={{ maxWidth: 440, marginInline: "auto" }}>
						<PricingCard
							ribbon="Every cake, every flavor"
							price="$58"
							per="for an eight inch layer cake"
							ticks={["Serves twelve", "Lettering included", "Ready in two days"]}
							cta={{ label: "Order a cake", href: "#pricing-card" }}
							secondary={{ label: "See the flavors", href: "#pricing-card" }}
						/>
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="menu-list"
				name="MenuList"
				lead="A priced menu group: dotted rows of name, note, and price, with fine print under it."
			>
				<Band>
					<div className="mg-two">
						<MenuList
							heading="Bread"
							items={[
								{ name: "Country sourdough", note: "Our daily loaf", price: "$9" },
								{ name: "Seeded rye", price: "$10" },
								{ name: "Baguette", note: "From 11:00", price: "$4" },
							]}
							foot="Half loaves on request."
						/>
						<MenuList
							heading="Pastry"
							items={[
								{ name: "Morning bun", note: "Orange sugar", price: "$5" },
								{ name: "Croissant", price: "$4.50" },
								{ name: "Seasonal galette", price: "$6 to $8" },
							]}
						/>
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="expand-list"
				name="ExpandList"
				lead="A light accordion of numbered rows, for add ons that do not need the full FAQ browser."
			>
				<Band>
					<ExpandList
						items={[
							{
								title: "Candles and lettering",
								body: "Included with every cake; tell us the name when you order.",
							},
							{
								title: "Gluten free",
								body: "One gluten free cake a day, baked first in a clean oven.",
							},
							{
								title: "Delivery",
								body: "Within Fairhaven for $12, on orders of two cakes or more.",
							},
						]}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="comparison-table"
				name="ComparisonTable"
				lead="A graded before and after, one row per graded area; a changed grade wears the primary color."
			>
				<Band>
					<ComparisonTable
						columns={{ stage: "Area", before: "Before", after: "After" }}
						rows={[
							{
								id: "menu",
								stage: "Menu",
								before: { grade: "D", points: ["A photo of the chalkboard"] },
								after: { grade: "A", points: ["Text, readable on a phone"] },
							},
							{
								id: "hours",
								stage: "Hours",
								before: { grade: "C", points: ["Sunday disagreed with the map"] },
								after: { grade: "A", points: ["One set of hours everywhere"] },
							},
							{
								id: "speed",
								stage: "Speed",
								before: { grade: "B", points: ["3.1 s to first paint"] },
								after: { grade: "B", points: ["Held while the photos are reshot"] },
							},
						]}
						footnote="Graded 2026-10-01; every figure here is made up."
					/>
				</Band>
			</Specimen>

			<Specimen
				id="reveal-slider"
				name="RevealSlider"
				lead="Drag to compare two frames; with no images, each side shows its own toned shot brief."
			>
				<Band>
					<RevealSlider
						ariaLabel="The old menu page and the new one"
						before={{
							label: "Before",
							placeholder: "The chalkboard photo, unreadable at phone width",
						}}
						after={{ label: "After", placeholder: "The menu as text, in two columns" }}
						startAt={50}
					/>
				</Band>
			</Specimen>

			<Specimen
				id="device-showcase"
				name="DeviceShowcase"
				lead="A desktop browser frame with a phone overlapping it, for showing a rebuilt site."
			>
				<Band alt>
					<DeviceShowcase
						desktop={{ src: "/images/bakery-desktop.svg", alt: "The home page on a laptop" }}
						phone={{ src: "/images/bakery-phone.svg", alt: "The home page on a phone" }}
					/>
				</Band>
			</Specimen>
		</MarketingGroup>
	);
}
