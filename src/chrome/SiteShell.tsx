import { type ReactNode, useRef } from "react";
import { Watermark } from "../components/Watermark";
import type { PageStop } from "../hooks/useScrollSpy";
import { BasePathProvider } from "../routing/BasePathProvider";
import { joinBase, normalizeBasePath, stripBase } from "../routing/basePath";
import type { Density, NavItem, SiteConfig } from "../sections/siteConfig";
import type { FooterColumn, NavLink, NavPanelSection } from "../types";
import { ClosingBar } from "./ClosingBar";
import { ContactDock } from "./ContactDock";
import { Copyright } from "./Copyright";
import { Footer } from "./Footer";
import { isLinkColumn } from "./navSections";
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
	/**
	 * Home style pages with a full bleed hero get a transparent header, and
	 * their hero sits under it. Every other page starts below the fixed
	 * header: `<main>` clears it here, once, so no section has to.
	 */
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
	 * The practice's credit on the closing bar's right side. Defaults on
	 * (client sites carry it); the practice's own site turns it off, since
	 * crediting yourself on your own page reads as noise. Off leaves the right
	 * side empty unless the site gives a note. The copyright prints either way.
	 */
	credit?: boolean;
	/**
	 * The section spacing, set on the `.atelic-ui` root as `data-density`.
	 * Defaults to `site.density`, then `default`; `comfortable` is the roomier
	 * spacing sites had before 8.0.0, close to it though not to the pixel.
	 */
	density?: Density;
	/**
	 * Mounts the contact dock when the config supplies `contactDock`.
	 * Defaults on; a page that closes on its own ask turns it off.
	 */
	contactDock?: boolean;
	children: ReactNode;
}

/**
 * The marketing page wrapper: the `.atelic-ui` scope around the skip link,
 * the header, `<main>`, the sticky CTA bar, the footer with its closing bar,
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
	density,
	contactDock = true,
	children,
}: SiteShellProps) {
	const base = normalizeBasePath(basePath ?? site.basePath);
	const withBase = (path: string) => joinBase(base, path);
	// Every href and src handed to the chrome carries the base path (a no op at
	// the root). The current path is compared against those hrefs, so it is
	// put in the same form whether or not the router reports it with the base.
	const pathname = withBase(stripBase(base, currentPath));
	const ownBase = (src: string | undefined) => (src === undefined ? undefined : withBase(src));
	const brand = {
		name: site.name,
		href: withBase("/"),
		logo: {
			...site.logo,
			src: ownBase(site.logo.src),
			onLight: ownBase(site.logo.onLight),
			onDark: ownBase(site.logo.onDark),
		},
	};
	// The contact dock rides above the shell's own footer, or the closing bar
	// standing in for it, held by ref rather than found by a selector.
	const footerRef = useRef<HTMLElement>(null);
	const closingRef = useRef<HTMLDivElement>(null);
	const cta = { ...site.cta, href: withBase(site.cta.href) };
	const based = <T extends { href: string }>(items: T[] | undefined) =>
		items?.map((item) => ({ ...item, href: withBase(item.href) }));
	const image = <T extends { src: string }>(picture: T | undefined) =>
		picture && { ...picture, src: withBase(picture.src) };
	// Every link and picture a panel section holds, based.
	const section = (part: NavPanelSection): NavPanelSection => {
		if (isLinkColumn(part)) {
			return {
				...part,
				href: part.href === undefined ? undefined : withBase(part.href),
				links: part.links.map((link) => ({
					...link,
					href: withBase(link.href),
					children: based(link.children),
				})),
			};
		}
		if (part.kind === "picture") {
			return {
				...part,
				href: withBase(part.href),
				image: { ...part.image, src: withBase(part.image.src) },
			};
		}
		if (part.kind === "rows") return { ...part, rows: based(part.rows) ?? [] };
		return {
			...part,
			cards: part.cards.map((card) => ({
				...card,
				href: withBase(card.href),
				image: image(card.image),
			})),
		};
	};
	// A group carries its sections and its card into the header, every link based.
	const headerLinks: NavLink[] = (nav ?? site.nav).map((item) => ({
		label: item.label,
		href: withBase(item.to),
		allLabel: item.allLabel,
		columns: item.columns?.map(section),
		feature: item.feature && {
			...item.feature,
			cta: { ...item.feature.cta, href: withBase(item.feature.cta.href) },
			image: item.feature.image && {
				...item.feature.image,
				src: withBase(item.feature.image.src),
			},
		},
	}));
	// The footer's Company column lists the entries themselves, never a group's links.
	const links = headerLinks.map(({ label, href }) => ({ label, href }));
	const setting = density ?? site.density;
	const dock = contactDock ? site.contactDock : undefined;
	// The default footer's four columns, drawn from what the config already
	// holds; a site that wants other columns names them in `footer.columns`.
	const footerColumns: FooterColumn[] = site.footer?.columns?.map((column) => ({
		...column,
		links: based(column.links) ?? [],
	})) ?? [
		{ heading: "Company", links },
		{ heading: "Resources", links: based(site.footerLinks) ?? [] },
		{
			heading: "Social",
			links: (based(site.socialLinks) ?? []).map((link) => ({ ...link, external: true })),
		},
		{ heading: "Legal", links: based(site.legalLinks) ?? [] },
	];
	// The header takes one variant. A hero page wins over a dark one: the bar
	// sits transparent over the hero either way, and only its scrolled state
	// differed.
	const variant: SiteHeaderVariant = heroNav ? "transparent" : navOnDark ? "dark" : "solid";

	return (
		<BasePathProvider base={base}>
			<div
				className="atelic-ui"
				data-density={setting && setting !== "default" ? setting : undefined}
			>
				<SkipLink />
				<SiteHeader
					brand={brand}
					links={headerLinks}
					primaryCTA={cta}
					variant={variant}
					currentPath={pathname}
					stops={pageNav}
					hideCTA={hideNavCTA}
					contact={{ phone: site.phone, email: site.email, address: site.address }}
					phones={site.header?.phones}
				/>
				<main id="main" className={heroNav ? undefined : "clears-nav"}>
					{children}
				</main>
				{/* An interior page's first screen has no booking button of its own, so
				    the bar is there from the top; the hero home page keeps the slide in. */}
				{stickyCTA && <StickyCTABar primaryCTA={cta} phone={site.phone} fromTop={!heroNav} />}
				{footer ? (
					<Footer
						brand={brand}
						rating={site.footer?.rating}
						address={site.footer?.showAddress === false ? undefined : site.address}
						addressHref={site.mapLinkURL}
						phone={site.phone}
						email={site.email}
						columns={footerColumns}
						attribution={site.attribution}
						note={site.footer?.note}
						credit={credit}
						ref={footerRef}
					/>
				) : (
					<ClosingBar
						ref={closingRef}
						left={<Copyright name={brand.name} attribution={site.attribution} />}
						right={site.footer?.note ?? (credit ? undefined : null)}
					/>
				)}
				{dock && (
					<ContactDock
						{...dock}
						// The shell's own footer, or the closing bar standing in for it, never
						// a footer element some section on the page holds.
						avoid={footer ? footerRef : closingRef}
						items={dock.items.map((item) =>
							item.href === undefined ? item : { ...item, href: withBase(item.href) },
						)}
					/>
				)}
				<Watermark />
			</div>
		</BasePathProvider>
	);
}
