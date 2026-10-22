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

const creditBand = (container: HTMLElement) => container.querySelector(".credit-bar");

/*
 * The chrome's own behavior is tested beside each piece. What is worth locking
 * here is the composition: which pieces SiteShell renders for each of its
 * props, and that SiteConfig reaches them intact.
 */
describe("SiteShell", () => {
	it("renders the header, the page, the footer, and the credit band beneath it", () => {
		const { container } = renderShell();

		const header = screen.getByRole("banner");
		expect(within(header).getByRole("link", { name: "Test Practice home" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText("Page body").closest("main")).toHaveAttribute("id", "main");

		const footer = screen.getByRole("contentinfo");
		expect(within(footer).getByRole("heading", { name: "Visit" })).toBeInTheDocument();
		expect(footer.querySelector("address.nap")?.textContent).toContain("Denver, CO 80205");

		const credit = creditBand(container);
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

	it("keeps a standalone credit band when the footer is off", () => {
		const { container } = renderShell({ footer: false });
		expect(screen.queryByRole("contentinfo")).toBeNull();
		expect(creditBand(container)).not.toBeNull();
	});

	it("drops the credit band when credit is off, with or without the footer", () => {
		const withFooter = renderShell({ credit: false });
		expect(screen.getByRole("contentinfo")).toBeInTheDocument();
		expect(creditBand(withFooter.container)).toBeNull();
		withFooter.unmount();

		const bare = renderShell({ footer: false, credit: false });
		expect(screen.queryByRole("contentinfo")).toBeNull();
		expect(creditBand(bare.container)).toBeNull();
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

	it("maps heroNav to the transparent header and navOnDark to the dark one", () => {
		const hero = renderShell({ heroNav: true });
		expect(hero.container.querySelector("header.nav")).toHaveClass("is-transparent");
		hero.unmount();

		const dark = renderShell({ navOnDark: true });
		expect(dark.container.querySelector("header.nav")).toHaveClass("is-solid", "nav-dark");
	});

	it("carries the footer overrides and formats the hours compactly", () => {
		const site: SiteConfig = {
			...testSite,
			footer: { contactHeading: "Get in touch", showAddress: false, note: "A closing note" },
			hours: [
				{ label: "Monday", labelShort: "Mon", days: ["Monday"], opens: "11:00", closes: "19:00" },
				{ label: "Sunday", labelShort: "Sun", days: [] },
			],
		};
		renderShell({}, site);

		const footer = screen.getByRole("contentinfo");
		expect(within(footer).getByRole("heading", { name: "Get in touch" })).toBeInTheDocument();
		expect(footer.querySelector("address.nap")?.textContent).not.toContain("123 Main St");
		expect(within(footer).getByRole("link", { name: testSite.email })).toBeInTheDocument();
		expect(within(footer).getByText("A closing note")).toBeInTheDocument();
		const hours = footer.querySelector(".footer-hours")?.textContent?.replace(/\s+/g, " ");
		expect(hours).toContain("Mon 11a to 7p");
		expect(hours).toContain("Sun Closed");
	});

	it("prints the footer hours on the 24 hour clock when the site opts in", () => {
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
			],
		};
		renderShell({}, site);

		const footer = screen.getByRole("contentinfo");
		const hours = footer.querySelector(".footer-hours")?.textContent?.replace(/\s+/g, " ");
		expect(hours).toContain("Mon to Fri 09:00 to 17:00");
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
