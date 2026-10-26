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
	 * figure holds its shape before the file arrives (no layout shift), and a
	 * tall one is narrowed so it never runs taller than most of the screen.
	 */
	width?: number;
	height?: number;
	/** For a clip: a still shown until it plays, and to a reader who prefers reduced motion. */
	poster?: string;
}

const CLIP = /\.(mp4|webm)([?#].*)?$/i;

/**
 * The box a figure's file draws in: its own shape, and never taller than most
 * of the screen, so a portrait clip in a text column does not fill a desktop
 * from top to bottom. Nothing without both dimensions.
 */
function frameStyle(width?: number, height?: number) {
	if (!width || !height) return undefined;
	return {
		aspectRatio: `${width} / ${height}`,
		maxWidth: `min(100%, calc(75vh * ${width} / ${height}))`,
	};
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
	style,
}: {
	src: string;
	alt?: string;
	poster?: string;
	style?: ReturnType<typeof frameStyle>;
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
		const play = () =>
			video.play()?.catch((err: unknown) => {
				if ((err as { name?: string } | null)?.name !== "AbortError") setStill(true);
			});
		if (typeof IntersectionObserver === "undefined") {
			play();
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[entries.length - 1]?.isIntersecting) play();
				else video.pause();
			},
			{ rootMargin: "200px 0px" },
		);
		observer.observe(video);
		return () => observer.disconnect();
	}, []);
	return (
		// biome-ignore lint/a11y/useMediaCaption: a silent loop has no audio to caption; the figcaption and aria-label carry the words
		<video
			ref={ref}
			src={src}
			poster={poster}
			aria-label={alt}
			style={style}
			loop
			muted
			playsInline
			controls={still}
			// A still clip never plays, so without a poster it needs its first frame loaded.
			preload={still && !poster ? "metadata" : "none"}
		/>
	);
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
			{blocks.map((block, i) => {
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
				if (block.type === "figure") {
					const src = block.src ? withBase(block.src) : "";
					const style = frameStyle(block.width, block.height);
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
						<figure className="pb-figure" key={`figure-${i}-${src.slice(-24)}`}>
							{!src ? (
								<div className="ph">{block.alt ?? "Figure"}</div>
							) : CLIP.test(src) ? (
								<Clip
									src={src}
									alt={block.alt}
									poster={block.poster ? withBase(block.poster) : undefined}
									style={style}
								/>
							) : (
								<img
									src={src}
									alt={block.alt ?? ""}
									width={block.width}
									height={block.height}
									style={style}
									loading="lazy"
									decoding="async"
								/>
							)}
							{block.caption ? (
								<figcaption className="pb-caption">{block.caption}</figcaption>
							) : null}
						</figure>
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
