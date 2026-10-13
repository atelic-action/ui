import { afterEach, describe, expect, it } from "vitest";
import { setAppConfig } from "../../src/app/config";
import { isPublicPage, isPublicRoute } from "../../src/app/lib/publicRoutes";
import { testConfig } from "./fixtures";

describe("publicRoutes", () => {
	afterEach(() => setAppConfig(testConfig));

	it("lets a signed out visitor load the exact public routes", () => {
		expect(isPublicRoute("/")).toBe(true);
		expect(isPublicRoute("/oauth/callback")).toBe(true);
		expect(isPublicRoute("/notes")).toBe(false);
	});

	it("matches a public page by prefix, never a sibling that shares the letters", () => {
		expect(isPublicPage("/u/forni/activity/390")).toBe(true);
		expect(isPublicPage("/u/forni")).toBe(true);
		expect(isPublicPage("/u/")).toBe(false);
		expect(isPublicPage("/u")).toBe(false);
		expect(isPublicPage("/users/me")).toBe(false);
	});

	it("counts a public page as a public route, and not the other way round", () => {
		expect(isPublicRoute("/u/forni/recipe/12")).toBe(true);
		expect(isPublicPage("/")).toBe(false);
	});

	it("opens nothing before the app has configured the shell", async () => {
		const config = await import("../../src/app/config");
		const peek = config.peekAppConfig();
		// A fresh module graph is not needed: an unconfigured shell is a null config.
		setAppConfig(null as never);
		expect(isPublicRoute("/")).toBe(false);
		expect(isPublicPage("/u/forni")).toBe(false);
		setAppConfig(peek ?? testConfig);
	});
});
