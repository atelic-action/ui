import type { ReactNode } from "react";
import { SectionHeading } from "../primitives";
import { useWithBase } from "../routing/BasePathProvider";

export interface ProfileItem {
	name: string;
	/** One or two sentence bio; keep it shorter than a FeatureDetail lead. */
	blurb: ReactNode;
	/** Example of their work or a portrait. */
	image?: { src: string; alt: string };
	/** Placeholder label rendered until a real image exists. */
	placeholder?: string;
	/** Where the card links (e.g. the person's section on a roster page). */
	href?: string;
	linkLabel?: string;
	/** Small mono line under the name (e.g. an Instagram handle). */
	meta?: string;
}

export interface ProfileCardsProps {
	id?: string;
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	items: ProfileItem[];
}

/**
 * Equal-weight horizontal profile cards: media beside a short bio, no
 * numbering. For rosters and teams where every member carries the same
 * weight (contrast FeatureGrid, whose numbered cards imply an ordering).
 */
export function ProfileCards({ id, eyebrow, title, lead, items }: ProfileCardsProps) {
	const withBase = useWithBase();
	return (
		<section className="section" id={id}>
			<div className="wrap">
				<SectionHeading eyebrow={eyebrow} title={title} lead={lead} />
				<ul className="profile-cards">
					{items.map((item) => {
						const media = item.image ? (
							<img src={withBase(item.image.src)} alt={item.image.alt} loading="lazy" />
						) : (
							<span className="profile-placeholder">{item.placeholder ?? "Photo"}</span>
						);
						const body = (
							<>
								<div className="profile-media">{media}</div>
								<div className="profile-body">
									<h3>{item.name}</h3>
									{item.meta && <span className="profile-meta">{item.meta}</span>}
									<p>{item.blurb}</p>
									{item.href && <span className="profile-link">{item.linkLabel ?? "More"} →</span>}
								</div>
							</>
						);
						return (
							<li key={item.name}>
								{item.href ? (
									<a className="profile-card" href={withBase(item.href)}>
										{body}
									</a>
								) : (
									<div className="profile-card">{body}</div>
								)}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
