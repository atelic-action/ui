import { useState } from "react";
import {
	type Brand,
	BrandLockup,
	type CallToAction,
	CreditBar,
	Footer,
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
	{ label: "Menu", href: "/menu" },
	{ label: "Cakes", href: "/cakes" },
	{ label: "Catering", href: "/catering" },
	{ label: "Visit", href: "/visit" },
];

const cta: CallToAction = { label: "Order Ahead", href: "#site-header" };

const phone: Phone = { e164: "+15555550123", display: "(555) 555-0123" };

const contact: MenuContact = {
	phone,
	email: "hello@example.test",
	address: { street: "1420 Alder Street", locality: "Denver", region: "CO", postalCode: "80205" },
};

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
							currentPath="/menu"
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
							currentPath="/menu"
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
								{ id: "writeup", label: "Writeup" },
								{ id: "report", label: "Report" },
								{ id: "note", label: "Note" },
								{ id: "gate", label: "Gate" },
							]}
						/>
						<FramePage />
					</Frame>
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
			</Piece>

			<Piece
				id="footer"
				title="Footer"
				lead="The site's foot: the brand column with its blurb and icon links, the nav again, the address, phone, and email, the hours, the copyright line, and the credit band under it all."
			>
				<Example caption="Every column filled">
					<Footer
						brand={{
							name: "Kestrel Hollow Bakehouse",
							logo: { src: "/images/kestrel-mark-light.svg", alt: "Kestrel Hollow Bakehouse" },
						}}
						blurb="Bread, pastry, and cakes, mixed, shaped, and baked in the back of the shop."
						socialLinks={[{ label: "Email", href: "mailto:hello@example.test", icon: "mail" }]}
						links={links}
						extraLinks={[
							{ label: "Wholesale", href: "https://example.test/wholesale", external: true },
						]}
						address={contact.address}
						phone={phone}
						email="hello@example.test"
						hours={[
							{ label: "Tue to Fri", range: "07:00 to 15:00" },
							{ label: "Sat to Sun", range: "08:00 to 14:00" },
							{ label: "Mon", range: "Closed" },
						]}
						note="Baked this morning."
						legalLinks={[{ label: "Privacy", href: "#footer" }]}
					/>
				</Example>
			</Piece>

			<Piece
				id="credit-bar"
				title="CreditBar"
				lead="The developer credit: a full width band, centered and muted. The footer renders it at its foot, and a page with no footer, like a sent document, renders it on its own."
			>
				<Example>
					<CreditBar />
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
