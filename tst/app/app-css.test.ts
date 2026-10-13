// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sheet = resolve(__dirname, "../../src/styles/app.css");
const css = readFileSync(sheet, "utf8");

describe("styles/app.css", () => {
	it("points Tailwind at the shell's components, relative to itself", () => {
		const match = css.match(/^@source\s+"([^"]+)";/m);
		expect(match).not.toBeNull();
		const target = resolve(dirname(sheet), match?.[1] ?? "");
		expect(target).toBe(resolve(__dirname, "../../src/app"));
		expect(existsSync(resolve(target, "layout/AppLayout.tsx"))).toBe(true);
	});

	it("maps every shadcn token the kit's utilities name", () => {
		for (const token of [
			"background",
			"foreground",
			"primary",
			"secondary",
			"muted",
			"accent",
			"destructive",
			"card",
			"popover",
			"border",
			"input",
			"ring",
			"brand",
		]) {
			expect(css).toContain(`--color-${token}: hsl(var(--${token}))`);
		}
	});

	it("carries one app's tokens and no more", () => {
		for (const name of ["--season", "--paper-deep", "--score-ok", "Pinole", "Strava"]) {
			expect(css).not.toContain(name);
		}
	});
});
