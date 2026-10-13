import type { CSSProperties, ReactNode } from "react";
import { SectionHeading } from "../primitives";
import { useWithBase } from "../routing/BasePathProvider";

interface FeatureCardBase {
	/** Small mono index label, e.g. "01". */
	num?: string;
	title: string;
}

/**
 * A card is either a link or a card that contains one, never both. The linked
 * variant wraps the whole card in an anchor, and an anchor inside an anchor is
 * invalid markup that browsers silently unnest, so a linked card's description
 * stays plain text. The unlinked variant takes a node, which is how a word
 * inside a card links to its definition.
 *
 * That node is inline content only: the description renders inside the card's
 * `<p>`, so a block element (`p`, `div`, `ul`) nested there is invalid markup.
 * TypeScript has no phrasing content type to say so, which leaves it a rule
 * rather than a constraint.
 */
export type FeatureCard =
	| (FeatureCardBase & { description: ReactNode; href?: never; linkLabel?: never })
	| (FeatureCardBase & { description: string; href: string; linkLabel?: string });

export interface FeatureGridProps {
	eyebrow?: string;
	/** Deprecated no-op: the eyebrow's trailing fade is now its only rendering. */
	eyebrowRun?: boolean;
	title: ReactNode;
	items: FeatureCard[];
	/** Cards per row at desktop width (default 4). */
	columns?: 2 | 3 | 4;
	surface?: "default" | "alt";
	id?: string;
}

/** Numbered feature/service card grid with hover lift. */
export function FeatureGrid({
	eyebrow,
	title,
	items,
	columns = 4,
	surface = "alt",
	id,
}: FeatureGridProps) {
	const withBase = useWithBase();
	const sectionClasses = ["section", surface === "alt" && "surface-alt"].filter(Boolean).join(" ");
	const gridStyle = { "--fg-cols": columns } as CSSProperties;
	return (
		<section className={sectionClasses} id={id}>
			<div className="wrap">
				<SectionHeading eyebrow={eyebrow} title={title} />
				<div className="feature-grid" style={gridStyle}>
					{items.map((item) => {
						const inner = (
							<>
								{item.num && <span className="feature-num">{item.num}</span>}
								<h3>{item.title}</h3>
								<p>{item.description}</p>
								{item.href && item.linkLabel && (
									<span className="feature-link">
										{item.linkLabel} <span className="arrow">→</span>
									</span>
								)}
							</>
						);
						return item.href ? (
							<a key={item.title} className="feature-card" href={withBase(item.href)}>
								{inner}
							</a>
						) : (
							<div key={item.title} className="feature-card">
								{inner}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
