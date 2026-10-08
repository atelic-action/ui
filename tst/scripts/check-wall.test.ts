// @vitest-environment node
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	CHECK_EMAIL,
	checkWall,
	classifyWall,
	firstFile,
	type Probe,
	signinProbes,
	toOrigin,
	type WallAnswer,
	wallProbes,
} from "../../src/scripts/check-wall";

const ORIGIN = "https://summit.atelic.me";
const writeup: Probe = { path: "/writeup", kind: "document" };
const pdf: Probe = { path: "/writeup.pdf", kind: "file" };
const image: Probe = { path: "/images/profile.jpg", kind: "file" };

function answer(status: number, headers: Record<string, string> = {}): WallAnswer {
	return new Response(status >= 200 && status < 300 ? "<html>the document</html>" : null, {
		status,
		headers,
	});
}

/**
 * The wall check is the last gate before a private link goes out, so every
 * answer that is not the wall has to read as a failure: a page served open,
 * a redirect somewhere else, a host that is down, a file served or missing.
 * Only the redirect to /login passes, for a document and a file alike.
 */
describe("classifyWall", () => {
	it("passes the wall's redirect to /login, absolute or relative, with its next", () => {
		const absolute = answer(302, { location: `${ORIGIN}/login?next=%2Fwriteup` });
		expect(classifyWall(writeup, absolute, ORIGIN).ok).toBe(true);
		const relative = answer(307, { location: "/login?next=/writeup" });
		expect(classifyWall(writeup, relative, ORIGIN).ok).toBe(true);
	});

	it("fails a document served with no wall", () => {
		const verdict = classifyWall(
			writeup,
			answer(200, { "content-type": "text/html; charset=utf-8" }),
			ORIGIN,
		);
		expect(verdict.ok).toBe(false);
		expect(verdict.reason).toContain("anyone with the link can read it");
	});

	it("fails a redirect that is not the wall's", () => {
		const verdict = classifyWall(writeup, answer(308, { location: "/writeup/" }), ORIGIN);
		expect(verdict.ok).toBe(false);
		expect(verdict.reason).toContain("not the wall's /login");
	});

	it("fails a 5xx as a host that is down, with the note to verify it answers", () => {
		const verdict = classifyWall(writeup, answer(500), ORIGIN);
		expect(verdict.ok).toBe(false);
		expect(verdict.reason).toContain("ATE-537");
		expect(verdict.reason).toContain("verify the host answers before any link goes out");
	});

	it("fails Deployment Protection, which is a lock but not the wall", () => {
		expect(classifyWall(writeup, answer(401), ORIGIN).ok).toBe(false);
	});

	it("fails a document the host does not serve", () => {
		expect(classifyWall(writeup, answer(404), ORIGIN).ok).toBe(false);
	});

	it("passes a file only behind the wall's redirect, never served and never missing", () => {
		const walled = answer(302, { location: "/login?next=/images/profile.jpg" });
		expect(classifyWall(image, walled, ORIGIN).ok).toBe(true);
		expect(classifyWall(pdf, walled, ORIGIN).ok).toBe(true);

		const served = classifyWall(image, answer(200, { "content-type": "image/jpeg" }), ORIGIN);
		expect(served.ok).toBe(false);
		expect(served.reason).toContain("outside the wall");
		expect(classifyWall(pdf, answer(200, { "content-type": "application/pdf" }), ORIGIN).ok).toBe(
			false,
		);

		// The wall holds a path whether or not the file exists, so a miss means it never ran.
		const missing = classifyWall(pdf, answer(404), ORIGIN);
		expect(missing.ok).toBe(false);
		expect(missing.reason).toContain("the wall never ran");
	});
});

describe("wallProbes", () => {
	it("asks for the writeup and its printed copy, and the report and proposal when carried", () => {
		expect(wallProbes({ hasRoute: () => false }).map((p) => p.path)).toEqual([
			"/writeup",
			"/writeup.pdf",
		]);
		expect(wallProbes({ hasRoute: () => true }).map((p) => p.path)).toEqual([
			"/writeup",
			"/report",
			"/proposal",
			"/writeup.pdf",
		]);
	});

	it("asks for a real screenshot and a content chunk as files when there are some", () => {
		const probes = wallProbes({
			hasRoute: () => false,
			image: "/images/profile.jpg",
			docChunk: "/assets/doc/writeup-abc.js",
		});
		expect(probes.slice(-2)).toEqual([
			{ path: "/images/profile.jpg", kind: "file" },
			{ path: "/assets/doc/writeup-abc.js", kind: "file" },
		]);
	});

	it("asks for a brand mark as open, alongside the held checks, when public/brand has one", () => {
		const probes = wallProbes({
			hasRoute: () => false,
			image: "/images/profile.jpg",
			brand: "/brand/summit.svg",
		});
		expect(probes.at(-1)).toEqual({ path: "/brand/summit.svg", kind: "open" });
		expect(probes.filter((p) => p.kind === "file").map((p) => p.path)).toEqual([
			"/writeup.pdf",
			"/images/profile.jpg",
		]);
		expect(wallProbes({ hasRoute: () => false }).some((p) => p.kind === "open")).toBe(false);
	});
});

