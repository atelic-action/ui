import { renderToString } from "react-dom/server";
import { errorCatcherScript } from "../../src/monitoring/catcher";
import { ErrorCatcherScript } from "../../src/monitoring/ErrorCatcherScript";

describe("ErrorCatcherScript", () => {
	it("prerenders the catcher as one inline script, unescaped, ahead of every other script", () => {
		const html = renderToString(
			<head>
				<meta charSet="utf-8" />
				<ErrorCatcherScript />
				<script src="/assets/app.js" />
			</head>,
		);
		const inline = `<script>${errorCatcherScript}</script>`;
		expect(html.split(inline)).toHaveLength(2);
		expect(html.indexOf(inline)).toBeLessThan(html.indexOf('src="/assets/app.js"'));
	});

	it("renders nothing when it is not enabled, so a build with no DSN ships no catcher", () => {
		const html = renderToString(
			<head>
				<ErrorCatcherScript enabled={false} />
			</head>,
		);
		expect(html).toBe("<head></head>");
		expect(renderToString(<ErrorCatcherScript enabled />)).toContain(errorCatcherScript);
	});
});
