// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
	accessSync,
	constants,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
	bin: Record<string, string>;
	files: string[];
};
const COMMANDS = Object.entries(manifest.bin);

/** Runs a command's entry file the way its shebang would, in `cwd`. */
function run(command: string, args: string[], cwd: string, env: Record<string, string> = {}) {
	const file = join(ROOT, manifest.bin[command]);
	const runner = readFileSync(file, "utf8").split("\n")[0].replace("#!/usr/bin/env ", "");
	return spawnSync(runner, [file, ...args], {
		cwd,
		encoding: "utf8",
		env: { ...process.env, VERCEL: "", ...env },
	});
}

/**
 * The commands a site's package.json calls by name. Each is a file the
 * package publishes, run by the program its first line names.
 */
describe("the bin map", () => {
	it("names the eight commands", () => {
		expect(Object.keys(manifest.bin).sort()).toEqual([
			"atelic-check-access",
			"atelic-check-links",
			"atelic-check-wall",
			"atelic-print-sheets",
			"atelic-reader-link",
			"atelic-seal-document",
			"atelic-serve-static",
			"atelic-stamp-health",
		]);
	});

	it("publishes the folder the commands live in", () => {
		expect(manifest.files).toContain("bin");
	});

	it.each(COMMANDS)("%s is an executable file that opens on a shebang", (_command, path) => {
		const file = join(ROOT, path);
		expect(path.startsWith("./bin/")).toBe(true);
		expect(() => accessSync(file, constants.X_OK)).not.toThrow();
		const first = readFileSync(file, "utf8").split("\n")[0];
		const runner = path.endsWith(".sh") ? "bash" : path.endsWith(".mjs") ? "node" : "bun";
		expect(first).toBe(`#!/usr/bin/env ${runner}`);
	});
});

describe("the commands' own lines", () => {
	let site: string;
	beforeEach(() => {
		// The real path, since a command reports the directory as the system names it.
		site = realpathSync(mkdtempSync(join(tmpdir(), "bin-site-")));
	});
	afterEach(() => rmSync(site, { recursive: true, force: true }));

	function config(access: string) {
		mkdirSync(join(site, "src"), { recursive: true });
		writeFileSync(
			join(site, "src", "site.config.ts"),
			`export const site = { url: "https://summit.atelic.me", access: "${access}", analytics: { identify: [] } };\n`,
		);
	}

	it("atelic-check-wall with no host prints its usage and exits 2", () => {
		const result = run("atelic-check-wall", [], site);
		expect(result.status).toBe(2);
		expect(result.stderr).toContain("usage: bun run check:wall <host> [path ...]");
	});

	it("atelic-reader-link with no email prints its usage and exits 1", () => {
		const result = run("atelic-reader-link", [], site);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Usage: bun run reader <email>");
	});

	it("atelic-reader-link reads the config of the directory it is run in, and says so when none is there", () => {
		const missing = run("atelic-reader-link", ["reader@example.com", "--no-qr"], site);
		expect(missing.status).toBe(1);
		expect(missing.stderr.trim()).toBe(
			`[reader] no src/site.config.ts in ${site}. Run this from the root of an artifact site.`,
		);

		config("public");
		const minted = run(
			"atelic-reader-link",
			["reader@example.com", "/report", "--token", "abc"],
			site,
		);
		expect(minted.status).toBe(0);
		expect(minted.stdout).toContain("https://summit.atelic.me/report?k=abc");
	});

	it("atelic-check-access reads the config of the directory it is run in", () => {
		const missing = run("atelic-check-access", [], site);
		expect(missing.status).toBe(1);
		expect(missing.stderr).toContain("[access] no src/site.config.ts in");

		config("public");
		expect(run("atelic-check-access", [], site).status).toBe(0);
	});

	it("atelic-check-access fails a private site on the host with no wall, and passes it armed", () => {
		config("private");
		const open = run("atelic-check-access", [], site, {
			VERCEL: "1",
			GATE_SESSION_SECRET: "",
			GATE_ALLOWLIST: "",
			RESEND_API_KEY: "",
		});
		expect(open.status).toBe(1);
		expect(open.stderr).toContain("the wall is not armed");
		const armed = run("atelic-check-access", [], site, {
			VERCEL: "1",
			GATE_SESSION_SECRET: "a-long-random-secret",
			GATE_ALLOWLIST: "owner@example.com",
			RESEND_API_KEY: "re_example",
		});
		expect(armed.status).toBe(0);
	});

	it("atelic-seal-document with no config prints its usage and exits 1", () => {
		const result = run("atelic-seal-document", [], site);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("usage: atelic-seal-document <config.json> [out.json]");
	});

	it("atelic-seal-document seals the document a config names, beside the working directory", () => {
		writeFileSync(join(site, "document.html"), "<h1>A Proposal</h1>");
		writeFileSync(
			join(site, "seal.json"),
			JSON.stringify({
				content: "./document.html",
				people: [{ id: "reader", email: "reader@example.com" }],
			}),
		);
		const result = run("atelic-seal-document", ["seal.json", "payload.json"], site);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain("(1 readers)");
		const payload = JSON.parse(readFileSync(join(site, "payload.json"), "utf8"));
		expect(Object.keys(payload).sort()).toEqual(["civ", "ct", "people"]);
		expect(Object.keys(payload.people[0]).sort()).toEqual(["id", "iv", "salt", "wrapped"]);
	});

	it("atelic-stamp-health writes health.json into the build of the directory it is run in", () => {
		mkdirSync(join(site, "dist", "client"), { recursive: true });
		const result = run("atelic-stamp-health", [], site, { VERCEL_GIT_COMMIT_SHA: "abcdef0123456" });
		expect(result.status).toBe(0);
		const health = JSON.parse(readFileSync(join(site, "dist", "client", "health.json"), "utf8"));
		expect(Object.keys(health)).toEqual(["status", "commit", "builtAt"]);
		expect(health.commit).toBe("abcdef0");
	});

	it("atelic-print-sheets with no target says what it needs and exits 1", () => {
		const result = run("atelic-print-sheets", [], site);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("url or built directory required");
	});
});
