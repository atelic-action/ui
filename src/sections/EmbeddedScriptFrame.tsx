import {
	memo,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { addScriptOnce } from "../lib/scriptOnce";
import { Spinner } from "../primitives/Spinner";
import type { Surface } from "./siteConfig";

/** How long the frame waits for the vendor's iframe before it shows the fallback. */
export const EMBED_WAIT_MS = 15_000;

/**
 * How long an iframe already in the mount when the frame first looks is
 * given to fire its load before the wait ends anyway: its load may have
 * fired before the listener was there to hear it.
 */
export const EMBED_GRACE_MS = 2_000;

export interface EmbeddedScriptFrameProps {
	/** The vendor's script, e.g. "https://vendor.example.com/widget.js?id=abc". Fixed for the frame's life. */
	src: string;
	/** The id of the element the vendor's script looks for and mounts its iframe into. Fixed for the frame's life. */
	mountId: string;
	/** The region's accessible name, e.g. "Instant roof estimate". Site copy, so it comes in as a prop. */
	title: string;
	/**
	 * The one line shown in place of the tool when it never arrives: the
	 * script is refused or blocked, fails to load, or no iframe has loaded
	 * within `timeoutMS`. Point the reader to another way through, such as
	 * the phone.
	 */
	fallback: ReactNode;
	/** The space held for the tool before it arrives, any CSS length. Defaults to 600px. */
	minHeight?: string;
	/** How long to wait for the vendor's iframe, in milliseconds. Defaults to `EMBED_WAIT_MS`. */
	timeoutMS?: number;
	/** What a screen reader hears while the tool loads. Defaults to "Loading". */
	loadingLabel?: string;
	/** The band's background. Defaults to the page surface. */
	surface?: Surface;
	/** The band's own id, for a link to it; the mount's id is `mountId`. */
	id?: string;
	className?: string;
}

type Status = "loading" | "ready" | "failed";

/**
 * The element the vendor mounts into. Memoized on props that never change,
 * so React renders it once, empty, and never again: its children are the
 * vendor's, and no render of the frame around it reaches them.
 */
const Mount = memo(function Mount({
	id,
	holder,
}: {
	id: string;
	holder: RefObject<HTMLDivElement | null>;
}) {
	return <div ref={holder} id={id} className="esf-mount" />;
});

/**
 * A vendor's tool that arrives as a script which finds a known element by
 * its id and mounts its own iframe there, resizing that iframe itself (a
 * roof estimator such as Roofle's, whose widget script mounts into
 * `roof-quote-pro-embedded`). The frame draws the empty mount, holds
 * `minHeight` so the page does not jump, and keeps a spinner beside the
 * mount, never inside it, until the vendor's iframe has loaded. The spinner
 * and the fallback sit over the held space and never take a pointer (a link
 * in the fallback still does), so neither can block the tool. If no iframe
 * is in the mount when `timeoutMS` runs out, or the script fails first, the
 * spinner gives way to the consumer's `fallback`, so the page never spins
 * forever. An iframe in the mount at either moment means the vendor
 * arrived: the wait ends and no fallback is drawn over the tool, whether or
 * not its load was heard. An iframe that loads after the fallback still
 * takes its place.
 *
 * The script loads when the page opens, with no click to load step. That
 * is deliberate, an exception to the load on request habit every other
 * third party embed here keeps (`MapEmbed`'s facade, Turnstile on a form's
 * first focus): this section is for a page whose whole purpose is the
 * embedded tool, so a click before it would only stand between the reader
 * and the one thing they came for. Do not put a facade in front of it.
 *
 * The script is added once per `src`, in an effect after hydration, as an
 * `async` tag in the head, and never during a prerender: a strict mode
 * effect run twice and a remount share the one tag. A tag that fails is
 * taken back out, so a later mount tries again. Use one frame per page for
 * a `src`: the vendor mounts into one id. `src` and `mountId` are fixed for
 * the frame's life; a change to either is not followed. Do not also put
 * the vendor's tag in the site's own head: the vendor could then mount
 * before hydration, and React would find children in the mount it never
 * drew. A vendor script runs once per page load, so a frame mounted again
 * after a client side navigation away and back gets a fresh, empty mount
 * the vendor never revisits, and shows the fallback; link to a page that
 * carries it with a full page load.
 */
export function EmbeddedScriptFrame({
	src,
	mountId,
	title,
	fallback,
	minHeight = "600px",
	timeoutMS = EMBED_WAIT_MS,
	loadingLabel = "Loading",
	surface = "default",
	id,
	className,
}: EmbeddedScriptFrameProps) {
	const mount = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<Status>("loading");
	const ready = status === "ready";

	/**
	 * Where the wait ends without a load heard: an iframe in the mount means
	 * the vendor arrived, so it is ready; none means the fallback.
	 */
	const endWait = useCallback(
		(now: Status): Status =>
			now === "ready" || mount.current?.querySelector("iframe") ? "ready" : "failed",
		[],
	);

	// The vendor's script, once per page.
	useEffect(() => {
		const script = addScriptOnce(src);
		const onError = () => setStatus(endWait);
		script.addEventListener("error", onError);
		return () => script.removeEventListener("error", onError);
	}, [src, endWait]);

	// The vendor's iframe: watched for in the mount, then waited for to
	// load. The watch stops once the tool is ready.
	useEffect(() => {
		const element = mount.current;
		if (!element || ready) return;
		let frame: HTMLIFrameElement | null = null;
		const onLoad = () => setStatus("ready");
		const watch = () => {
			const found = element.querySelector("iframe");
			if (!found || found === frame) return;
			frame?.removeEventListener("load", onLoad);
			frame = found;
			found.addEventListener("load", onLoad);
		};
		watch();
		// An iframe already there at the first look may have loaded unheard:
		// it gets a short grace rather than the whole wait.
		const grace = frame ? setTimeout(onLoad, EMBED_GRACE_MS) : undefined;
		const observer = new MutationObserver(watch);
		observer.observe(element, { childList: true, subtree: true });
		return () => {
			clearTimeout(grace);
			observer.disconnect();
			frame?.removeEventListener("load", onLoad);
		};
	}, [ready]);

	// The wait, so the page never spins forever.
	useEffect(() => {
		if (status !== "loading") return;
		const timer = setTimeout(() => setStatus(endWait), timeoutMS);
		return () => clearTimeout(timer);
	}, [status, timeoutMS, endWait]);

	return (
		<section
			className={["section", "embedded-script-frame", surface === "alt" && "surface-alt", className]
				.filter(Boolean)
				.join(" ")}
			id={id}
			aria-label={title}
		>
			<div className="wrap">
				<div className="esf-frame" style={{ minHeight }}>
					<Mount id={mountId} holder={mount} />
					{status !== "ready" && (
						// One live region for the wait and what replaces it, so the
						// fallback is announced where the spinner was.
						<output className="esf-status">
							{status === "loading" ? (
								<Spinner label={loadingLabel} />
							) : (
								<span className="esf-fallback">{fallback}</span>
							)}
						</output>
					)}
				</div>
			</div>
		</section>
	);
}
