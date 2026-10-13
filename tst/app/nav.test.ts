import { describe, expect, it } from "vitest";
import { activeSection, isActivePath, isActiveSection } from "../../src/app/layout/nav";
import { testNav as navItems } from "./fixtures";

describe("nav", () => {
	it("matches a section on its own path and beneath it, but the root only on itself", () => {
		expect(isActivePath("/alpha", "/alpha")).toBe(true);
		expect(isActivePath("/alpha/one/12", "/alpha")).toBe(true);
		expect(isActivePath("/alphabet", "/alpha")).toBe(false);
		expect(isActivePath("/", "/")).toBe(true);
		expect(isActivePath("/beta", "/")).toBe(false);
	});

	it("resolves the section a deep path belongs to", () => {
		expect(activeSection("/alpha/two", navItems)?.label).toBe("Alpha");
		expect(activeSection("/beta/5/edit", navItems)?.label).toBe("Beta");
		expect(activeSection("/profile", navItems)).toBeUndefined();
	});

	it("lights a section on a path it claims outside its own href", () => {
		const beta = { label: "Beta", href: "/beta", icon: () => null, matches: ["/b"] };
		expect(isActiveSection("/b/12", beta)).toBe(true);
		expect(isActiveSection("/bravo", beta)).toBe(false);
	});

	it("carries a section's sub pages once, for every nav surface to read", () => {
		const alpha = navItems.find((item) => item.href === "/alpha");
		expect(alpha?.children?.map((child) => child.href)).toEqual(["/alpha/one", "/alpha/two"]);
		// Every child sits beneath its section, so the section stays lit deep in.
		for (const child of alpha?.children ?? []) {
			expect(isActivePath(child.href, "/alpha")).toBe(true);
		}
	});
});
