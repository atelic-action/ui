import type { ReactNode } from "react";

export interface ChipProps {
	/** Shows the small brand-colored dot before the label. */
	dot?: boolean;
	/** Inverts styling for dark surfaces. */
	onDark?: boolean;
	/** Renders the chip as an anchor (e.g. jump links on a page hero). */
	href?: string;
	children: ReactNode;
}

/** Small mono tag/badge, used for credentials, tags, and service areas. */
export function Chip({ dot = false, onDark = false, href, children }: ChipProps) {
	const classes = ["chip", onDark && "on-dark"].filter(Boolean).join(" ");
	const content = (
		<>
			{dot && <span className="dot" />}
			{children}
		</>
	);
	if (href) {
		return (
			<a className={classes} href={href}>
				{content}
			</a>
		);
	}
	return <span className={classes}>{content}</span>;
}
