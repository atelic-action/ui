import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWithBase } from "../routing/BasePathProvider";

export interface FullBleedVideoProps {
	/** The video file, e.g. "/video/crew.mp4". */
	src: string;
	/** Its MIME type, when the file's extension does not say it. */
	type?: string;
	/** The video's first frame as a picture, shown at once and kept for reduced motion. */
	poster?: string;
	/** What the video shows, for a screen reader. Site copy, so it always comes in as a prop. */
	label: string;
	/** A shot brief rendered as a labeled block until the first frame exists. */
	placeholder?: string;
	/** The band's height, any CSS length. Defaults to clamp(260px, 42vw, 560px). */
	height?: string;
	/** Shows a pause and play button over the band's corner. Off by default. */
	controls?: boolean;
	/** The button's names while playing and while paused. */
	pauseLabel?: string;
	playLabel?: string;
	id?: string;
}

/**
 * A silent, looping video band that runs edge to edge. The poster (the
 * first frame) shows at once as a plain picture, so the page never waits on
 * the video; the video loads in the background and starts only once it can
 * play through, fading in over the picture, and only while it is on screen.
 * Under `prefers-reduced-motion` it never loads and stays on the poster.
 * Muted, looping, and inline, with no controls unless asked for.
 */
export function FullBleedVideo({
	src,
	type,
	poster,
	label,
	placeholder,
	height = "clamp(260px, 42vw, 560px)",
	controls = false,
	pauseLabel = "Pause the video",
	playLabel = "Play the video",
	id,
}: FullBleedVideoProps) {
	const withBase = useWithBase();
	const ref = useRef<HTMLVideoElement>(null);
	// Off until the effect has asked the reader's device: a reduced motion
	// reader never gets the video's source at all.
	const [load, setLoad] = useState(false);
	const [ready, setReady] = useState(false);
	const [visible, setVisible] = useState(false);
	const [playing, setPlaying] = useState(false);
	// A pause the reader asked for holds until they ask to play again.
	const [held, setHeld] = useState(false);

	useEffect(() => {
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		setLoad(true);
	}, []);

	useEffect(() => {
		const video = ref.current;
		if (!load || !video) return;
		// React sets muted as a property and never renders the attribute, and an
		// iPhone browser's autoplay check reads the attribute, so set both.
		video.muted = true;
		video.setAttribute("muted", "");
		if (typeof IntersectionObserver === "undefined") {
			setVisible(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => setVisible(entries[entries.length - 1]?.isIntersecting ?? false),
			{ rootMargin: "120px 0px" },
		);
		observer.observe(video);
		return () => observer.disconnect();
	}, [load]);

	useEffect(() => {
		const video = ref.current;
		if (!video || !ready) return;
		if (visible && !held) {
			video.play()?.catch((err: unknown) => {
				// A pause that interrupts a pending play is the reader scrolling past.
				if ((err as { name?: string } | null)?.name === "AbortError") return;
				// Autoplay refused: the poster stays, which is the reduced motion look.
				setHeld(true);
			});
		} else if (!video.paused) {
			video.pause();
		}
	}, [ready, visible, held]);

	return (
		<section className="fbv" id={id} style={{ height }}>
			{poster ? (
				<img className="fbv-poster" src={withBase(poster)} alt={label} decoding="async" />
			) : (
				<div className="fbv-poster ph" role="img" aria-label={label}>
					{placeholder ?? label}
				</div>
			)}
			{load && (
				<video
					ref={ref}
					className={["fbv-video", ready && playing && "is-on"].filter(Boolean).join(" ")}
					aria-hidden="true"
					tabIndex={-1}
					muted
					loop
					playsInline
					preload="auto"
					onCanPlayThrough={() => setReady(true)}
					onPlaying={() => setPlaying(true)}
					onPause={() => setPlaying(false)}
				>
					<source src={withBase(src)} type={type} />
				</video>
			)}
			{controls && load && (
				<button
					type="button"
					className="fbv-toggle"
					aria-label={playing ? pauseLabel : playLabel}
					onClick={() => setHeld(playing)}
				>
					{playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
				</button>
			)}
		</section>
	);
}
