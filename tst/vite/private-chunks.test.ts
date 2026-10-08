// @vitest-environment node
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

	it("lets the heads, the 404's copy, and the sealed proposal ship to every page", () => {
		expect(isPrivateContent(`${SRC}/content/writeup.meta.ts`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/report.meta.ts`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/not-found.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/proposal.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/content/proposal-payload.json`)).toBe(false);
	});

	it("leaves everything outside src/content alone", () => {
		expect(isPrivateContent(`${SRC}/components/writeup/Writeup.tsx`)).toBe(false);
		expect(isPrivateContent(`${SRC}/routes/writeup.tsx`)).toBe(false);
		expect(isPrivateContent("/repo/node_modules/react/index.js")).toBe(false);
	});
});
