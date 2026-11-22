import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect } from "storybook/test";
import { ClosingBar, Footer, type NavLink, SiteHeader, StickyCTABar } from "../../src/chrome";
import { StatRow, Tabs } from "../../src/components";
import { Button, Chip, Eyebrow } from "../../src/primitives";
import {
	ContactInfoCard,
	CTASection,
	FAQBrowser,
	LocationSection,
	PricingBand,
	PricingCard,
	ProofStrip,
	ReviewWall,
} from "../../src/sections";
import {
	address,
	brand,
	contact,
	cta,
	email,
	flatLinks,
	groupedLinks,
	phone,
	site,
} from "../fixtures/bakery";
import { faqCategories, reviews } from "../fixtures/sections";
import { brokenWords, expectNoSidewaysScroll } from "../support/geometry";
import { pin } from "../support/viewports";

/**
 * One crowded row, named for the report. `allow` lists a token that is
 * meant to break where it runs longer than its column (an email address).
 */
function Probe({ name, allow, children }: { name: string; allow?: string; children: ReactNode }) {
	return (
		<div data-probe={name} data-allow={allow}>
			{children}
		</div>
	);
}

const columns = [
	{ heading: "Company", links: [{ label: "Our story", href: "/about" }] },
	{ heading: "Resources", links: [{ label: "Wholesale price sheet", href: "/wholesale" }] },
];

/** The flat bar at its fullest: five pages, the phone, and the call to action. */
const fiveLinks: NavLink[] = [...flatLinks, { label: "Wholesale", href: "/wholesale" }];

function Rows({ links }: { links: NavLink[] }) {
	return (
		<>
			<Probe name="header">
				<SiteHeader
					brand={brand}
					links={links}
					primaryCTA={cta}
					contact={contact}
					phone={phone}
					currentPath="/menu"
				/>
			</Probe>
			<div style={{ height: 96 }} />
			<Probe name="cta-buttons">
				<CTASection
					site={site}
					title="Skip the line, order ahead"
					secondary={{ label: "Wholesale", href: "/wholesale" }}
				/>
			</Probe>
			<Probe name="proof-strip">
				<ProofStrip
					ariaLabel="Why the line is long"
					items={[
						{ value: "Since 2014", label: "On Alder Street" },
						{ value: "1,200 loaves", label: "Baked every week" },
						{ value: "11 cafes", label: "Carry the morning bake" },
						{ value: "Two days", label: "Notice for a cake" },
					]}
				/>
			</Probe>
			<section className="section">
				<div className="wrap">
					<Probe name="chips">
						<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
							<Chip dot>Wholesale</Chip>
							<Chip>Sourdough</Chip>
							<Chip>Gluten free Saturdays</Chip>
							<Chip>Since 2014</Chip>
						</div>
					</Probe>
					<Probe name="eyebrow">
						<Eyebrow>Wholesale and standing orders</Eyebrow>
					</Probe>
					<Probe name="button-row">
						<div style={{ display: "flex", gap: 12 }}>
							<Button href="/order" arrow>
								Reservations
							</Button>
							<Button variant="ghost" href={`tel:${phone.e164}`}>
								{phone.display}
							</Button>
						</div>
					</Probe>
					<Probe name="stats">
						<StatRow
							stats={[
								{ value: "$1,240", unit: "/mo", label: "Wholesale" },
								{ value: "3,948", label: "Loaves" },
								{ value: "23%", label: "Growth" },
							]}
						/>
					</Probe>
					<Probe name="tabs">
						<Tabs
							ariaLabel="What the bakery bakes"
							tabs={[
								{ id: "bread", label: "Bread", content: <p>Sourdough daily.</p> },
								{ id: "pastry", label: "Pastry", content: <p>Buns.</p> },
								{ id: "cakes", label: "Cakes", content: <p>To order.</p> },
								{ id: "wholesale", label: "Wholesale", content: <p>Cafes.</p> },
							]}
						/>
					</Probe>
					<Probe name="pricing-card">
						<PricingCard
							price="$1,480"
							per="/ month"
							ticks={["Two days' notice"]}
							cta={{ label: "Order a cake", href: "/cakes/order" }}
						/>
					</Probe>
					<Probe name="contact-card" allow={email}>
						<ContactInfoCard site={site} />
					</Probe>
				</div>
			</section>
			<Probe name="pricing-band">
				<PricingBand
					title="One price a loaf"
					price="$1,480"
					unit="/ month"
					detail={{ label: "See the price sheet", href: "/wholesale/prices" }}
				/>
			</Probe>
			<Probe name="location">
				<LocationSection site={site} title="On Alder Street" />
			</Probe>
			<Probe name="faq-toolbar">
				<FAQBrowser hero={{ title: "Ask the bakery" }} categories={faqCategories} />
			</Probe>
			<section className="section">
				<div className="wrap">
					<Probe name="review-wall">
						<ReviewWall title="What the line says" items={reviews} allTagsLabel="Everything" />
					</Probe>
				</div>
			</section>
			<Probe name="footer">
				<Footer
					brand={brand}
					rating="4.9 on Google"
					address={address}
					phone={phone}
					email={email}
					columns={columns}
				/>
			</Probe>
			<Probe name="closing-bar">
				<ClosingBar name="Kestrel Hollow Bakehouse" />
			</Probe>
			<Probe name="sticky-bar">
				<StickyCTABar primaryCTA={cta} phone={phone} fromTop />
			</Probe>
		</>
	);
}

/**
 * The rows the root's `overflow-wrap: anywhere` could squeeze: a flex row
 * whose items it lets shrink below their longest word. Every probe's words
 * stay whole at the narrowest width each layout runs at: a phone, the
 * narrowest desktop bar, and the narrowest bar holding groups. What holds
 * them: the brand's name keeps its words (chrome.css), a button's label is
 * break-word so a row wraps a button rather than squeezing it, a price never
 * breaks, and a phone number link never breaks (defaults.css). An email
 * address is meant to break inside its column, so the contact card allows it.
 */
const meta = {
	title: "Foundations/CrowdedRows",
	render: (_args, { parameters }) => (
		<Rows links={(parameters.links as NavLink[] | undefined) ?? fiveLinks} />
	),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every probe's words the browser cut in two, by probe; empty when every row holds. */
async function report(root: HTMLElement) {
	const found: Record<string, string[]> = {};
	for (const probe of root.querySelectorAll<HTMLElement>("[data-probe]")) {
		const broken = brokenWords(probe).filter((word) => word !== probe.dataset.allow);
		if (broken.length) found[probe.dataset.probe as string] = broken;
	}
	return found;
}

export const OnAPhone: Story = {
	globals: pin("phone"),
	play: async ({ canvasElement }) => {
		await expect(await report(canvasElement)).toEqual({});
		await expectNoSidewaysScroll();
	},
};

export const OnASmallDesktop: Story = {
	globals: pin("smallDesktop"),
	play: async ({ canvasElement }) => {
		await expect(await report(canvasElement)).toEqual({});
		await expectNoSidewaysScroll();
	},
};

/** The bar holding groups at the narrowest width it shows them at. */
export const GroupsOnANarrowDesktop: Story = {
	globals: pin("narrowDesktop"),
	parameters: { links: groupedLinks },
	play: async ({ canvasElement }) => {
		await expect(await report(canvasElement)).toEqual({});
		await expectNoSidewaysScroll();
	},
};
