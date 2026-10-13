import type { ReactNode } from "react";
import { Eyebrow, Lead } from "../primitives";

export interface PageHeroProps {
	eyebrow?: string;
	title: ReactNode;
	lead?: ReactNode;
	center?: boolean;
	/** Extra content under the lead (e.g. jump-link chips). */
	children?: ReactNode;
}

/** Interior page opener on the alternate surface band. */
export function PageHero({ eyebrow, title, lead, center = false, children }: PageHeroProps) {
	return (
		<section className={["page-hero", center && "center"].filter(Boolean).join(" ")}>
			<div className="wrap">
				{eyebrow && <Eyebrow center={center}>{eyebrow}</Eyebrow>}
				<h1>{title}</h1>
				{lead && <Lead style={center ? { marginInline: "auto" } : undefined}>{lead}</Lead>}
				{children}
			</div>
		</section>
	);
}