describe("classifyWall on a brand mark", () => {
	const mark: Probe = { path: "/brand/summit.svg", kind: "open" };

	it("passes a 200, because the header draws it on the login page", () => {
		const verdict = classifyWall(mark, answer(200, { "content-type": "image/svg+xml" }), ORIGIN);
		expect(verdict.ok).toBe(true);
		expect(verdict.reason).toContain("open on purpose");
	});

	it("fails the wall's redirect, a missing mark, and a host that is down", () => {
		const held = classifyWall(
			mark,
			answer(302, { location: "/login?next=/brand/summit.svg" }),
			ORIGIN,
		);
		expect(held.ok).toBe(false);
		expect(held.reason).toContain("the wall holds a brand mark");
		expect(classifyWall(mark, answer(404), ORIGIN).ok).toBe(false);
		expect(classifyWall(mark, answer(503), ORIGIN).reason).toContain("ATE-537");
	});

	it("takes only a 200 for a usable logo, never another success code", () => {
		const empty = classifyWall(mark, answer(206), ORIGIN);
		expect(empty.ok).toBe(false);
		expect(empty.reason).toContain("should answer 200");
	});
});

/**
 * A wall whose sign in functions cannot load holds every page and sends no
 * link, which is how the first host with the wall armed went out on
 * 2026-10-01. So each function has to answer for itself: the request for a
 * link with its 200, the verify with its own redirect back to /login.
 */
describe("classifyWall on a sign in function", () => {
	const [requestLink, verify] = signinProbes();
	const noAnswer: WallAnswer = { status: 0, headers: { get: () => null } };

	it("passes the request for a link only on a 200", () => {
		const verdict = classifyWall(requestLink, answer(200), ORIGIN);
		expect(verdict.ok).toBe(true);
		expect(classifyWall(requestLink, answer(400), ORIGIN).ok).toBe(false);
		expect(classifyWall(requestLink, answer(302, { location: "/login" }), ORIGIN).ok).toBe(false);
	});

	it("fails a 5xx as a function that failed to load, naming the extensionless import", () => {
		for (const probe of [requestLink, verify]) {
			const verdict = classifyWall(probe, answer(500), ORIGIN);
			expect(verdict.ok).toBe(false);
			expect(verdict.reason).toContain("failed to load");
			expect(verdict.reason).toContain("ERR_MODULE_NOT_FOUND");
			expect(verdict.reason).toContain("a re export from @atelic-action/ui");
		}
	});

	it("fails no answer at all", () => {
		for (const probe of [requestLink, verify]) {
			const verdict = classifyWall(probe, noAnswer, ORIGIN);
			expect(verdict.ok).toBe(false);
			expect(verdict.reason).toContain("no answer");
		}
	});

	it("passes the verify only on its own 302 to /login?e=expired, never the wall's redirect", () => {
		expect(classifyWall(verify, answer(302, { location: "/login?e=expired" }), ORIGIN).ok).toBe(
			true,
		);
		const absolute = answer(302, { location: `${ORIGIN}/login?e=expired` });
		expect(classifyWall(verify, absolute, ORIGIN).ok).toBe(true);

		// The wall's redirect would mean the middleware ran in front of the function.
		const walled = answer(302, { location: "/login?next=%2Fapi%2Fauth%2Fverify" });
		expect(classifyWall(verify, walled, ORIGIN).ok).toBe(false);
		expect(classifyWall(verify, answer(200), ORIGIN).ok).toBe(false);
		expect(classifyWall(verify, answer(404), ORIGIN).ok).toBe(false);
	});
});

