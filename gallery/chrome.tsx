import { useEffect, useRef, useState } from "react";
import {
	type Brand,
	BrandLockup,
	type CallToAction,
	ClosingBar,
	ContactDock,
	type ContactDockItem,
	Copyright,
	Credit,
	Footer,
	type HeaderPhone,
	type MenuContact,
	type NavLink,
	type Phone,
	SiteHeader,
	SiteMenu,
	SkipLink,
	StickyCTABar,
} from "../src/chrome";
import { Button } from "../src/primitives";
import { Example, Frame, Piece } from "./parts";

/*
 * The chrome, worn by the made up bakery's own site. Every name, number, and
 * address here is invented; the phone is a 555 number and the email lands on
 * a reserved test domain.
 */

const bakery: Brand = {
	name: "Kestrel Hollow Bakehouse",
	href: "#site-header",
	logo: { src: "/images/kestrel-glyph-light.svg", wordmark: "Kestrel Hollow" },
};

const links: NavLink[] = [
	{ label: "Menu", href: "#menu" },
	{ label: "Cakes", href: "#cakes" },
	{ label: "Catering", href: "#catering" },
	{ label: "Visit", href: "#visit" },
];

const cta: CallToAction = { label: "Order Ahead", href: "#site-header" };

const phone: Phone = { e164: "+15555550123", display: "(555) 555-0123" };

const contact: MenuContact = {
	phone,
	email: "hello@example.test",
	address: { street: "1420 Alder Street", locality: "Denver", region: "CO", postalCode: "80205" },
};

/**
 * The bakery's nav with three groups: what it bakes (link columns with
 * nested links, badges, and the ticked feature card), who it bakes for, and
 * the visit (a picture, icon rows, and cards).
 */
const groupedLinks: NavLink[] = [
	{
		label: "Menu",
		href: "#menu",
		columns: [
			{
				heading: "Bread",
				href: "#bread",
				links: [
					{
						label: "Country sourdough",
						href: "#sourdough",
						children: [
							{ label: "Seeded", href: "#seeded" },
							{ label: "Olive and herb", href: "#olive" },
							{ label: "Half loaves", href: "#half" },
						],
					},
					{ label: "Rye", href: "#rye", children: [{ label: "Caraway", href: "#caraway" }] },
					{ label: "Baguettes", href: "#baguettes", badge: "New" },
				],
			},
			{
				heading: "Pastry",
				links: [
					{ label: "Morning buns", href: "#buns", badge: "Popular" },
					{ label: "Croissants", href: "#croissants" },
					{ label: "Seasonal tarts", href: "#tarts" },
					{ label: "Cakes to order", href: "#cakes", description: "Two days ahead" },
				],
			},
		],
		feature: {
			eyebrow: "Order ahead",
			title: "Skip the Saturday line.",
			points: ["Order by Friday noon", "Pick a pickup time", "Pay at the counter"],
			cta: { label: "Order Ahead", href: "#site-header" },
			image: { src: "/images/bakery-loop-first-frame.jpg", alt: "The bakery's ovens at dawn" },
		},
	},
	{
		label: "Wholesale",
		href: "#wholesale",
		columns: [
			{
				heading: "For cafes",
				links: [
					{ label: "Morning delivery", href: "#delivery", description: "Before you open" },
					{ label: "Standing orders", href: "#standing" },
				],
			},
			{
				heading: "For grocers",
				links: [{ label: "Shelf program", href: "#shelf", description: "Bagged and labeled" }],
			},
		],
	},
	{
		label: "Visit",
		href: "#visit",
		columns: [
			{
				kind: "picture",
				image: { src: "/images/bakery-loop-first-frame.jpg" },
				caption: "Bread from the back of the shop, since 2014.",
				href: "#visit",
			},
			{
				kind: "rows",
				heading: "Plan a visit",
				rows: [
					{
						label: "Order ahead",
						description: "Pick a loaf and a time",
						icon: "calendar",
						href: "#order",
						highlight: true,
					},
					{ label: "Find the shop", description: "1420 Alder Street", icon: "pin", href: "#find" },
					{
						label: "Catering",
						description: "Trays for an office",
						icon: "truck",
						href: "#catering",
					},
					{
						label: "Allergens",
						description: "What is in each bake",
						icon: "shield",
						href: "#allergens",
					},
					{ label: "Questions", description: "Plain answers", icon: "help", href: "#faq" },
					{
						label: "Call the shop",
						description: "Seven to three",
						icon: "phone",
						href: "tel:+15555550123",
					},
				],
			},
			{
				kind: "cards",
				heading: "Latest",
				cards: [
					{
						kicker: "From the blog",
						title: "Why the rye takes three days",
						meta: "4 min read",
						href: "#blog",
					},
					{
						kicker: "This week",
						title: "Pear and almond tart",
						meta: "Saturdays only",
						image: { src: "/images/bakery-loop-first-frame.jpg" },
						href: "#tarts",
					},
				],
			},
		],
	},
	{ label: "About", href: "#about" },
];

