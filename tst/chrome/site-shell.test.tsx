import { render, screen, within } from "@testing-library/react";
import { SiteShell } from "../../src/chrome";
import { Button } from "../../src/primitives";
import type { SiteConfig } from "../../src/sections";
import { testSite } from "../sections/site-fixture";

// The package imports no router: a site's wrapper reads the path and passes it.
function renderShell(props: Partial<Parameters<typeof SiteShell>[0]> = {}, site = testSite) {
	return render(
		<SiteShell site={site} currentPath="/about" {...props}>
			<p>Page body</p>
		</SiteShell>,
	);
}

const closingBar = (container: HTMLElement) => container.querySelector(".closing-bar");

/*
 * The chrome's own behavior is tested beside each piece. What is worth locking
 * here is the composition: which pieces SiteShell renders for each of its
 * props, and that SiteConfig reaches them intact.
 */
describe("SiteShell", () => {
	it("renders the header, the page, the footer, and the closing bar beneath it", () => {
		const { container } = renderShell();

		const header = screen.getByRole("banner");
		expect(within(header).getByRole("link", { name: "Test Practice home" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText("Page body").closest("main")).toHaveAttribute("id", "main");

		const footer = screen.getByRole("contentinfo");
		expect(footer.querySelector("address.nap")?.textContent).toContain("Denver, CO 80205");
		const company = within(footer).getByRole("navigation", { name: "Company" });
		expect(within(company).getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");

		const credit = closingBar(container);
		expect(credit).not.toBeNull();
		expect(footer.compareDocumentPosition(credit as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
	});

	it("maps the nav onto the header and marks the current path", () => {
		renderShell();
		const primary = screen.getByRole("navigation", { name: "Primary" });
		expect(within(primary).getByRole("link", { name: "About" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(within(primary).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
	});

	it("keeps a standalone closing bar when the footer is off", () => {
		const { container } = renderShell({ footer: false });
		expect(screen.queryByRole("contentinfo")).toBeNull();
		expect(closingBar(container)).not.toBeNull();
	});

	it("drops the practice's credit when credit is off, and keeps the copyright with the footer off too", () => {
		const withFooter = renderShell({ credit: false });
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
		expect(closingBar(withFooter.container)?.textContent).toContain("Test Practice");
		expect(closingBar(withFooter.container)?.querySelector(".closing-bar-right")).toBeNull();
		withFooter.unmount();

		const bare = renderShell({ footer: false, credit: false });
		expect(screen.queryByRole("contentinfo")).toBeNull();
		expect(closingBar(bare.container)?.textContent).toContain("Test Practice");
		expect(closingBar(bare.container)?.querySelector(".closing-bar-right")).toBeNull();
	});

	it("puts the site CTA in the bar and the menu, and hideNavCTA clears only the bar", () => {
		const shown = renderShell();
		expect(shown.container.querySelector(".nav-cta a")).toHaveAttribute("href", testSite.cta.href);
		expect(shown.container.querySelector(".mm-cta")).toHaveAttribute("href", testSite.cta.href);
		shown.unmount();

		const hidden = renderShell({ hideNavCTA: true });
		expect(hidden.container.querySelector(".nav-cta")).toBeNull();
		expect(hidden.container.querySelector(".mm-cta")).not.toBeNull();
	});

	it("renders the sticky CTA bar unless stickyCTA is off", () => {
		const shown = renderShell();
		expect(shown.container.querySelector(".sticky-cta")).not.toBeNull();
		shown.unmount();
	});

	it("shows the bar from the top on an interior page, and waits for a scroll on a hero page", () => {
		const interior = renderShell();
		expect(interior.container.querySelector(".sticky-cta")).toHaveClass("show");
		interior.unmount();

		const hero = renderShell({ heroNav: true });
		expect(hero.container.querySelector(".sticky-cta")).not.toHaveClass("show");
		hero.unmount();

		const hidden = renderShell({ stickyCTA: false });
		expect(hidden.container.querySelector(".sticky-cta")).toBeNull();
	});

	it("swaps the nav and the CTA for the page's stops in presentation mode", () => {
		const { container } = renderShell({ pageNav: [{ id: "one", label: "One" }] });
		const stops = screen.getByRole("navigation", { name: "Page sections" });
		expect(within(stops).getByRole("link", { name: "One" })).toHaveAttribute("href", "#one");
		expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
		expect(container.querySelector(".nav-cta")).toBeNull();
		expect(container.querySelector(".mm-cta")).toBeNull();
		expect(container.querySelector(".mm-contact")).toBeNull();
	});

	it("clears the fixed header in main, except on a hero page whose hero runs under it", () => {
		const page = renderShell({});
		expect(page.container.querySelector("main#main")).toHaveClass("clears-nav");
		page.unmount();

		const hero = renderShell({ heroNav: true });
		expect(hero.container.querySelector("main#main")).not.toHaveClass("clears-nav");
	});

	it("maps heroNav to the transparent header and navOnDark to the dark one", () => {
		const hero = renderShell({ heroNav: true });
		expect(hero.container.querySelector("header.nav")).toHaveClass("is-transparent");
		hero.unmount();

		const dark = renderShell({ navOnDark: true });
		expect(dark.container.querySelector("header.nav")).toHaveClass("is-solid", "nav-dark");
	});

	it("draws the default footer from the config: the rating, the linked address, and the four columns", () => {
		const site: SiteConfig = {
			...testSite,
			mapLinkURL: "https://maps.example/profile",
			footerLinks: [{ label: "Financing", href: "/financing" }],
			socialLinks: [
				{ label: "Instagram", href: "https://instagram.example/test", icon: "instagram" },
			],
			legalLinks: [{ label: "Privacy", href: "/privacy" }],
			footer: { rating: "4.8 on Google", note: "A closing note" },
		};
		renderShell({}, site);

		const footer = screen.getByRole("contentinfo");
		expect(footer.querySelector(".footer-rating")?.textContent).toBe("4.8 on Google");
		expect(within(footer).getByRole("link", { name: "4.8 on Google" })).toHaveAttribute(
			"href",
			"https://maps.example/profile",
		);
		expect(within(footer).getByRole("link", { name: /123 Main St/ })).toHaveAttribute(
			"href",
			"https://maps.example/profile",
		);
		const headings = Array.from(
			footer.querySelectorAll(".footer-column .footer-heading"),
			(h) => h.textContent,
		);
		expect(headings).toEqual(["Company", "Resources", "Social", "Legal"]);
		const social = within(footer).getByRole("navigation", { name: "Social" });
		expect(within(social).getByRole("link", { name: "Instagram" })).toHaveAttribute(
			"target",
			"_blank",
		);
		expect(screen.getByText("A closing note")).toHaveClass("closing-bar-right");
	});

	it("links the rating to the Google profile, the site's own link first", () => {
		const site: SiteConfig = {
			...testSite,
			mapLinkURL: "https://maps.example/profile",
			footer: { rating: "4.8 on Google" },
		};
		const { unmount } = renderShell({}, site);
		expect(screen.getByRole("link", { name: "4.8 on Google" })).toHaveAttribute(
			"href",
			"https://maps.example/profile",
		);
		unmount();

		renderShell(
			{},
			{
				...site,
				footer: {
					rating: "4.8 on Google",
					ratingHref: "https://reviews.example/test",
					ratingLabel: "4.8 on Google, opens the reviews",
				},
			},
		);
		expect(screen.getByRole("link", { name: "4.8 on Google, opens the reviews" })).toHaveAttribute(
			"href",
			"https://reviews.example/test",
		);
	});

	it("leaves the rating plain when there is no profile to link", () => {
		renderShell({}, { ...testSite, mapLinkURL: undefined, footer: { rating: "4.8 on Google" } });
		const footer = screen.getByRole("contentinfo");
		expect(footer.querySelector(".footer-rating")?.textContent).toBe("4.8 on Google");
		expect(within(footer).queryByRole("link", { name: "4.8 on Google" })).toBeNull();
	});

	it("puts the config's hours in the footer by default, on its clock, and keeps them out when told", () => {
		const site: SiteConfig = {
			...testSite,
			clock: "24h",
			hours: [
				{
					label: "Monday to Friday",
					labelShort: "Mon to Fri",
					days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
					opens: "09:00",
					closes: "17:00",
				},
				{ label: "Saturday", labelShort: "Sat", days: [] },
			],
		};
		const { unmount } = renderShell({}, site);
		const column = screen.getByRole("heading", { name: "Hours" }).parentElement as HTMLElement;
		expect(
			within(column)
				.getAllByRole("term")
				.map((term) => term.textContent),
		).toEqual(["Mon to Fri", "Sat"]);
		expect(
			within(column)
				.getAllByRole("definition")
				.map((d) => d.textContent),
		).toEqual(["09:00 to 17:00", "Closed"]);
		unmount();

		renderShell({}, { ...site, footer: { showHours: false } });
		expect(screen.queryByRole("heading", { name: "Hours" })).toBeNull();
	});

	it("prints the footer's hours as the config says: short on the 12 hour letter clock by default, whole with words when asked, and inside the brand column", () => {
		const hours = [
			{
				label: "Monday to Friday",
				labelShort: "Mon to Fri",
				days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
				opens: "08:00",
				closes: "17:00",
			},
		];
		const ranges = () =>
			within(screen.getByRole("heading", { name: "Hours" }).parentElement as HTMLElement)
				.getAllByRole("definition")
				.map((d) => d.textContent);
		const { unmount } = renderShell({}, { ...testSite, hours });
		expect(ranges()).toEqual(["8a to 5p"]);
		unmount();

		const words = renderShell(
			{},
			{
				...testSite,
				hours,
				meridiem: "word",
				footer: { hoursShort: false, hoursPlacement: "brand" },
			},
		);
		expect(ranges()).toEqual(["8:00 am to 5:00 pm"]);
		const footer = screen.getByRole("contentinfo");
		// Inside the brand column: the address's block holds the hours' heading.
		const nap = footer.querySelector("address") as HTMLElement;
		expect(nap.parentElement).toContainElement(screen.getByRole("heading", { name: "Hours" }));
		words.unmount();
	});

	it("leaves out the columns the config has nothing for, and the address when told to", () => {
		const site: SiteConfig = { ...testSite, footer: { showAddress: false } };
		renderShell({}, site);

		const footer = screen.getByRole("contentinfo");
		const headings = Array.from(
			footer.querySelectorAll(".footer-column .footer-heading"),
			(h) => h.textContent,
		);
		expect(headings).toEqual(["Company"]);
		expect(footer.querySelector("address.nap")?.textContent).not.toContain("123 Main St");
		expect(footer.querySelector(`a[href="mailto:${testSite.email}"]`)?.textContent).toBe(
			testSite.email,
		);
	});

	it("takes the columns a site names outright in place of the derived four", () => {
		const site: SiteConfig = {
			...testSite,
			legalLinks: [{ label: "Privacy", href: "/privacy" }],
			footer: { columns: [{ heading: "Guides", links: [{ label: "Hail", href: "/hail" }] }] },
		};
		renderShell({}, site);

		const footer = screen.getByRole("contentinfo");
		const headings = Array.from(
			footer.querySelectorAll(".footer-column .footer-heading"),
			(h) => h.textContent,
		);
		expect(headings).toEqual(["Guides"]);
	});

	it("wears the .atelic-ui scope", () => {
		const { container } = renderShell();
		expect(container.firstElementChild).toHaveClass("atelic-ui");
	});

	it("takes the header links from nav when given, over site.nav", () => {
		renderShell({ nav: [{ label: "Menu", to: "/menu" }] });
		const primary = screen.getByRole("navigation", { name: "Primary" });
		expect(within(primary).getByRole("link", { name: "Menu" })).toHaveAttribute("href", "/menu");
		expect(within(primary).queryByRole("link", { name: "About" })).toBeNull();
	});

	it("puts the base path on every chrome link and hands it to the page inside", () => {
		const { container } = render(
			<SiteShell site={{ ...testSite, basePath: "/proto" }} currentPath="/proto/about">
				<Button href="/contact">Contact</Button>
			</SiteShell>,
		);
		const header = screen.getByRole("banner");
		expect(within(header).getByRole("link", { name: "Test Practice home" })).toHaveAttribute(
			"href",
			"/proto/",
		);
		const primary = screen.getByRole("navigation", { name: "Primary" });
		const about = within(primary).getByRole("link", { name: "About" });
		expect(about).toHaveAttribute("href", "/proto/about");
		expect(about).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/proto/contact");
		// An external CTA is left as written.
		expect(container.querySelector(".nav-cta a")).toHaveAttribute("href", testSite.cta.href);
	});

	it("marks the current path whether or not the router reports the base, and basePath wins", () => {
		render(
			<SiteShell site={testSite} basePath="/proto" currentPath="/about">
				<p>Page body</p>
			</SiteShell>,
		);
		const primary = screen.getByRole("navigation", { name: "Primary" });
		expect(within(primary).getByRole("link", { name: "About" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(within(primary).getByRole("link", { name: "About" })).toHaveAttribute(
			"href",
			"/proto/about",
		);
	});
});
