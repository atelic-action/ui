/*
 * A stand in for a vendor's embedded tool script, for the EmbeddedScriptFrame
 * stories. It behaves the way such a script does: it finds its own tag, reads
 * the mount's id from its query (`mount`), looks for that element, retrying a
 * few times while it is missing, and appends an iframe of its own there.
 *
 * - `delay` holds the iframe back that many milliseconds.
 * - `never` finds the element and mounts nothing, so the frame's wait runs out.
 * - `chrome` also draws a whole page loader of the vendor's own on the host
 *   page, with that id, and takes it away when the iframe posts
 *   `stand-in-remove-spinner`, as some vendors do.
 * - `ready` is how long after its own load the iframe takes to draw its tool
 *   (showing a loader of its own meanwhile); it then posts
 *   `stand-in-remove-spinner`, `stand-in-height`, and `stand-in-loaded`.
 */
(() => {
	const script =
		document.currentScript || document.querySelector('script[src*="embedded-widget.js"]');
	if (!script) return;
	const params = new URL(script.src).searchParams;
	const mountId = params.get("mount") || "embedded-widget";
	const delay = Number(params.get("delay") || "300");
	const chromeId = params.get("chrome");
	const ready = params.get("ready") || "0";
	if (params.has("never")) return;
	let tries = 0;
	const attach = () => {
		const mount = document.getElementById(mountId);
		if (!mount) {
			tries += 1;
			if (tries < 10) setTimeout(attach, 1000);
			return;
		}
		const frame = document.createElement("iframe");
		const page = new URL("embedded-widget-frame.html", script.src);
		page.searchParams.set("ready", ready);
		frame.src = page.href;
		frame.title = "The stand in tool";
		frame.style.width = "100%";
		frame.style.height = "420px";
		frame.style.border = "0";
		if (chromeId) {
			const loader = document.createElement("div");
			loader.id = chromeId;
			loader.setAttribute("aria-hidden", "true");
			loader.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgb(0 0 0 / 0.4)";
			document.body.appendChild(loader);
			window.addEventListener("message", (event) => {
				if (event.source !== frame.contentWindow) return;
				if (event.data && event.data.type === "stand-in-remove-spinner") loader.remove();
			});
		}
		mount.appendChild(frame);
	};
	setTimeout(attach, delay);
})();
