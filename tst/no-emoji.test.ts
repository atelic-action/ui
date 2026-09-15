import { readFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import { join, relative } from "node:path";

/**
 * Icons come from lucide-react, never emoji, dingbat, or pictograph
 * characters: they render inconsistently across platforms and cannot take
 * the brand's color tokens. Typographic glyphs used as copy (the arrows and
 * the middle dot) stay legal, and a pictograph the copy genuinely needs, such
 * as the credit band's heart, ships as an escape sequence.
 */
const EMOJI = /[\u{2600}-\u{27bf}\u{1f000}-\u{1faff}]/u;

const SRC = join(import.meta.dirname, "..", "src");

describe("icons over emojis", () => {
	it("keeps src/ free of emoji and pictograph characters", async () => {
		const offenders: string[] = [];
		for await (const file of glob(`${SRC}/**/*.{ts,tsx,css}`)) {
			const lines = readFileSync(file, "utf8").split("\n");
			lines.forEach((line, i) => {
				const match = EMOJI.exec(line);
				if (match) offenders.push(`${relative(SRC, file)}:${i + 1} contains "${match[0]}"`);
			});
		}
		expect(offenders).toEqual([]);
	});
});
