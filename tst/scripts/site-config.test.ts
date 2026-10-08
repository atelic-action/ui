// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSite, SITE_CONFIG, siteConfigPath } from "../../src/scripts/site-config";

/**
 * A command lives in the package and reads the site it is run in, so the
 * config is found from a directory and never from the command's own place.
 */
describe("loadSite", () => {
	let dir: string;
	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "site-config-"));
	});
	afterEach(() => rmSync(dir, { recursive: true, force: true }));

	function write(source: string) {
		mkdirSync(join(dir, "src"), { recursive: true });
		writeFileSync(join(dir, SITE_CONFIG), source);
	}

	it("resolves the config against the directory it is given", () => {
		expect(siteConfigPath(dir)).toBe(join(dir, "src", "site.config.ts"));
	});

	it("reads the site export of the config in that directory", async () => {
		write('export const site = { url: "https://summit.atelic.me", access: "private" };\n');
		const site = await loadSite(dir);
		expect(site.url).toBe("https://summit.atelic.me");
		expect(site.access).toBe("private");
	});

	it("fails in one line naming the directory when no config is there", async () => {
		await expect(loadSite(dir)).rejects.toThrow(`no src/site.config.ts in ${dir}`);
		const message = await loadSite(dir).catch((error: Error) => error.message);
		expect(message).not.toContain("\n");
	});

	it("fails when the config exports no site", async () => {
		write("export const other = {};\n");
		await expect(loadSite(dir)).rejects.toThrow("exports no `site`");
	});
});
