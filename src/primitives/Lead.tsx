import type { CSSProperties, ReactNode } from "react";

export interface LeadProps {
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}

/** Lead paragraph: the larger intro copy under a heading. */
export function Lead({ className, style, children }: LeadProps) {
	const classes = ["lead", className].filter(Boolean).join(" ");
	return (
		<p className={classes} style={style}>
			{children}
		</p>
	);
}
