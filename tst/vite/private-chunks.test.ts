// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isPrivateContent } from "../../src/vite/private-chunks";

const SRC = "/repo/src";

/**
 * What the build may ship where the login page can load it. Every content
 * module is private unless it is on the short public list, so a new artifact
 * starts behind the wall.
 */
describe("isPrivateContent", () => {
	it("treats the writeup and the monthly page as private, and any new content module too", () => {
		expect(isPrivateContent(`${SRC}/content/writeup.tsx`)).toBe(true);
		expect(isPrivateContent(`${SRC}/content/report.tsx`)).toBe(true);
		expect(isPrivateContent(`${SRC}/content/reveal.tsx`)).toBe(true);
		expect(isPrivateContent(`${SRC}/content/writeup.tsx?tsr-split=component`)).toBe(true);
	});

	it("lets the heads, the 404's copy, the sealed proposal, and the note ship to every page", () => {
		expect(isPrivateContent(`${SRC}/content/writeup.meta.ts`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/report.meta.ts`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/not-found.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/proposal.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/proposal-payload.json`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/notes.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/notes.json`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/notes.tsx?tsr-split=component`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/notes-internal.ts`)).toBe(true);
	});

	it("leaves everything outside src/content alone", () => {
		expect(isPrivateContent(`${SRC}/components/writeup/Writeup.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/routes/writeup.tsx`)).toBe(false);
		expect(isPrivateContent("/repo/node_modules/react/index.js")).toBe(false);
	});
});

/**
 * `@atelic-action/ui/vite/private-chunks` is the entry for a site that writes
 * its own configuration and installs neither TanStack Start nor the React
 * plugin. So the file may import nothing at run time but its own siblings:
 * from Vite, types alone.
 */
describe("the private-chunks entry", () => {
	it("imports no optional peer when it loads", () => {
		const source = readFileSync(
			join(import.meta.dirname, "../../src/vite/private-chunks.ts"),
			"utf8",
		);
		expect(source).not.toMatch(/import\(|export\s[^;]*\sfrom\s/);
		const imports = source.split("\n").filter((line) => /^\s*import\s/.test(line));
		for (const line of imports) {
			expect(line.startsWith("import type ")).toBe(true);
		}
	});
});
