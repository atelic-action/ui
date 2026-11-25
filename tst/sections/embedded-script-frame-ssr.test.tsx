// @vitest-environment node
import { renderToString } from "react-dom/server";
import { addScriptOnce } from "../../src/lib/scriptOnce";
import { EmbeddedScriptFrame } from "../../src/sections";

/** A prerender has no window: the frame draws its empty mount and its wait, and adds no script. */
describe("EmbeddedScriptFrame on the server", () => {
	it("renders the mount and the spinner with no script tag", () => {
		expect(typeof window).toBe("undefined");
		const html = renderToString(
			<EmbeddedScriptFrame
				src="https://widget.example.com/embed.js?id=ssr"
				mountId="vendor-mount"
				title="Instant estimate"
				fallback="Call us instead."
			/>,
		);
		expect(html).not.toContain("<script");
		expect(html).not.toContain("widget.example.com");
		expect(html).toMatch(/<div id="vendor-mount" class="esf-mount"><\/div>/);
		expect(html).toContain("<output");
		expect(html).toContain("Loading");
	});

	it("ships the fallback, and the rule that hides the cover, for a visitor with no script", () => {
		const html = renderToString(
			<EmbeddedScriptFrame
				src="https://widget.example.com/embed.js?id=ssr-noscript"
				mountId="vendor-mount"
				title="Instant estimate"
				fallback="Call us instead."
			/>,
		);
		const noscript = /<noscript>([\s\S]*)<\/noscript>/.exec(html)?.[1] ?? "";
		expect(noscript).toContain("Call us instead.");
		expect(noscript).toMatch(/<style>[^<]*\.esf-cover \{ display: none; \}<\/style>/);
		// Outside the noscript the fallback is not drawn: the page waits on the tool.
		expect(html.replace(/<noscript>[\s\S]*<\/noscript>/, "")).not.toContain("Call us instead.");
	});

	it("refuses to add a script where there is no window", () => {
		expect(() => addScriptOnce("https://widget.example.com/embed.js")).toThrow("only in a browser");
	});
});
