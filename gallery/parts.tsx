import type { CSSProperties, ReactNode } from "react";

/*
 * The gallery's own frame pieces, shared by every group file: a piece is one
 * export's section, an example one form of it, and a frame the box that
 * holds a fixed or full screen piece (the header, the sticky bar, the
 * watermark) inside the page instead of over it.
 */

export function Piece({
	id,
	title,
	children,
	lead,
}: {
	id: string;
	title: string;
	lead: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="gallery-piece" id={id} aria-labelledby={`${id}-title`}>
			<div className="wrap">
				<h2 id={`${id}-title`}>{title}</h2>
				<p className="gallery-lead">{lead}</p>
				<div className="gallery-examples">{children}</div>
			</div>
		</section>
	);
}

export function Example({ caption, children }: { caption?: string; children: ReactNode }) {
	return (
		<figure className="gallery-example">
			{caption && <figcaption>{caption}</figcaption>}
			<div className="gallery-example-body">{children}</div>
		</figure>
	);
}

/**
 * A box that is the containing block for anything fixed inside it, so a
 * header, a bar, or a watermark that sits on the viewport in a site sits on
 * this box here. `height` sets the box; it clips what overflows.
 */
export function Frame({
	height,
	className,
	children,
}: {
	height?: number;
	className?: string;
	children: ReactNode;
}) {
	const style: CSSProperties | undefined = height ? { height } : undefined;
	return (
		<div className={["gallery-frame", className].filter(Boolean).join(" ")} style={style}>
			{children}
		</div>
	);
}
