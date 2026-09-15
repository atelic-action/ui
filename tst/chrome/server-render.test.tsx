// @vitest-environment node
import { renderToString } from "react-dom/server";
import { CreditBar, Footer, SiteHeader, SkipLink, StickyCTABar } from "../../src/chrome";
import { address, brand, email, links, phone, primaryCTA } from "../fixtures";

/*
 * Every piece prerenders under TanStack Start, where there is no window and
 * no document. Rendering in the node environment proves none of them reaches
 * for either during render, and that the menu ships closed.
 */
describe("server rendering", () => {
	it("runs with no DOM to lean on", () => {
		expect(typeof window).toBe("undefined");
		expect(typeof document).toBe("undefined");
	});

	it("renders the marketing chrome to a string, the menu closed", () => {
		const markup = renderToString(
			<div className="mkt">
				<SkipLink />
				<SiteHeader
					brand={brand}
					links={links}
					primaryCTA={primaryCTA}
					variant="transparent"
					currentPath="/about"
					contact={{ phone, email, address }}
				/>
				<main id="main" />
				<StickyCTABar primaryCTA={primaryCTA} phone={phone} />
				<Footer brand={brand} links={links} address={address} phone={phone} email={email} />
			</div>,
		);

		expect(markup).toContain('class="nav is-transparent"');
		expect(markup).toContain('aria-current="page"');
		expect(markup).toMatch(/<dialog[^>]*class="mobile-menu"/);
		expect(markup).not.toMatch(/<dialog[^>]*\sopen/);
		expect(markup).toContain('class="sticky-CTA"');
		expect(markup).toContain('class="credit-bar"');
	});

	it("renders the artifact chrome: the dark bar with stops, and the credit band alone", () => {
		const markup = renderToString(
			<div className="mkt">
				<SiteHeader brand={brand} variant="dark" stops={[{ id: "plan", label: "Plan" }]} />
				<CreditBar />
			</div>,
		);

		expect(markup).toContain('class="nav is-solid nav-dark"');
		expect(markup).toContain('href="#plan"');
		expect(markup).not.toContain("nav-CTA");
		expect(markup).toContain("Developed with");
	});
});
