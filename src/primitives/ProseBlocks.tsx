import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWithBase } from "../routing/BasePathProvider";

/**
 * One block of prose carried as data. A deliberately tiny vocabulary:
 * headings, paragraphs, lists, and a figure, because that is what survives
 * extraction from a CMS intact, and because anything richer invites rewriting
 * content that was meant to be carried across verbatim.
 */
export interface ProseBlock {
	type: "h" | "p" | "ul" | "figure";
	/** Present for "h" and "p". */
	text?: string;
	/**
	 * For "h": the heading's level under the page's own h1, where the
	 * component's `headingLevel` is the default. A post with sections and
	 * sub sections marks the sub sections 3 and leaves the rest alone.
	 */
	level?: 2 | 3;
	/** Present for "ul". */
	items?: string[];
	/**
	 * Present for "figure": the file the figure shows. A `.mp4` or `.webm`
	 * plays as a silent loop (a short clip of an exercise, say), anything
	 * else is an image. Both load lazily, since a figure sits in running prose
	 * below the fold.
	 */
	src?: string;
	/** For "figure": what the figure shows, for a reader who cannot see it. */
	alt?: string;
	/** For "figure": a line under it. */
	caption?: string;
	/**
	 * For "figure": the file's own width and height in pixels. With both, the
	 * tile keeps the file's shape at the row's height and holds it before the
	 * file arrives (no layout shift); without them it is 4 by 5.
	 */
	width?: number;
	height?: number;
	/** For a clip: a still shown until it plays, and to a reader who prefers reduced motion. */
	poster?: string;
}

const CLIP = /\.(mp4|webm)([?#].*)?$/i;

/** A tile keeps its file's shape; the row sets its height. */
function tileStyle(width?: number, height?: number) {
	return { aspectRatio: width && height ? `${width} / ${height}` : "4 / 5" };
}

/**
 * A silent looping clip. It plays only while it is on screen and pauses when
 * it leaves, and it fetches nothing until it first comes into view, so a post
 * with a clip beside every exercise costs nothing up front. A reader who asked
 * for reduced motion gets it still, with controls to start it.
 */
function Clip({
	src,
	alt,
	poster,
	inTile = false,
}: {
	src: string;
	alt?: string;
	poster?: string;
	/** Inside a button, where native controls would nest interactive content; the lightbox has them. */
	inTile?: boolean;
}) {
	const ref = useRef<HTMLVideoElement>(null);
	const [still, setStill] = useState(false);
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
			setStill(true);
			return;
		}
		// A pause that interrupts a pending play rejects it with an AbortError;
		// that is the reader scrolling past, not autoplay being refused.
		let observer: IntersectionObserver | undefined;
		const play = () =>
			video.play()?.catch((err: unknown) => {
				if ((err as { name?: string } | null)?.name === "AbortError") return;
				// Autoplay refused: hand the clip to the reader and stop steering it.
				setStill(true);
				observer?.disconnect();
			});
		if (typeof IntersectionObserver === "undefined") {
			play();
			return;
		}
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[entries.length - 1]?.isIntersecting) play();
				else video.pause();
			},
			{ rootMargin: "200px 0px" },
		);
		observer.observe(video);
		return () => observer?.disconnect();
	}, []);
	return (
		// biome-ignore lint/a11y/useMediaCaption: a silent loop has no audio to caption; the figcaption and aria-label carry the words
		<video
			ref={ref}
			src={src}
			poster={poster}
			aria-label={alt}
			loop
			muted
			playsInline
			controls={still && !inTile}
			// A still clip never plays, so without a poster it needs its first frame loaded.
			preload={still && !poster ? "metadata" : "none"}
		/>
	);
}

/**
 * One figure: a small tile, the caption laid over its foot, that opens the
 * file large in a modal dialog. The platform's dialog gives Escape, focus
 * containment, and focus return to the tile; a click on the backdrop closes
 * it too. The large clip mounts only while the dialog is open, so it costs
 * nothing until a reader asks for it.
 */
