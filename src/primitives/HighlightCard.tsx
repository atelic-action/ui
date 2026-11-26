import type { ReactNode } from "react";
import { newTabProps } from "../lib/newTabProps";
import { useWithBase } from "../routing/BasePathProvider";
import { ImageFrame } from "./ImageFrame";

export interface HighlightCardProps {
	/** The card's name, a heading by role at `headingLevel`. */
	title: ReactNode;
	/** A small line above the title, e.g. a topic. */
	eyebrow?: ReactNode;
	/** The first line of the body, in the page's ink. */
	body?: ReactNode;
	/** A second, quieter line of the body. */
	detail?: ReactNode;
	/** A small line last, e.g. a date or a reading time. */
	meta?: ReactNode;
	/** A small square picture beside the text. */
	image?: { src: string; alt: string };
	/** The shot brief drawn in the square while there is no `image`; with neither, the card has no picture. */
	placeholder?: string;
	/** Makes the whole card the link. Without it the card is plain. */
	href?: string;
	/** Opens `href` in a new tab, except on mailto, tel, and sms links, and says so to a screen reader. */
	external?: boolean;
	/** The words a screen reader hears after a card that opens in a new tab. Defaults to "opens in a new tab". */
	newTabLabel?: string;
	/** The title's heading level. Defaults to 3, under a section's own title. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	className?: string;
}

/**
 * A card that lifts out one thing: an eyebrow, a title, a line or two of
 * body, and a meta line, with a small square picture beside them or none at
 * all. Given `href` the whole card is the link; without it, a plain card.
 * The picture goes through `ImageFrame` (base path aware, lazy, the shot
 * brief while there is none), and a brief is silent to a screen reader, so
 * it never joins a linked card's name.
 */
export function HighlightCard({
	title,
	eyebrow,
	body,
	detail,
	meta,
	image,
	placeholder,
	href,
	external,
	newTabLabel = "opens in a new tab",
	headingLevel = 3,
	className,
}: HighlightCardProps) {
	const withBase = useWithBase();
	const picture = Boolean(image || placeholder);
	const classes = ["highlight-card", picture && "has-picture", className].filter(Boolean).join(" ");
	const inner = (
		<>
			{picture && (
				<div className="highlight-card-media" aria-hidden={image ? undefined : true}>
					<ImageFrame
						src={image?.src}
						alt={image?.alt}
						placeholder={placeholder}
						aspectRatio="1/1"
					/>
				</div>
			)}
			<div className="highlight-card-text">
				{eyebrow && <span className="highlight-card-eyebrow">{eyebrow}</span>}
				{/* biome-ignore lint/a11y/useSemanticElements: a heading element would take a site's bare heading rules (Component Rules 21) */}
				<div className="highlight-card-title" role="heading" aria-level={headingLevel}>
					{title}
				</div>
				{body && <span className="highlight-card-body">{body}</span>}
				{detail && <span className="highlight-card-detail">{detail}</span>}
				{meta && <span className="highlight-card-meta">{meta}</span>}
			</div>
		</>
	);
	if (href) {
		const tab = newTabProps(href, external);
		return (
			<a className={classes} href={withBase(href)} {...tab}>
				{inner}
				{tab.target && <span className="visually-hidden">, {newTabLabel}</span>}
			</a>
		);
	}
	return <div className={classes}>{inner}</div>;
}
