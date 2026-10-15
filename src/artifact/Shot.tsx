import { Maximize2 } from "lucide-react";
import { newTabProps } from "../lib/newTabProps";

export interface WriteupShot {
	/** The crop shown on the page. */
	src: string;
	alt: string;
	/** The full screenshot the crop opens in a new tab; omit to render the crop alone. */
	href?: string;
	caption: string;
}

/**
 * The owner's own screen: the crop, opening the full screenshot in a new tab
 * when it has one, over its caption. The writeup, the read, and the note in
 * @atelic-action/artifact all wear it, so its styles (.op-shot) live in the
 * base sheet chain (styles/artifact.css), and each document sizes it in its
 * own sheet. A linked crop says it opens: a hover title, and an expand badge
 * hidden by default that a document may turn on (the note does, on its
 * thumbnails).
 */
export function Shot({ shot }: { shot: WriteupShot }) {
	return (
		<figure className="op-shot">
			{shot.href ? (
				<a href={shot.href} title="Open the full picture" {...newTabProps(shot.href, true)}>
					<img src={shot.src} alt={shot.alt} loading="lazy" />
					<span className="op-shot-open" aria-hidden="true">
						<Maximize2 size={12} />
					</span>
				</a>
			) : (
				<span className="op-shot-frame">
					<img src={shot.src} alt={shot.alt} loading="lazy" />
				</span>
			)}
			<figcaption>{shot.caption}</figcaption>
		</figure>
	);
}
