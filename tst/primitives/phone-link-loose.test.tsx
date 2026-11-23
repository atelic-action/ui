import { render, screen } from "@testing-library/react";
import { Footer, SiteHeader, SiteMenu, StickyCTABar } from "../../src/chrome";
import { EmailLink } from "../../src/primitives/EmailLink";
import { PhoneLink } from "../../src/primitives/PhoneLink";
import { ContactInfoCard, LocationSection, Locations } from "../../src/sections";
import { testSite } from "../sections/site-fixture";

/*
 * The browser is never stricter than it was: a configured number links its
 * e164 exactly as the hand written tel:${e164} did in 8.4.0, loose ones
 * included, and a configured address links as given. The build guard is
 * where a loose one is caught (tst/scripts/check-contacts.test.ts).
 */
const LOOSE = ["13035551212", "+1 303 555 1212", "303-555-1212"];
const brand = { name: "Kestrel" };

const hrefs = () => screen.getAllByRole("link").map((link) => link.getAttribute("href"));

describe.each(LOOSE)("a configured number written %j", (e164) => {
	const phone = { e164, display: "(303) 555-1212" };
	const expected = `tel:${e164}`;

	it("links as 8.4.0 did in PhoneLink", () => {
		render(<PhoneLink phone={phone} />);
		expect(screen.getByRole("link")).toHaveAttribute("href", expected);
	});

	it("links as 8.4.0 did in Locations", () => {
		render(
			<Locations
				site={testSite}
				title="Find us"
				locations={[
					{
						name: "Alder",
						address: "418 Alder Street",
						hours: [],
						phoneDisplay: "(303) 555-1212",
						phoneE164: e164,
						mapLink: "https://maps.example.com/",
					},
				]}
			/>,
		);
		expect(hrefs()).toContain(expected);
	});

	it("links as 8.4.0 did in the header's numbers and its icon only call", () => {
		render(<SiteHeader brand={brand} phones={[{ ...phone, label: "Shop" }]} />);
		expect(hrefs().filter((href) => href === expected)).toHaveLength(2);
	});

	it("links as 8.4.0 did in the sticky bar's call button", () => {
		render(<StickyCTABar primaryCTA={{ label: "Order", href: "/order" }} phone={phone} fromTop />);
		expect(hrefs()).toContain(expected);
	});

	it("keeps LocationSection's call button a link, as 8.4.0 did", () => {
		render(<LocationSection site={{ ...testSite, phone }} title="Visit" />);
		const call = screen.getByRole("link", { name: /\(303\) 555-1212/ });
		expect(call).toHaveAttribute("href", expected);
	});

	it("links as 8.4.0 did in the contact card, the footer, and the phone menu", () => {
		render(<ContactInfoCard site={{ ...testSite, phone }} />);
		render(<Footer brand={brand} phone={phone} email="hello@example.com" />);
		render(<SiteMenu brand={brand} links={[]} contact={{ phone }} open />);
		expect(hrefs().filter((href) => href === expected).length).toBeGreaterThanOrEqual(3);
	});
});

describe("what stays unlinked", () => {
	afterEach(() => vi.restoreAllMocks());

	it("a configured number with no digit to dial", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		render(<PhoneLink phone={{ e164: "", display: "Not listed" }} />);
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("a typed number with no digit, while a typed one it cannot read still dials its digits", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		render(<PhoneLink phone="call us" />);
		expect(screen.queryByRole("link")).toBeNull();
		render(<PhoneLink phone="555-0142" />);
		expect(screen.getByRole("link")).toHaveAttribute("href", "tel:5550142");
	});

	it("dials what a dialer can take from a typed number it cannot read: extension dropped, + kept", () => {
		render(<PhoneLink phone="555-0142 ext. 9" />);
		render(<PhoneLink phone="+12 34" />);
		expect(hrefs()).toEqual(["tel:5550142", "tel:+1234"]);
	});

	it("an address that is not a string draws no link and never throws", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(() => render(<EmailLink email={undefined as unknown as string} />)).not.toThrow();
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("an address links as given, loose or not, and only an empty one is words", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		render(<EmailLink email="hello@shop">hello@shop</EmailLink>);
		expect(screen.getByRole("link")).toHaveAttribute("href", "mailto:hello@shop");
		render(<EmailLink email="">No address yet</EmailLink>);
		expect(screen.getAllByRole("link")).toHaveLength(1);
	});
});