function Figure({ block, withBase }: { block: ProseBlock; withBase: (path: string) => string }) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState(false);
	const src = block.src ? withBase(block.src) : "";
	const poster = block.poster ? withBase(block.poster) : undefined;
	const clip = CLIP.test(src);
	// The description names the tile; the caption is laid over it and read from the figcaption.
	const label = block.alt || block.caption || "Figure";
	// A reader who asked for reduced motion gets the large clip still, with controls.
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	if (!src) {
		return (
			<figure className="pb-figure">
				<div className="ph" style={tileStyle(block.width, block.height)}>
					{block.alt ?? "Figure"}
				</div>
				{block.caption ? <figcaption className="pb-caption">{block.caption}</figcaption> : null}
			</figure>
		);
	}

	return (
		<figure className="pb-figure">
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop click is a pointer shortcut; the dialog closes on Escape natively and has a close button */}
			<dialog
				ref={dialogRef}
				className="pb-lightbox"
				aria-label={label}
				onClose={() => setOpen(false)}
				onClick={(event) => {
					// A click that lands outside the panel's box is a click on the backdrop; the
					// panel's own padding and blank areas also target the dialog, so test coordinates.
					if (event.target !== event.currentTarget) return;
					const box = event.currentTarget.getBoundingClientRect();
					const outside =
						event.clientX < box.left ||
						event.clientX > box.right ||
						event.clientY < box.top ||
						event.clientY > box.bottom;
					if (outside) setOpen(false);
				}}
			>
				<button
					type="button"
					className="pb-lightbox-close"
					aria-label="Close"
					onClick={() => setOpen(false)}
				>
					<X size={20} strokeWidth={2} aria-hidden="true" />
				</button>
				{open ? (
					clip ? (
						// biome-ignore lint/a11y/useMediaCaption: a silent loop has no audio to caption; the caption below carries the words
						<video
							src={src}
							poster={poster}
							aria-label={block.alt}
							width={block.width}
							height={block.height}
							autoPlay={!reduceMotion}
							loop
							muted
							playsInline
							controls
						/>
					) : (
						<img src={src} alt={block.alt ?? ""} width={block.width} height={block.height} />
					)
				) : null}
				{open && block.caption ? <p className="pb-lightbox-caption">{block.caption}</p> : null}
			</dialog>
			<button
				type="button"
				className="pb-tile"
				style={tileStyle(block.width, block.height)}
				aria-label={`Open larger: ${label}`}
				onClick={() => {
					setReduceMotion(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
					setOpen(true);
				}}
			>
				{clip ? (
					<Clip src={src} alt={block.alt} poster={poster} inTile />
				) : (
					<img
						src={src}
						alt={block.alt ?? ""}
						width={block.width}
						height={block.height}
						loading="lazy"
						decoding="async"
					/>
				)}
			</button>
			{block.caption ? <figcaption className="pb-caption">{block.caption}</figcaption> : null}
		</figure>
	);
}

/** Runs of consecutive figures become one row of tiles; everything else stands alone. */
function segments(blocks: ProseBlock[]) {
	const out: Array<
		{ figures: ProseBlock[]; start: number } | { block: ProseBlock; index: number }
	> = [];
	blocks.forEach((block, index) => {
		const last = out[out.length - 1];
		if (block.type === "figure") {
			if (last && "figures" in last) last.figures.push(block);
			else out.push({ figures: [block], start: index });
		} else {
			out.push({ block, index });
		}
	});
	return out;
}

export interface ProseBlocksProps {
	blocks: ProseBlock[];
	/**
	 * Heading level for "h" blocks. Defaults to h2, since the page's h1
	 * belongs to whatever hero sits above this.
	 */
	headingLevel?: "h2" | "h3";
	className?: string;
}

/**
 * Renders a document body from data rather than markup: legal pages, ported
 * blog posts, anything whose words came from somewhere else and must not be
 * quietly edited on the way in.
 *
 * Keys are derived from content plus position. Repeated text is common in
 * ported prose ("Contact us" appears in three legal documents), so neither
 * alone is stable.
 */
export function ProseBlocks({ blocks, headingLevel = "h2", className }: ProseBlocksProps) {
	const Heading = headingLevel;
	const withBase = useWithBase();
	return (
		<div className={["prose-blocks", className].filter(Boolean).join(" ")}>
			{segments(blocks).map((segment) => {
				if ("figures" in segment) {
					return (
						<div className="pb-figures" key={`figures-${segment.start}`}>
							{segment.figures.map((block, j) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static prose; position plus file is the stable key (see above)
								<Figure block={block} withBase={withBase} key={`figure-${j}-${block.src ?? ""}`} />
							))}
						</div>
					);
				}
				const { block, index: i } = segment;
				if (block.type === "h") {
					const Tag = block.level ? (`h${block.level}` as const) : Heading;
					return (
						<Tag
							className={["pb-heading", block.level === 3 ? "pb-h3" : ""].filter(Boolean).join(" ")}
							// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
							key={`h-${i}-${block.text?.slice(0, 24)}`}
						>
							{block.text}
						</Tag>
					);
				}
				if (block.type === "ul") {
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
						<ul className="pb-list" key={`ul-${i}-${(block.items ?? [])[0]?.slice(0, 24)}`}>
							{(block.items ?? []).map((item, j) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
								<li key={`${j}-${item.slice(0, 40)}`}>{item}</li>
							))}
						</ul>
					);
				}
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
					<p className="pb-body" key={`p-${i}-${block.text?.slice(0, 24)}`}>
						{block.text}
					</p>
				);
			})}
		</div>
	);
}
