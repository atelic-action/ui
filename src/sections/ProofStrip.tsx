import type { ReactNode } from "react";
import type { Surface } from "./siteConfig";

/** One proof fact: a short figure or claim, and the line that says what it is. */
export interface ProofItem {
	/** The figure or the claim, e.g. "4.9" with a star row, or "Since 2009". */
	value: ReactNode;
	/** What it is, e.g. "312 Google reviews". */
	label: ReactNode;
}

export interface ProofFactProps extends ProofItem {
	/** The element it is drawn as: `li` inside a list of its own, else a `div` (the default). */
	as?: "div" | "li";
}

/**
 * One proof fact: its figure over its label. `ProofStrip` draws a row of
 * them, and a `Marquee` scrolls them when each is put inside it as a child,
 * the same piece in both, styled in the package sheet (its value and label
 * keep the classes `ProofStrip` has always worn, so a site's overrides
 * still reach them).
 */
export function ProofFact({ value, label, as: Tag = "div" }: ProofFactProps) {
	return (
		<Tag className="proof-fact">
			<strong className="proof-strip-value">{value}</strong>
			<span className="proof-strip-label">{label}</span>
		</Tag>
	);
}

export interface ProofStripProps {
	items: ProofItem[];
	/** The band's background. Defaults to the page surface. */
	surface?: Surface;
	/** The list's accessible name, e.g. "Why people choose us". Omit for none. */
	ariaLabel?: string;
	id?: string;
}

/**
 * A single row of short proof facts set right under a hero: a figure over
 * its label, as many as fit across, wrapping to a clean grid on a phone.
 * The facts are the business's own and arrive as data; a strip carries no
 * claim of its own. For a row that scrolls instead, put `ProofFact`s in a
 * `Marquee`.
 */
export function ProofStrip({ items, surface = "default", ariaLabel, id }: ProofStripProps) {
	return (
		<section
			className={["proof-strip", surface === "alt" && "surface-alt"].filter(Boolean).join(" ")}
			id={id}
		>
			<ul className="wrap proof-strip-list" aria-label={ariaLabel}>
				{items.map((item, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: proof facts are static content in a fixed order
					<ProofFact key={i} as="li" value={item.value} label={item.label} />
				))}
			</ul>
		</section>
	);
}
