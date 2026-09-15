import type { ReactNode } from "react";

export interface SkipLinkProps {
	/** The main landmark's anchor. Defaults to "#main". */
	href?: string;
	children?: ReactNode;
}

/** The keyboard user's first stop: hidden until focused, then a jump past the chrome. */
export function SkipLink({ href = "#main", children = "Skip to content" }: SkipLinkProps) {
	return (
		<a className="skip-link" href={href}>
			{children}
		</a>
	);
}
