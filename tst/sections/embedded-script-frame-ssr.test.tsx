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
		expect(html).not.toContain("Call us instead.");
	});

	it("refuses to add a script where there is no window", () => {
		expect(() => addScriptOnce("https://widget.example.com/embed.js")).toThrow("only in a browser");
	});
});
