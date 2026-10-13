import type { ReactNode } from "react";
import { Eyebrow } from "../primitives";
import { useWithBase } from "../routing/BasePathProvider";

export interface PricingBandProps {
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	price: string;
	/** Unit line under the price, e.g. "/ 60 minutes". */
	unit: string;
	/** Detail link under the price, e.g. to the pricing page. */
	detail?: { label: string; href: string };
}

/**
 * Brand-colored pricing band with an inline price card. Informational by
 * design — the page's booking action belongs to the closing CTASection,
 * so pages never pitch the primary CTA twice.
 */
export function PricingBand({ eyebrow, title, lead, price, unit, detail }: PricingBandProps) {
	const withBase = useWithBase();
	return (
		<section className="price-band">
			<div className="wrap price-inner">
				<div>
					{eyebrow && <Eyebrow onDark>{eyebrow}</Eyebrow>}
					<h2>{title}</h2>
					{lead && <p className="lead price-lead">{lead}</p>}
				</div>
				<div className="price-card">
					<span className="price-fig">{price}</span>
					<span className="price-unit">{unit}</span>
					{detail && (
						<a className="price-detail" href={withBase(detail.href)}>
							{detail.label} →
						</a>
					)}
				</div>
			</div>
		</section>
	);
}