const phones: HeaderPhone[] = [
	{ e164: "+15555550123", display: "(555) 555-0123", label: "The shop" },
	{ e164: "+15555550124", display: "(555) 555-0124", label: "Wholesale" },
];

const dockItems: ContactDockItem[] = [
	{
		label: "Order ahead",
		description: "Pick a loaf and a pickup time",
		icon: "calendar",
		href: "#contact-dock",
		lead: true,
	},
	{
		label: "Call (555) 555-0123",
		description: "Seven to three, Tuesday to Sunday",
		icon: "phone",
		href: "tel:+15555550123",
	},
	{
		label: "Send a message",
		description: "We answer within a day",
		icon: "mail",
		href: "#contact-dock",
	},
	{ label: "Find the shop", description: "418 Alder Street", icon: "map", href: "#contact-dock" },
];

/**
 * The grouped header with one group open, the way a hover leaves it. The
 * gallery clicks the group's control once on mount, which pins the panel; a
 * click anywhere else on the page closes it again, as on a site. The frame
 * runs the page's full width at the design's own wrap, so the panel shows at
 * the size a site gives it.
 */
function OpenGroupHeader({ group = 0 }: { group?: number }) {
	const frame = useRef<HTMLDivElement>(null);
	useEffect(() => {
		frame.current?.querySelectorAll<HTMLButtonElement>(".nav-group-btn")[group]?.click();
	}, [group]);
	return (
		<div ref={frame}>
			<Frame height={640} className="gallery-pane-wide">
				<SiteHeader
					brand={bakery}
					links={groupedLinks}
					primaryCTA={cta}
					variant="solid"
					currentPath="#buns"
					contact={contact}
					phones={phones}
				/>
				<FramePage />
			</Frame>
		</div>
	);
}

/** The page behind a framed header: enough to read the bar against. */
function FramePage({ hero = false }: { hero?: boolean }) {
	return (
		<div className={hero ? "gallery-frame-page gallery-hero" : "gallery-frame-page"}>
			<p>
				{hero
					? "Bread from the back of the shop, since 2014."
					: "Country sourdough, rye, and the morning buns."}
			</p>
		</div>
	);
}

function GroupedMenuDemo() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Open the grouped menu</Button>
			<SiteMenu
				open={open}
				onClose={() => setOpen(false)}
				links={groupedLinks}
				primaryCTA={cta}
				contact={contact}
				phones={phones}
				currentPath="#buns"
				label="Kestrel Hollow menu"
			/>
		</>
	);
}

function MenuDemo() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Open the menu</Button>
			<SiteMenu
				open={open}
				onClose={() => setOpen(false)}
				links={links}
				primaryCTA={cta}
				contact={contact}
				label="Kestrel Hollow menu"
			/>
		</>
	);
}

