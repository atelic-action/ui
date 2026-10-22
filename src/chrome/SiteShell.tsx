import type { ReactNode } from "react";
import { Watermark } from "../components/Watermark";
import type { PageStop } from "../hooks/useScrollSpy";
import { formatHoursRange } from "../lib/hours";
import { BasePathProvider } from "../routing/BasePathProvider";
import { joinBase, normalizeBasePath, stripBase } from "../routing/basePath";
import type { NavItem, SiteConfig } from "../sections/siteConfig";
import { CreditBar } from "./CreditBar";
import { Footer } from "./Footer";
import { SiteHeader, type SiteHeaderVariant } from "./SiteHeader";
import { SkipLink } from "./SkipLink";
import { StickyCTABar } from "./StickyCTABar";

export interface SiteShellProps {
	site: SiteConfig;
	/**
	 * The path being read, from the site's own router, with or without the
	 * base path. The package imports no router, so a site's wrapper passes it.
	 */
	currentPath: string;
	/**
	 * The prefix the site is served under. Defaults to `site.basePath`; a site
	 * whose build sets the base another way (a rehearsal build under
	 * `VITE_BASE_PATH`) passes what the build used. The shell mounts
	 * `BasePathProvider` with it, so every section inside reads the same base.
	 */
	basePath?: string;
	/** The header's links. Defaults to `site.nav`; the footer lists the same ones. */
	nav?: NavItem[];
	/** Home style pages with a full bleed hero get a transparent header. */
	heroNav?: boolean;
	/**
	 * A page that closes on its own ask turns the mobile booking bar off,
	 * since that ask is the conversion surface there.
	 */
	stickyCTA?: boolean;
	/**
	 * Such a page also drops the site footer: when a page ends on its own
	 * sign off, the NAP footer after it steps on the close.
	 */
	footer?: boolean;
	/** Presentation mode: the page's stops replace the nav links and the CTA. */
	pageNav?: PageStop[];
	/** Match the header to a dark page surface. */
	navOnDark?: boolean;
	/** Hide the header's primary CTA (e.g. a reveal, where the ask is the letter). The menu keeps it. */
	hideNavCTA?: boolean;
	/**
	 * The developer credit band. Defaults on (client sites carry it); the
	 * practice's own site turns it off, since crediting yourself on your
	 * own page reads as noise.
	 */
	credit?: boolean;
	children: ReactNode;
}

/**
 * The marketing page wrapper: the `.atelic-ui` scope around the skip link,
 * the header, `<main>`, the sticky CTA bar, the footer with its credit band,
 * and the watermark, all mapped from the site's config. Moved here from
 * template-marketing in 0.19.0 (ATE-643); a site keeps a wrapper a few lines
 * long that reads the path from its router and passes it in.
 */
export function SiteShell({
	site,
	currentPath,
	basePath,
	nav,
	heroNav = false,
	stickyCTA = true,
	footer = true,
	pageNav,
	navOnDark = false,
	hideNavCTA = false,
	credit = true,
	children,
}: SiteShellProps) {
	const base = normalizeBasePath(basePath ?? site.basePath);
	const withBase = (path: string) => joinBase(base, path);
	// Every href and src handed to the chrome carries the base path (a no op at
	// the root). The current path is compared against those hrefs, so it is
	// put in the same form whether or not the router reports it with the base.
	const pathname = withBase(stripBase(base, currentPath));
	const brand = {
		name: site.name,
		href: withBase("/"),
		logo: { ...site.logo, src: site.logo.src === undefined ? undefined : withBase(site.logo.src) },
	};
	const links = (nav ?? site.nav).map((item) => ({ label: item.label, href: withBase(item.to) }));
	const cta = { ...site.cta, href: withBase(site.cta.href) };
	const based = <T extends { href: string }>(items: T[] | undefined) =>
		items?.map((item) => ({ ...item, href: withBase(item.href) }));
	// The header takes one variant. A hero page wins over a dark one: the bar
	// sits transparent over the hero either way, and only its scrolled state
	// differed.
	const variant: SiteHeaderVariant = heroNav ? "transparent" : navOnDark ? "dark" : "solid";

	return (
		<BasePathProvider base={base}>
			<div className="atelic-ui">
				<SkipLink />
				<SiteHeader
					brand={brand}
					links={links}
					primaryCTA={cta}
					variant={variant}
					currentPath={pathname}
					stops={pageNav}
					hideCTA={hideNavCTA}
					contact={{ phone: site.phone, email: site.email, address: site.address }}
				/>
				<main id="main">{children}</main>
				{stickyCTA && <StickyCTABar primaryCTA={cta} phone={site.phone} />}
				{footer ? (
					<Footer
						brand={brand}
						blurb={site.footerBlurb}
						socialLinks={based(site.socialLinks)}
						links={links}
						extraLinks={based(site.footerLinks)}
						contactHeading={site.footer?.contactHeading}
						address={site.footer?.showAddress === false ? undefined : site.address}
						phone={site.phone}
						email={site.email}
						hours={site.hours.map((row) => ({
							label: row.labelShort,
							range: formatHoursRange(row, { short: true, clock: site.clock }),
						}))}
						attribution={site.attribution}
						note={site.footer?.note}
						legalLinks={based(site.legalLinks)}
						credit={credit}
					/>
				) : (
					credit && <CreditBar />
				)}
				<Watermark />
			</div>
		</BasePathProvider>
	);
}
