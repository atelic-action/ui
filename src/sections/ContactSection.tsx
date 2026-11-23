import type { ReactNode } from "react";
import type { Surface } from "./siteConfig";

export interface ContactSectionProps {
	/** The card's body: the contact form. */
	children: ReactNode;
	/** The card's heading, above its lead; a real heading element a site's heading rules reach. */
	title?: ReactNode;
	/** The line under the card's heading. */
	lead?: ReactNode;
	/** The level the card's heading is drawn at. Defaults to 2. */
	headingLevel?: 2 | 3 | 4;
	/** The card's id, for a link straight to the form (`#message`). */
	cardId?: string;
	/** The column beside the card: whatever the site stacks there (a contact card, info rows, the hours). */
	side?: ReactNode;
	/** The side column's accessible name, which makes it an `aside` landmark; without it, a plain column. */
	sideLabel?: string;
	/** The band's background. Defaults to the page surface. */
	surface?: Surface;
	id?: string;
	className?: string;
}

/**
 * A contact page's body: the form in a card, with an optional heading and
 * lead, beside a column of the other ways to reach the business. The two
 * stand side by side while both columns' bases and the gap fit the width,
 * and stack, the card first, below that, so the section takes the site's
 * width and sets none of its own (Component Rules 19). The ratio, the
 * bases, the gap, and the card's padding are tokens. The card sets
 * `--expandable-ground` to its own ground, so an inline Show more inside
 * the form fades over the card.
 */
export function ContactSection({
	children,
	title,
	lead,
	headingLevel = 2,
	cardId,
	side,
	sideLabel,
	surface = "default",
	id,
	className,
}: ContactSectionProps) {
	const Title = `h${headingLevel}` as const;
	const Side = sideLabel ? "aside" : "div";
	return (
		<section
			className={["section", "contact-section", surface === "alt" && "surface-alt", className]
				.filter(Boolean)
				.join(" ")}
			id={id}
		>
			<div className="wrap contact-section-layout">
				<div className="contact-section-main">
					<div className="contact-section-card" id={cardId}>
						{title && <Title className="contact-section-title">{title}</Title>}
						{lead && <p className="contact-section-lead">{lead}</p>}
						{children}
					</div>
				</div>
				{side && (
					<Side className="contact-section-side" aria-label={sideLabel}>
						{side}
					</Side>
				)}
			</div>
		</section>
	);
}
