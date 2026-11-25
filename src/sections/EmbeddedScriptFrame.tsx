import {
	type CSSProperties,
	memo,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
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
const EMBED_GRACE_MS = 2_000;

export interface EmbeddedScriptFrameProps {
	/** The vendor's script, e.g. "https://vendor.example.com/widget.js?id=abc". Fixed for the frame's life. */
	src: string;
	/** The id of the element the vendor's script looks for and mounts its iframe into. Fixed for the frame's life. */
	mountId: string;
	/** The region's accessible name, e.g. "Instant roof estimate". Site copy, so it comes in as a prop. */
	title: string;
	/**
	 * The message the vendor's iframe posts to the page once its tool is
	 * drawn, for a vendor whose iframe loads well before its tool does. Set,
	 * the wait ends only on a `message` event from the mount's iframe (its
	 * `contentWindow` is the event's `source`) whose `origin` is `origin` and
	 * whose `data.type` is `type`; the iframe's `load` alone no longer ends
	 * it. For example `{ origin: "https://app.vendor.example.com", type:
	 * "quote-loaded" }`. Unset, the iframe's `load` ends the wait. Fixed for
	 * the frame's life.
	 */
	readyMessage?: EmbedReadyMessage;
	/**
	 * A CSS selector for what the vendor's script draws on the host page
	 * outside the mount, such as its own whole page loader or overlay, kept
	 * hidden (`display: none !important`) for as long as the frame is
	 * mounted, so the reader sees one loader, ours. The rule goes into the
	 * head before the script does, so the vendor's loader never flashes, and
	 * leaves with the frame. It is the site's selector and is not checked:
	 * aim it at a loader or an overlay, never at any part of the vendor's
	 * tool. Fixed for the frame's life.
	 */
	hostChrome?: string;
	/**
	 * The one line shown in place of the tool when it never arrives: the
	 * script is refused, blocked, or fails to load, or no iframe is in the
	 * mount when `timeoutMS` runs out. Point the reader to another way
	 * through, such as the phone.
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

/** The message that says a vendor's tool is drawn: where it comes from, and its `data.type`. */
export interface EmbedReadyMessage {
	origin: string;
	type: string;
}

type Status = "loading" | "ready" | "failed";

/**
 * Read only where no script runs, from inside a `<noscript>`: the cover and
 * its spinner wait for a tool that can never come, so they are hidden and
 * the fallback beside them shows. It names no site value.
 */
const NO_SCRIPT_RULE = ".atelic-ui .embedded-script-frame .esf-cover { display: none; }";

/** Whether `event` is `wanted`, posted by one of the iframes in `element`. */
function isReadyMessage(event: MessageEvent, wanted: EmbedReadyMessage, element: HTMLElement) {
	if (event.origin !== wanted.origin) return false;
	if ((event.data as { type?: unknown } | null)?.type !== wanted.type) return false;
	return Array.from(element.querySelectorAll("iframe")).some(
		(frame) => event.source !== null && frame.contentWindow === event.source,
	);
}

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
 * `roof-quote-pro-embedded`). The frame draws the empty mount and holds
 * `minHeight` so the page does not jump.
 *
 * The reader sees one loader, ours. Until the tool is ready, an opaque
 * cover in the band's own color lies over the whole frame, beside the
 * mount, never inside it, with a large spinner centered in the held space
 * (the first `minHeight` of the frame), where it stays as the vendor's
 * iframe grows the frame under it; whatever the vendor draws in its iframe
 * meanwhile (its own loader) stays under the cover. The fallback line sits
 * in the same place. The mount and the iframe stay at full
 * size underneath, never hidden, since a vendor measures itself. When the
 * tool is ready the cover fades away (at once under reduced motion). Ready
 * is the iframe's `load`, or, with `readyMessage`, the vendor's own message
 * that its tool is drawn. A loader the vendor draws on the host page
 * outside the mount is hidden with `hostChrome`. For Roofle, the ready
 * message is its app's origin with the type `quick-quote-loaded`, and its
 * host page loader is `#spinner-container`.
 *
 * If no iframe is in the mount when `timeoutMS` runs out, or the script
 * fails first, the spinner gives way to the consumer's `fallback`, so the
 * page never spins forever; the fallback takes no pointer but its own (a
 * link in it still works), so it can never block a tool. An iframe in the
 * mount at either moment means the vendor arrived: the cover lifts and no
 * fallback is drawn over the tool, whether or not its ready signal was
 * heard. A tool that is ready after the fallback still takes its place.
 *
 * With no script, nothing loads: the prerendered page hides the cover and
 * shows the fallback, from a `<noscript>`. While the cover is up the mount
 * is `inert`, so focus cannot enter a tool nobody can see.
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
	readyMessage,
	hostChrome,
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
	// Whether the wait last ended in the fallback, so a tool that is ready
	// after it is revealed without the cover's ground coming back to fade.
	const [shownFallback, setShownFallback] = useState(false);
	if (status === "failed" && !shownFallback) setShownFallback(true);

	/**
	 * Where the wait ends without a load heard: an iframe in the mount means
	 * the vendor arrived, so it is ready; none means the fallback.
	 */
	const endWait = useCallback(
		(now: Status): Status =>
			now === "ready" || mount.current?.querySelector("iframe") ? "ready" : "failed",
		[],
	);

	// Props fixed for the frame's life, read once by the effects below.
	const wanted = useRef(readyMessage);
	const chrome = useRef(hostChrome);

	// The vendor's script, once per page, after the rule that hides its host
	// page loader, so that loader never shows.
	useEffect(() => {
		let rule: HTMLStyleElement | undefined;
		if (chrome.current) {
			rule = document.createElement("style");
			rule.dataset.embedHostChrome = "";
			rule.textContent = `${chrome.current} { display: none !important; }`;
			document.head.appendChild(rule);
		}
		const script = addScriptOnce(src);
		const onError = () => setStatus(endWait);
		script.addEventListener("error", onError);
		return () => {
			script.removeEventListener("error", onError);
			rule?.remove();
		};
	}, [src, endWait]);

	// The vendor's iframe: watched for in the mount, then waited for to load,
	// or, with a ready message, for its message. The watch stops once the
	// tool is ready.
	useEffect(() => {
		const element = mount.current;
		if (!element || ready) return;
		const message = wanted.current;
		if (message) {
			const onMessage = (event: MessageEvent) => {
				if (isReadyMessage(event, message, element)) setStatus("ready");
			};
			window.addEventListener("message", onMessage);
			return () => window.removeEventListener("message", onMessage);
		}
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

	// While the cover is up nothing under it can be seen, so focus cannot
	// go there either; set on the element itself, so Mount never renders
	// again, and in the commit that lifts the cover, so the tool is never
	// shown while still inert.
	useLayoutEffect(() => {
		const element = mount.current;
		if (!element) return;
		if (status === "loading") element.setAttribute("inert", "");
		else element.removeAttribute("inert");
	}, [status]);

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
				<div className="esf-frame" style={{ minHeight, "--_esf-held": minHeight } as CSSProperties}>
					<Mount id={mountId} holder={mount} />
					{/* The cover over the tool while it loads: drawn always, so it can
					    fade when the tool is ready, and clear while the fallback shows. */}
					<div
						className={[
							"esf-cover",
							status === "loading" && "is-covering",
							status === "ready" && (shownFallback ? "is-gone" : "is-lifted"),
						]
							.filter(Boolean)
							.join(" ")}
					>
						{status !== "ready" && (
							// One live region for the wait and what replaces it, so the
							// fallback is announced where the spinner was.
							<output className="esf-status">
								{status === "loading" ? (
									<Spinner label={loadingLabel} size="lg" />
								) : (
									<span className="esf-fallback">{fallback}</span>
								)}
							</output>
						)}
					</div>
					{/* With no script nothing ever loads: the cover and spinner stay
					    hidden, and the fallback is the page. */}
					<noscript>
						<style>{NO_SCRIPT_RULE}</style>
						<div className="esf-noscript">
							<div className="esf-status">
								<span className="esf-fallback">{fallback}</span>
							</div>
						</div>
					</noscript>
				</div>
			</div>
		</section>
	);
}
