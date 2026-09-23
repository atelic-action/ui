import type { ReactNode } from "react";
import { newTabProps } from "../lib/newTabProps";
import type { CallToAction, NavLink } from "../types";

export interface NotFoundProps {
	/** The kicker above the headline. Defaults to "404". */
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	/** A short list of pages worth landing on, usually the nav without Home. */
	links?: NavLink[];
	/** The heading and accessible name of the links row. Defaults to "Popular Pages". */
	linksLabel?: string;
	/** The closing section's kicker and headline. */
	closing: { eyebrow?: string; title: ReactNode };
	/** The site's primary conversion action, rendered first. */
	primaryCTA: CallToAction;
	/** The ghost action beside it. Defaults to "Back to Home" at "/". */
	secondary?: NavLink;
}

/**
 * The page a missing path renders: a headline, a row of popular pages, and
 * the closing call to action. It renders the page body only; a site wraps it
 * in its own shell, as it does every page. The markup wears the site's own
 * classes (.page-hero, .eyebrow, .lead, .final-cta, .btn), so a site that
 * styles them gets its own look, and components.css covers the layout where
 * it does not.
 *
 * Keeping it alive through hydration takes routing as well as markup; see
 * staticNotFoundRouting in the routing entry.
 */
export function NotFound({
	eyebrow = "404",
	title,
	lead,
	links = [],
	linksLabel = "Popular Pages",
	closing,
	primaryCTA,
	secondary = { label: "Back to Home", href: "/" },
}: NotFoundProps) {
	return (
		<>
			<section className="page-hero not-found-hero">
				<div className="wrap">
					<span className="eyebrow">{eyebrow}</span>
					<h1>{title}</h1>
					{lead && <p className="lead">{lead}</p>}
				</div>
			</section>
			{links.length > 0 && (
				<section className="section not-found-links">
					<div className="wrap center">
						<span className="eyebrow center">{linksLabel}</span>
						<nav aria-label={linksLabel} className="cta-row center">
							{links.map((link) => (
								<a key={link.href} className="btn btn-ghost" href={link.href}>
									{link.label}
								</a>
							))}
						</nav>
					</div>
				</section>
			)}
			<section className="section final-cta surface-alt not-found-closing">
				<div className="wrap center">
					{closing.eyebrow && <span className="eyebrow center">{closing.eyebrow}</span>}
					<h2>{closing.title}</h2>
					<div className="cta-row center">
						<a
							className="btn btn-primary btn-lg"
							href={primaryCTA.href}
							{...newTabProps(primaryCTA.href, primaryCTA.external)}
						>
							{primaryCTA.label}
							<span className="arrow">{"→"}</span>
						</a>
						<a className="btn btn-ghost btn-lg" href={secondary.href}>
							{secondary.label}
						</a>
					</div>
				</div>
			</section>
		</>
	);
}
