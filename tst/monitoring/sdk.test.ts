import { getClient } from "@sentry/browser";
import { DENY_URLS, IGNORE_ERRORS, initSentry, scrubRequest } from "../../src/monitoring/sdk";

describe("the browser SDK, set up for errors alone", () => {
	it("starts a client with the error integrations and no tracing, replay, or breadcrumbs", () => {
		initSentry({
			dsn: "https://key@o1.ingest.example.com/42",
			release: "abc123",
			environment: "test",
		});
		const client = getClient();
		const options = client?.getOptions();
		expect(options?.release).toBe("abc123");
		expect(options?.environment).toBe("test");
		expect(options?.tracesSampleRate).toBeUndefined();
		const names = (options?.integrations ?? []).map((integration) => integration.name).sort();
		expect(names).toEqual(
			[
				"Dedupe",
				"EventFilters",
				"FunctionToString",
				"GlobalHandlers",
				"HttpContext",
				"LinkedErrors",
			].sort(),
		);
	});

	it("leaves out a browser extension's frames and the in app webview bridges, and nothing else named", () => {
		for (const url of [
			"chrome-extension://abcdef/content.js",
			"moz-extension://abcdef/content.js",
			"safari-extension://abcdef/content.js",
			"safari-web-extension://abcdef/content.js",
		]) {
			expect(DENY_URLS.some((pattern) => pattern.test(url))).toBe(true);
		}
		expect(DENY_URLS.some((pattern) => pattern.test("https://example.com/assets/index.js"))).toBe(
			false,
		);
		expect(IGNORE_ERRORS.some((pattern) => pattern.test("Error: Java object is gone"))).toBe(true);
		expect(IGNORE_ERRORS.some((pattern) => pattern.test("Error invoking postMessage: Java"))).toBe(
			true,
		);
		expect(IGNORE_ERRORS.some((pattern) => pattern.test("TypeError: x is undefined"))).toBe(false);
	});

	it("cuts an event's request to the URL without query or fragment, and the user agent alone", () => {
		const event = scrubRequest({
			request: {
				url: "https://example.com/menu?token=abc&email=a@b.c#frag",
				headers: { Referer: "https://other.example/?x=1", "User-Agent": "Agent/1" },
			},
		});
		expect(event.request).toEqual({
			url: "https://example.com/menu",
			headers: { "User-Agent": "Agent/1" },
		});
		expect(
			scrubRequest({ request: { headers: { Referer: "https://o.example/?x=1" } } }).request,
		).toEqual({});
		expect(getClient()?.getOptions().beforeSend).toBe(scrubRequest);
	});
});
