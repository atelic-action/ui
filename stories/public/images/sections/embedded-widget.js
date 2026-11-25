/*
 * A stand in for a vendor's embedded tool script, for the EmbeddedScriptFrame
 * stories. It behaves the way such a script does: it finds its own tag, reads
 * the mount's id from its query (`mount`), looks for that element, retrying a
 * few times while it is missing, and appends an iframe of its own there. With
 * `never` it finds the element and mounts nothing, so the frame's wait runs
 * out; `delay` holds the iframe back that many milliseconds.
 */
(() => {
	const script =
		document.currentScript || document.querySelector('script[src*="embedded-widget.js"]');
	if (!script) return;
	const params = new URL(script.src).searchParams;
	const mountId = params.get("mount") || "embedded-widget";
	const delay = Number(params.get("delay") || "300");
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
		frame.src = new URL("embedded-widget-frame.html", script.src).href;
		frame.title = "The stand in tool";
		frame.style.width = "100%";
		frame.style.height = "420px";
		frame.style.border = "0";
		mount.appendChild(frame);
	};
	setTimeout(attach, delay);
})();
