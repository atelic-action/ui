// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { auditBasePath } from "../../src/scripts/check-base-path";
import { runCanary } from "../../src/scripts/contact-canary";
import { siteBasePath } from "../../src/scripts/serve-static";

const REWRITES = [
	{ source: "/proto/:path*", destination: "/:path*" },
	{ source: "/proto", destination: "/" },
];

describe("auditBasePath", () => {
	const page = (href: string) => ({
		path: "dist/client/index.html",
		text: `<a href="${href}">x</a>`,
	});

	it("checks nothing at the root and finds no problem", () => {
		const report = auditBasePath({
			configured: undefined,
			override: undefined,
			files: [page("/faqs")],
			vercel: {},
			onVercel: false,
		});
		expect(report).toEqual({ base: "", rehearsal: false, checked: 1, problems: [], warnings: [] });
	});

	it("names each path that skipped the base, and each missing rewrite", () => {
		const report = auditBasePath({
			configured: "/proto",
			override: undefined,
			files: [page("/faqs"), { path: "dist/client/a.css", text: "a{background:url(/img.png)}" }],
			vercel: {},
			onVercel: false,
		});
		expect(report.checked).toBe(2);
		expect(report.problems).toContain("dist/client/index.html: /faqs lacks the base /proto");
		expect(report.problems).toContain("dist/client/a.css: /img.png lacks the base /proto");
		expect(
			report.problems.filter((p) => p.startsWith("vercel.json: missing rewrite")),
		).toHaveLength(2);
	});

	it("only warns about vercel.json on a rehearsal build off Vercel, and fails it on Vercel", () => {
		const input = {
			configured: undefined,
			override: "/proto",
			files: [page("/proto/faqs")],
			vercel: {},
		};
		const local = auditBasePath({ ...input, onVercel: false });
		expect(local.rehearsal).toBe(true);
		expect(local.problems).toEqual([]);
		expect(local.warnings).toHaveLength(2);

		const hosted = auditBasePath({ ...input, onVercel: true });
		expect(hosted.problems).toHaveLength(2);
	});

	it("passes a based build that carries the base and both rewrites", () => {
		const report = auditBasePath({
			configured: "/proto",
			override: undefined,
			files: [page("/proto/faqs")],
			vercel: { rewrites: REWRITES },
			onVercel: true,
		});
		expect(report.problems).toEqual([]);
	});
});

describe("runCanary", () => {
	const ENV = {
		SITE_URL: "https://summit.example.com/",
		CONTACT_EXPECTED_TO: "owner@example.com",
		CONTACT_CANARY_TOKEN: "canary-token",
	};
	const reply = (status: number, body: unknown) =>
		vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

	it("fails on each missing variable, naming it", async () => {
		expect((await runCanary({})).message).toBe("FAIL: SITE_URL is not set");
		expect((await runCanary({ SITE_URL: ENV.SITE_URL })).message).toBe(
			"FAIL: CONTACT_EXPECTED_TO is not set",
		);
		expect(
			(await runCanary({ SITE_URL: ENV.SITE_URL, CONTACT_EXPECTED_TO: "a@b.c" })).message,
		).toBe("FAIL: CONTACT_CANARY_TOKEN is not set");
	});

	it("skips a .invalid host without sending anything", async () => {
		const fetcher = vi.fn();
		const result = await runCanary({ SITE_URL: "https://canary.invalid" }, fetcher);
		expect(result.verdict).toBe("skip");
		expect(fetcher).not.toHaveBeenCalled();
	});

	it("posts the token to the site's relay and passes on an id and the expected inbox", async () => {
		const fetcher = reply(200, { ok: true, id: "re_1", to: "owner@example.com" });
		const result = await runCanary(ENV, fetcher as unknown as typeof fetch);
		expect(result).toEqual({
			verdict: "pass",
			message: "ok: Resend id re_1, destination owner@example.com",
		});
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe("https://summit.example.com/api/contact");
		expect(JSON.parse(init.body)).toMatchObject({ canary: "canary-token", company: "" });
	});

	it("fails a relay error, a send with no id, and a destination it did not expect", async () => {
		const run = (status: number, body: unknown) =>
			runCanary(ENV, reply(status, body) as unknown as typeof fetch);
		expect((await run(500, { error: "no key" })).message).toBe("FAIL: relay returned 500: no key");
		expect((await run(200, { ok: true, to: "owner@example.com" })).message).toContain(
			"without an id",
		);
		expect((await run(200, { ok: true, id: "re_1", to: "someone@else.com" })).message).toBe(
			"FAIL: configured destination is someone@else.com, expected owner@example.com",
		);
	});
});

describe("siteBasePath", () => {
	let site: string;
	beforeEach(() => {
		site = mkdtempSync(join(tmpdir(), "serve-static-"));
	});
	afterEach(() => rmSync(site, { recursive: true, force: true }));

	it("serves at the root with no config, and from the config's base when it has one", async () => {
		expect(await siteBasePath(site, {})).toBe("");
		mkdirSync(join(site, "src"));
		writeFileSync(
			join(site, "src", "site.config.ts"),
			'export const site = { url: "https://x.test/proto", basePath: "proto/" };\n',
		);
		expect(await siteBasePath(site, {})).toBe("/proto");
	});

	it("takes the rehearsal override over the config, an empty one meaning the root", async () => {
		expect(await siteBasePath(site, { VITE_BASE_PATH: "/preview" })).toBe("/preview");
		expect(await siteBasePath(site, { VITE_BASE_PATH: "" })).toBe("");
	});
});
