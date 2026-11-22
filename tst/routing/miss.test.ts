import { CATCH_ALL_ROUTE_ID, isMiss } from "../../src/routing";

const root = { routeId: "__root__", params: {}, staticData: {} };
const missing = (params: Record<string, string>) => params.slug !== "first-post";
const post = (slug: string) => ({
	routeId: "/blog/$slug",
	params: { slug },
	staticData: { missing },
});

describe("isMiss", () => {
	it("is a miss when the catch all route took the path", () => {
		expect(
			isMiss([
				root,
				{ routeId: CATCH_ALL_ROUTE_ID, params: { _splat: "nowhere" }, staticData: {} },
			]),
		).toBe(true);
	});

	it("is a miss when a route says its params name a page it does not have", () => {
		expect(isMiss([root, post("a-slug-nobody-wrote")])).toBe(true);
		expect(isMiss([root, post("first-post")])).toBe(false);
	});

	it("is not a miss for an ordinary page, or a route with no staticData", () => {
		expect(isMiss([root, { routeId: "/about", params: {}, staticData: {} }])).toBe(false);
		expect(isMiss([root, { routeId: "/about", params: {} }])).toBe(false);
		expect(isMiss([])).toBe(false);
	});

	it("is a miss once the router reports a match not found, and not for any other status", () => {
		const slug = { routeId: "/blog/$slug", params: { slug: "unwritten" } };
		expect(isMiss([root, { ...slug, status: "notFound" }])).toBe(true);
		for (const status of ["pending", "success", "error", "redirected"]) {
			expect(isMiss([root, { ...slug, status }]), status).toBe(false);
		}
		// The status counts on any match, the root's included.
		expect(
			isMiss([
				{ ...root, status: "notFound" },
				{ ...slug, status: "success" },
			]),
		).toBe(true);
	});

	it("is a miss when a match renders a not found nothing below handled, and only when set true", () => {
		const slug = { routeId: "/blog/$slug", params: { slug: "unwritten" } };
		expect(isMiss([root, { ...slug, globalNotFound: true }])).toBe(true);
		expect(isMiss([{ ...root, globalNotFound: true }, slug])).toBe(true);
		expect(isMiss([root, { ...slug, globalNotFound: false }])).toBe(false);
	});

	it("takes another catch all id for a tree that names it otherwise", () => {
		expect(isMiss([{ routeId: "/_site/$", params: {} }], "/_site/$")).toBe(true);
		expect(isMiss([{ routeId: "/_site/$", params: {} }])).toBe(false);
	});
});
