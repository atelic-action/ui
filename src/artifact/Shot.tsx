import { Maximize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newTabProps } from "../lib/newTabProps";

export interface WriteupShot {
	/** The crop shown on the page. */
	src: string;
	alt: string;
	/** The full screenshot the crop opens in a new tab; omit to render the crop alone. */
	href?: string;
	caption: string;
}

/** The src of a loaded image taller than it is wide; null for any other. */
function portraitSrcOf(img: HTMLImageElement): string | null {
	if (!img.naturalWidth || !img.naturalHeight) return null;
	return img.naturalHeight > img.naturalWidth ? img.getAttribute("src") : null;
}

/**
 * The owner's own screen: the crop, opening the full screenshot in a new tab
 * when it has one, over its caption. The writeup, the read, and the note in
 * @atelic-action/artifact all wear it, so its styles (.op-shot) live in the
 * base sheet chain (styles/artifact.css), and each document sizes it in its
 * own sheet. A linked crop says it opens: a hover title, and an expand badge
 * hidden by default that a document may turn on (the note does, on its
 * thumbnails).
 *
 * A crop taller than it is wide (a phone screen) marks the figure
 * `data-portrait`, and the base sheet holds it far narrower than its column.
 * The mark is measured in the browser, after the image has a size: on load,
 * or in an effect when the image finished loading before hydration, so the
 * prerendered page carries no mark and nothing reads the window at render.
 */
export function Shot({ shot }: { shot: WriteupShot }) {
	const img = useRef<HTMLImageElement>(null);
	// The src the portrait mark was measured on, so a new src never wears the
	// last image's mark while it loads or if it fails.
	const [portraitSrc, setPortraitSrc] = useState<string | null>(null);
	const portrait = portraitSrc !== null && portraitSrc === shot.src;

	// An image that loaded before hydration fired its load event before React
	// was listening, so read its size once on mount. A later src change fires
	// load again, which the handler below measures.
	useEffect(() => {
		const current = img.current;
		if (current?.complete) setPortraitSrc(portraitSrcOf(current));
	}, []);

	const picture = (
		<img
			ref={img}
			src={shot.src}
			alt={shot.alt}
			loading="lazy"
			onLoad={(event) => setPortraitSrc(portraitSrcOf(event.currentTarget))}
			onError={() => setPortraitSrc(null)}
		/>
	);

	return (
		<figure className="op-shot" data-portrait={portrait ? "" : undefined}>
			{shot.href ? (
				<a href={shot.href} title="Open the full picture" {...newTabProps(shot.href, true)}>
					{picture}
					<span className="op-shot-open" aria-hidden="true">
						<Maximize2 size={12} />
					</span>
				</a>
			) : (
				<span className="op-shot-frame">{picture}</span>
			)}
			<figcaption>{shot.caption}</figcaption>
		</figure>
	);
}
