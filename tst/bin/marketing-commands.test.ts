// @vitest-environment node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
	bin: Record<string, string>;
};

/** Runs a command's entry file under bun, as its shebang would, in `cwd`. */
function run(command: string, cwd: string, env: Record<string, string> = {}) {
	// A set VITE_BASE_PATH, even an empty one, is a rehearsal build, so it is left out.
	const { VITE_BASE_PATH: _rehearsal, ...inherited } = process.env;
	return spawnSync("bun", [join(ROOT, manifest.bin[command])], {
		cwd,
		encoding: "utf8",
		env: { ...inherited, VERCEL: "", ...env },
	});
}

/**
 * The three commands a marketing site's build and its canary workflow call,
 * run the way a site runs them: from the site's root, on its own files.
 */
describe("the marketing commands", () => {
	let site: string;
	beforeEach(() => {
		site = realpathSync(mkdtempSync(join(tmpdir(), "marketing-site-")));
	});
	afterEach(() => rmSync(site, { recursive: true, force: true }));

	function build(basePath: string, html: string, rewrites: unknown[] = []) {
		mkdirSync(join(site, "src"), { recursive: true });
		writeFileSync(
			join(site, "src", "site.config.ts"),
			`export const site = { url: "https://summit.example.com${basePath}", basePath: "${basePath}" };\n`,
		);
		mkdirSync(join(site, "dist", "client", "about"), { recursive: true });
		writeFileSync(join(site, "dist", "client", "about", "index.html"), html);
		writeFileSync(join(site, "vercel.json"), JSON.stringify({ rewrites }));
	}

	it("atelic-clean-sitemap dedupes the built sitemap, and says so when there is none", () => {
		const none = run("atelic-clean-sitemap", site);
		expect(none.status).toBe(0);
		expect(none.stdout).toContain("not built (base path set)");

		mkdirSync(join(site, "dist", "client"), { recursive: true });
		const entry = (loc: string) => `<url><loc>${loc}</loc></url>\n`;
		writeFileSync(
			join(site, "dist", "client", "sitemap.xml"),
			`<urlset>\n${entry("https://x.test/faqs")}${entry("https://x.test/faqs#a")}</urlset>\n`,
		);
		const cleaned = run("atelic-clean-sitemap", site);
		expect(cleaned.status).toBe(0);
		expect(cleaned.stdout).toContain("1 duplicate URL removed");
		const xml = readFileSync(join(site, "dist", "client", "sitemap.xml"), "utf8");
		expect(xml.match(/<loc>/g)).toHaveLength(1);
	});

	it("atelic-check-base-path passes a based build whose every path carries the base", () => {
		build("/proto", '<a href="/proto/faqs">FAQs</a>', [
			{ source: "/proto/:path*", destination: "/:path*" },
			{ source: "/proto", destination: "/" },
		]);
		const result = run("atelic-check-base-path", site);
		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("[base-path] /proto: 1 HTML and CSS files checked");
	});

	it("atelic-check-base-path fails a based build with a path that skipped the base", () => {
		build("/proto", '<a href="/faqs">FAQs</a>', [
			{ source: "/proto/:path*", destination: "/:path*" },
			{ source: "/proto", destination: "/" },
		]);
		const result = run("atelic-check-base-path", site);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("dist/client/about/index.html: /faqs lacks the base /proto");
	});

	it("atelic-check-base-path says where it looked when there is no config", () => {
		const result = run("atelic-check-base-path", site);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`[base-path] no src/site.config.ts in ${site}`);
	});

	it("atelic-contact-canary fails with no SITE_URL and passes on the off switch", () => {
		const unset = run("atelic-contact-canary", site, { SITE_URL: "" });
		expect(unset.status).toBe(1);
		expect(unset.stderr).toContain("FAIL: SITE_URL is not set");

		const off = run("atelic-contact-canary", site, { SITE_URL: "https://canary.invalid" });
		expect(off.status).toBe(0);
		expect(off.stdout).toContain("skipped");
	});
});
