import type { ReactNode } from "react";
import { Button } from "../primitives/Button";
import { TickList } from "../primitives/TickList";
import { useWithBase } from "../routing/BasePathProvider";

export interface PricingCardProps {
	/** Small mono line above the price, e.g. "Every session · every service". */
	ribbon?: string;
	price: string;
	/** Line under the price, e.g. "for a full 60 minutes". */
	per: string;
	ticks?: ReactNode[];
	cta: { label: string; href: string; newTab?: boolean };
	secondary?: { label: string; href: string };
}

/** Standalone detailed pricing card (the pricing page centerpiece). */
export function PricingCard({ ribbon, price, per, ticks, cta, secondary }: PricingCardProps) {
	const withBase = useWithBase();
	return (
		<div className="cost-card">
			{ribbon && <span className="ribbon">{ribbon}</span>}
			<div className="big">{price}</div>
			<div className="per">{per}</div>
			{ticks && ticks.length > 0 && <TickList items={ticks} />}
			<Button href={cta.href} newTab={cta.newTab} size="lg" arrow style={{ width: "100%" }}>
				{cta.label}
			</Button>
			{secondary && (
				<a className="cost-secondary" href={withBase(secondary.href)}>
					{secondary.label} →
				</a>
			)}
		</div>
	);
}
