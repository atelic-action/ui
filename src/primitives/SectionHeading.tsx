import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Lead } from "./Lead";

export interface SectionHeadingProps {
	eyebrow?: string;
	/** Heading content; may include serif emphasis spans. */
	title: ReactNode;
	lead?: ReactNode;
	center?: boolean;
	/** Lifts colors for dark surfaces. */
	onDark?: boolean;
	/** Deprecated no-op: the eyebrow's trailing fade is now its only rendering. */
	eyebrowRun?: boolean;
	/** Heading level; sections default to h2. */
	as?: "h1" | "h2" | "h3";
	className?: string;
}

/** Standard section opener: eyebrow, title, optional lead. */
export function SectionHeading({
	eyebrow,
	title,
	lead,
	center = false,
	onDark = false,
	as: Heading = "h2",
	className,
}: SectionHeadingProps) {
	const classes = ["section-head", center && "center", className].filter(Boolean).join(" ");
	return (
		<div className={classes}>
			{eyebrow && (
				<Eyebrow onDark={onDark} center={center}>
					{eyebrow}
				</Eyebrow>
			)}
			<Heading>{title}</Heading>
			{lead && <Lead className="section-head-lead">{lead}</Lead>}
		</div>
	);
}
