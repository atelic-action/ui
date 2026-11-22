import type { ReactNode } from "react";

/** One proof fact: a short figure or claim, and the line that says what it is. */
export interface ProofItem {
	/** The figure or the claim, e.g. "4.9" with a star row, or "Since 2009". */
	value: ReactNode;
	/** What it is, e.g. "312 Google reviews". */
	label: ReactNode;
}

export interface ProofStripProps {
	items: ProofItem[];
	/** The band's background. Defaults to the page surface. */
	surface?: "default" | "alt";
	/** The list's accessible name, e.g. "Why people choose us". Omit for none. */
	ariaLabel?: string;
	id?: string;
}

/**
 * A single row of short proof facts set right under a hero: a figure over
 * its label, as many as fit across, wrapping to a clean grid on a phone.
 * The facts are the business's own and arrive as data; a strip carries no
 * claim of its own.
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
					<li key={i}>
						<strong className="proof-strip-value">{item.value}</strong>
						<span className="proof-strip-label">{item.label}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
