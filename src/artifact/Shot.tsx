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
 * when it has one, over its caption. The writeup and the note both wear it;
 * its styles (.op-shot) are the writeup's, and the note only sizes it.
 */
export function Shot({ shot }: { shot: WriteupShot }) {
	return (
		<figure className="op-shot">
			{shot.href ? (
				<a href={shot.href} {...newTabProps(shot.href, true)}>
					<img src={shot.src} alt={shot.alt} loading="lazy" />
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
