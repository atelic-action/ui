import {
	ContactForm,
	ContactInfoCard,
	FAQBrowser,
	HoursTable,
	LocationSection,
	Locations,
	MapEmbed,
} from "../src/sections";
import { bakery, bakeryNoImage } from "./marketing-data";
import { Band, MarketingGroup, Specimen } from "./marketing-parts";

/** The sections that get a customer to the door, or to an answer. */
export function MarketingVisit() {
	return (
		<MarketingGroup
			id="marketing-visit"
			title="Visit and Contact"
			lead="Where the business is, when it is open, how to reach it, and the questions people ask first. These read the site's config through their site prop."
		>
			<Specimen
				id="location-section"
				name="LocationSection"
				lead="The local search section: the service area as prose, the hours, directions, and the map screenshot."
			>
				<LocationSection
					site={bakery}
					title="On Alder Street, by the old mill."
					lead="Street parking out front, and the bike rack is ours."
				/>
			</Specimen>

			<Specimen
				id="map-embed"
				name="MapEmbed"
				lead="With no map screenshot, the click to load facade over the live embed, which loads nothing until asked."
			>
				<Band>
					<div style={{ maxWidth: 560 }}>
						<MapEmbed site={bakeryNoImage} />
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="hours-table"
				name="HoursTable"
				lead="Day rows with dashed rules and mono times; a row without times reads Closed or its note. The second table is the same hours on the 24 hour clock, which a site opts into by setting clock to 24h in its config."
			>
				<Band>
					<div style={{ maxWidth: 420 }}>
						<HoursTable hours={bakery.hours} />
					</div>
				</Band>
				<Band alt>
					<div style={{ maxWidth: 420 }}>
						<HoursTable hours={bakery.hours} clock="24h" />
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="locations"
				name="Locations"
				lead="More than one address: the flagship's map beside a card for each location."
			>
				<Locations
					site={bakery}
					title="Two shops, one bake."
					locations={[
						{
							name: "Alder Street",
							note: "The original, since 2014",
							address: "418 Alder Street, Fairhaven",
							hours: ["Tue to Fri · 07:00 to 15:00", "Sat and Sun · 08:00 to 14:00"],
							phoneDisplay: "(555) 555-0142",
							phoneE164: "+15555550142",
							mapLink: "https://maps.example.com/?q=418+Alder+Street",
						},
						{
							name: "Riverside",
							address: "22 Mill Race Road, Fairhaven",
							hours: ["Wed to Sun · 08:00 to 13:00"],
							phoneDisplay: "(555) 555-0187",
							phoneE164: "+15555550187",
							mapLink: "https://maps.example.com/?q=22+Mill+Race+Road",
						},
					]}
				/>
			</Specimen>

			<Specimen
				id="contact-form"
				name="ContactForm and ContactInfoCard"
				lead="The form validates on submit and carries a honeypot; with no endpoint it hands off to the visitor's mail app. The dark card beside it lists the direct lines."
			>
				<Band alt>
					<div className="mg-two">
						<ContactForm
							toEmail={bakery.email}
							topics={["A cake order", "Wholesale", "Something else"]}
							successMessage="Thanks, we will write back within a day."
							footnote="We answer between 15:00 and 17:00, after the bake."
						/>
						<ContactInfoCard site={bakery} title="Reach the shop" />
					</div>
				</Band>
			</Specimen>

			<Specimen
				id="faq-browser"
				name="FAQBrowser, with JumpRail"
				lead="The full help page: live search, a sticky rail of categories with scroll spy, expand all, and a link to each question."
			>
				<FAQBrowser
					hero={{
						eyebrow: "Questions",
						title: "Before you come in.",
						lead: "The things people ask at the counter most.",
					}}
					contactHref="#contact-form"
					categories={[
						{
							id: "orders",
							title: "Orders",
							description: "Cakes, bread club, and holding a loaf.",
							items: [
								{
									id: "how-early-cake",
									question: "How early do I need to order a cake?",
									answer: "Two days for most cakes, a week for anything tiered.",
									answerText: "Two days for most cakes, a week for anything tiered.",
								},
								{
									id: "hold-a-loaf",
									question: "Can you hold a loaf for me?",
									answer: "Yes, until noon, if you order by the evening before.",
									answerText: "Yes, until noon, if you order by the evening before.",
								},
							],
						},
						{
							id: "visiting",
							title: "Visiting",
							tabLabel: "Visiting",
							items: [
								{
									id: "parking",
									question: "Where do I park?",
									answer: "On Alder Street out front, or the lot behind the mill after 09:00.",
									answerText: "On Alder Street out front, or the lot behind the mill after 09:00.",
								},
							],
							cta: { label: "Get directions", href: "#location-section" },
						},
					]}
				/>
			</Specimen>
		</MarketingGroup>
	);
}