describe("signinProbes", () => {
	it("posts an address on no allowlist for a link, then asks the verify for a token that is not one", () => {
		expect(signinProbes()).toEqual([
			{
				path: "/api/auth/request-link",
				kind: "signin",
				method: "POST",
				body: { email: "wall-check@example.com" },
			},
			{ path: "/api/auth/verify?token=not-a-token", kind: "signin", method: "GET" },
		]);
		expect(CHECK_EMAIL.endsWith("@example.com")).toBe(true);
	});

	it("are asked apart from the wall's own probes, which stay as they were", () => {
		const wall = wallProbes({ hasRoute: () => true, brand: "/brand/summit.svg" });
		expect(wall.some((p) => p.kind === "signin")).toBe(false);
		expect(signinProbes().every((p) => p.path.startsWith("/api/auth/"))).toBe(true);
	});
});

describe("firstFile", () => {
	// A site's public folder, stood up for the test: the script reads the
	// site it is run in, and this package is not one.
	let site: string;
	beforeAll(() => {
		site = mkdtempSync(join(tmpdir(), "check-wall-"));
		mkdirSync(join(site, "public", "images"), { recursive: true });
		mkdirSync(join(site, "public", "brand"), { recursive: true });
		for (const name of [".gitkeep", "profile.jpg", "analytics.png", "qr.png"]) {
			writeFileSync(join(site, "public", "images", name), "");
		}
		for (const name of ["summit.svg", "summit-on-dark.svg"]) {
			writeFileSync(join(site, "public", "brand", name), "");
		}
	});
	afterAll(() => rmSync(site, { recursive: true, force: true }));

	it("takes the first real file in public/images, skipping dotfiles, and nothing from a missing folder", () => {
		const images = join(site, "public", "images");
		const first = readdirSync(images)
			.filter((name) => !name.startsWith("."))
			.sort()[0];
		expect(first).toBe("analytics.png");
		expect(firstFile(images, "/images")).toBe(`/images/${first}`);
		expect(firstFile(join(images, "no-such-folder"), "/images")).toBeUndefined();
	});

	it("finds the first brand mark in public/brand, whatever a cut names it", () => {
		const brand = join(site, "public", "brand");
		const first = readdirSync(brand)
			.filter((name) => !name.startsWith("."))
			.sort()[0];
		expect(first).toBeDefined();
		expect(firstFile(brand, "/brand")).toBe(`/brand/${first}`);
	});
});

describe("toOrigin", () => {
	it("takes a bare host or a URL", () => {
		expect(toOrigin("summit.atelic.me")).toBe(ORIGIN);
		expect(toOrigin("https://summit.atelic.me/writeup")).toBe(ORIGIN);
	});
});

describe("checkWall", () => {
	it("asks with no cookie, never follows a redirect, and reads a dead host as a failure", async () => {
		const seen: Array<{ url: string; init: RequestInit }> = [];
		const results = await checkWall(
			ORIGIN,
			[writeup, { path: "/report", kind: "document" }],
			async (url, init) => {
				seen.push({ url, init });
				if (url.endsWith("/report")) throw new Error("connection refused");
				return answer(302, { location: "/login?next=/writeup" });
			},
		);
		expect(seen.map((s) => s.url)).toEqual([`${ORIGIN}/writeup`, `${ORIGIN}/report`]);
		for (const { init } of seen) {
			expect(init.redirect).toBe("manual");
			expect(new Headers(init.headers).has("cookie")).toBe(false);
		}
		expect(results.map((r) => r.ok)).toEqual([true, false]);
		expect(results[1].reason).toContain("no answer");
	});

	it("sends the request for a link as a JSON POST and the verify as a GET, with no cookie", async () => {
		const seen: Array<{ url: string; init: RequestInit }> = [];
		const results = await checkWall(ORIGIN, [writeup, ...signinProbes()], async (url, init) => {
			seen.push({ url, init });
			if (url.endsWith("/api/auth/request-link")) return answer(200);
			if (url.includes("/api/auth/verify")) return answer(302, { location: "/login?e=expired" });
			return answer(302, { location: "/login?next=/writeup" });
		});
		expect(seen.map((s) => [s.init.method, s.url])).toEqual([
			["GET", `${ORIGIN}/writeup`],
			["POST", `${ORIGIN}/api/auth/request-link`],
			["GET", `${ORIGIN}/api/auth/verify?token=not-a-token`],
		]);
		const post = seen[1].init;
		expect(JSON.parse(post.body as string)).toEqual({ email: "wall-check@example.com" });
		expect(new Headers(post.headers).get("content-type")).toBe("application/json");
		expect(seen[0].init.body).toBeUndefined();
		expect(seen[2].init.body).toBeUndefined();
		for (const { init } of seen) {
			expect(init.redirect).toBe("manual");
			expect(new Headers(init.headers).has("cookie")).toBe(false);
		}
		expect(results.map((r) => r.ok)).toEqual([true, true, true]);
	});
});
