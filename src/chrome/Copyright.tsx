export interface CopyrightProps {
	/** The business's name. */
	name: string;
	/** Suffix after the name, e.g. "Dr. Alex Rivers, PT, DPT". */
	attribution?: string;
}

/** The copyright line: the mark, this year, and the business's name. The closing bar's default left side. */
export function Copyright({ name, attribution }: CopyrightProps) {
	return (
		<span className="copyright">
			© {new Date().getFullYear()} {name}
			{attribution ? ` · ${attribution}` : ""}
		</span>
	);
}