export function ChromePieces() {
	return (
		<>
			<Piece
				id="site-header"
				title="SiteHeader"
				lead="The fixed bar every page wears: the lockup, the nav or the page's own stops, the call to action, and the burger that opens the menu on a phone. Each example sits in a frame that holds the bar the way a page's top edge does; tap the burger on a phone to open the menu over everything."
			>
				<Example caption="Transparent: over a full bleed hero, turning solid once the page scrolls past most of a screen">
					<Frame height={220}>
						<SiteHeader
							brand={bakery}
							links={links}
							primaryCTA={cta}
							variant="transparent"
							currentPath="#menu"
							contact={contact}
						/>
						<FramePage hero />
					</Frame>
				</Example>
				<Example caption="Solid: the light bar, the nav marking the current page, and the call to action">
					<Frame height={150}>
						<SiteHeader
							brand={bakery}
							links={links}
							primaryCTA={cta}
							variant="solid"
							currentPath="#menu"
							contact={contact}
						/>
						<FramePage />
					</Frame>
				</Example>
				<Example caption="Dark: a sent document's bar, the sender's lockup times the recipient's mark, and the page's own stops scroll spied">
					<Frame height={150} className="gallery-frame-dark">
						<SiteHeader
							brand={{
								name: "Atelic",
								href: "https://atelic.me",
								logo: { wordmark: "atelic", run: true },
								recipient: {
									src: "/images/kestrel-mark-light.svg",
									alt: "Kestrel Hollow Bakehouse",
								},
							}}
							variant="dark"
							stops={[
								{ id: "grade-chip", label: "GradeChip" },
								{ id: "sign-off", label: "SignOff" },
								{ id: "shot", label: "Shot" },
								{ id: "paragraph", label: "Paragraph" },
							]}
						/>
						<FramePage />
					</Frame>
				</Example>
				<Example caption="Groups: an entry with columns opens a mega menu panel on a hover, a keyboard focus, or a click, here pinned open on the Menu group: link columns with nested links and badges, a linked column heading, and the feature card with its ticked points, beside the bar's two numbers. Below 1180px the burger carries it all.">
					<OpenGroupHeader />
				</Example>
				<Example caption="The other section kinds, on the Visit group: a picture linked by its caption, icon rows with one highlighted, and cards with and without a picture">
					<OpenGroupHeader group={2} />
				</Example>
			</Piece>

			<Piece
				id="site-menu"
				title="SiteMenu"
				lead="The full screen menu a phone opens from the burger, on a native modal dialog, so Escape, focus containment, and focus return come from the browser. The header renders it; here it opens on its own, over the whole page."
			>
				<Example caption="Opens over the page; Escape or the close button shuts it">
					<MenuDemo />
				</Example>
				<Example caption="Groups: each opens as an accordion, one at a time, and every group starts closed, even the one holding the current page. Children sit indented under their parent with the badges kept; icon rows and cards become plain links and the picture is a link of its caption; the plain entries are numbered, and the phone numbers sit at the foot">
					<GroupedMenuDemo />
				</Example>
			</Piece>

			<Piece
				id="footer"
				title="Footer"
				lead="The default footer: a brand column with the logo, the Google rating as plain text, the one address linked to the Google profile, the phone, and the email; then four link columns, Company, Resources, Social, and Legal; and the closing bar under it all."
			>
				<Example caption="The default: the brand column and four link columns">
					<Footer
						brand={{
							name: "Kestrel Hollow Bakehouse",
							logo: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow Bakehouse" },
						}}
						rating="4.9 on Google"
						address={contact.address}
						addressHref="https://example.test/profile"
						phone={phone}
						email="hello@example.test"
						columns={[
							{ heading: "Company", links },
							{
								heading: "Resources",
								links: [
									{ label: "Wholesale", href: "https://example.test/wholesale", external: true },
									{ label: "Allergens", href: "#footer" },
								],
							},
							{
								heading: "Social",
								links: [
									{
										label: "Instagram",
										href: "https://example.test/instagram",
										icon: "instagram",
										external: true,
									},
									{
										label: "Facebook",
										href: "https://example.test/facebook",
										icon: "facebook",
										external: true,
									},
									{
										label: "Google Reviews",
										href: "https://example.test/reviews",
										icon: "star",
										external: true,
									},
								],
							},
							{
								heading: "Legal",
								links: [
									{ label: "Privacy", href: "#footer" },
									{ label: "Terms", href: "#footer" },
								],
							},
						]}
					/>
				</Example>
			</Piece>

			<Piece
				id="closing-bar"
				title="ClosingBar"
				lead="The line that closes every page, in two sides that each take anything. By default the left is the copyright with the business's name and the right is the practice's credit. The footer renders it at its foot, and a page with no footer renders it on its own: a sent document's shell passes the sender's name, so the document closes the way a site does."
			>
				<Example caption="The defaults: Copyright on the left, Credit on the right">
					<ClosingBar name="Kestrel Hollow Bakehouse" />
				</Example>
				<Example caption="A sent document's close: ArtifactShell passes the sender's name">
					<ClosingBar name="Atelic" />
				</Example>
				<Example caption="The credit off: the right side empty">
					<ClosingBar name="Kestrel Hollow Bakehouse" right={null} />
				</Example>
				<Example caption="A site's own words on the right">
					<ClosingBar name="Kestrel Hollow Bakehouse" right="Baked this morning." />
				</Example>
				<Example caption="Either piece on either side">
					<ClosingBar left={<Credit />} right={<Copyright name="Kestrel Hollow Bakehouse" />} />
				</Example>
				<Example caption="Alone, on a page that names no business">
					<ClosingBar />
				</Example>
			</Piece>

			<Piece
				id="sticky-cta-bar"
				title="StickyCTABar"
				lead="The phone's bottom bar: the call to action and a call shortcut, sliding in once the reader has scrolled. A site shows it on a phone only; this frame shows it at every width, and a threshold of -1 slides it in at once."
			>
				<Example caption="With the call shortcut">
					<Frame height={190}>
						<FramePage />
						<StickyCTABar primaryCTA={cta} phone={phone} threshold={-1} />
					</Frame>
				</Example>
			</Piece>

			<Piece
				id="contact-dock"
				title="ContactDock"
				lead="The floating launcher in the page's corner and the panel of ways to reach the business it opens, each an item passed as data. On a site it sits the same distance from the right and the bottom, lifts over the phone's sticky bar once the bar shows, and rides up above the footer as it scrolls in; these frames hold it at its corner. On a phone the launcher is its icon alone and the panel a sheet across the bottom."
			>
				<Example caption="Closed: the launcher alone">
					<Frame height={150}>
						<FramePage />
						<ContactDock label="Talk to us" items={dockItems} track={false} />
					</Frame>
				</Example>
				<Example caption="Open: the heading, the ways to reach the shop, and the hours at the foot">
					<Frame height={560}>
						<FramePage />
						<ContactDock
							label="Talk to us"
							title="How can we help?"
							subtitle="Order, call, or come by. Whatever is easiest."
							items={dockItems}
							footnote="Open Tuesday to Sunday, seven to three"
							track={false}
							defaultOpen
						/>
					</Frame>
				</Example>
			</Piece>

			<Piece
				id="brand-lockup"
				title="BrandLockup"
				lead="The header's identity as one link: a mark, the wordmark, and the trailing run. On a sent document the recipient's mark follows after a times sign, so the bar names who it is from and who it is for."
			>
				<Example caption="A text wordmark with the run, and a glyph tile">
					<div className="gallery-row">
						<BrandLockup
							brand={{
								name: "Atelic",
								href: "#brand-lockup",
								logo: { wordmark: "atelic", run: true },
							}}
						/>
						<BrandLockup
							brand={{
								name: "Kestrel Hollow Bakehouse",
								href: "#brand-lockup",
								logo: { tile: "K", wordmark: "Kestrel Hollow" },
							}}
						/>
					</div>
				</Example>
				<Example caption="On a dark surface: a mark image, and the sender times the recipient">
					<div className="gallery-row gallery-dark gallery-on-dark">
						<BrandLockup brand={{ ...bakery, href: "#brand-lockup" }} />
						<BrandLockup
							brand={{
								name: "Atelic",
								href: "#brand-lockup",
								logo: { wordmark: "atelic", run: true },
								recipient: {
									src: "/images/kestrel-mark-light.svg",
									alt: "Kestrel Hollow Bakehouse",
								},
							}}
						/>
					</div>
				</Example>
			</Piece>

			<Piece
				id="skip-link"
				title="SkipLink"
				lead="The keyboard user's first stop: hidden until it takes focus, then a jump past the chrome to the main landmark. This page wears one; press Tab at the top to meet it. Here it is held in its focused place."
			>
				<Example caption="As the first Tab shows it">
					<Frame height={90} className="gallery-skip">
						<SkipLink href="#skip-link" />
					</Frame>
				</Example>
			</Piece>
		</>
	);
}
