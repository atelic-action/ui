/**
 * The deploy proof for a private artifact: the wall answers before any link
 * goes out (the practice's FOOTPRINT.md, Privacy). It asks the live host
 * for each document with no cookie and passes only when every one answers
 * with the wall's redirect to /login. A document that answers 200 is
 * readable by anyone holding the link, and a 5xx is a host that is down
 * rather than walled; both fail.
 *
 * The documents are /writeup, plus /report and /proposal when this repo
 * carries those routes. The wall holds files too (needsSession in @atelic-action/ui/gate), so it
 * also asks for the printed copy at /writeup.pdf, the first real screenshot
 * under public/images/, and, when the repo has been built, the first chunk
 * under /assets/doc/, where a document's content compiles to. Each of those
 * must answer with the same redirect: the wall holds a path whether or not
 * the file is there, so a 404 means the wall never ran for it.
 *
 * One thing must stay open on purpose: when public/brand/ has a file, it
 * asks for the first and requires a 200. Brand marks live there because the
 * header draws them on every page, the login page included, and a mark the
 * wall held would leave the login page asking for a file it cannot have.
 *
 * Then it proves the two sign in functions answer, because a wall whose
 * functions cannot load holds every page and can send no link. It posts an
 * address on no allowlist to /api/auth/request-link, so nothing is ever
 * sent, and requires the 200 every address gets. It asks
 * /api/auth/verify for a token that is not one and requires the function's
 * own 302 back to /login?e=expired. A 5xx from either is a function that
 * failed to load: on 2026-10-01 both failed on an extensionless import.
 *
 * Usage: atelic-check-wall <host> [path ...], or `bun run check:wall <host>`
 * in a site, from the site's root
 *   bun run check:wall summit.atelic.me
 *   bun run check:wall https://summit.atelic.me /writeup /report
 * The sign in functions are asked only when no path is named.
 * Exits 1 unless every path answers as it must.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * One thing to ask the host for. Every probe but a sign in one is a GET with
 * no body.
 */
export type Probe =
	| {
			path: string;
			/**
			 * A page the wall must stand in front of, a file it must hold back, or a
			 * brand mark it must leave open.
			 */
			kind: "document" | "file" | "open";
	  }
	| {
			path: string;
			/**
			 * A sign in function that must answer for itself: the request for a
			 * link is a POST that must answer 200, and the verify is a GET that
			 * must answer its own redirect back to /login.
			 */
			kind: "signin";
			method: "GET" | "POST";
			/** Sent as JSON with a POST. */
			body?: Record<string, string>;
	  };

/** The shape of an answer the classifier reads; a fetch Response fits it. */
export interface WallAnswer {
	status: number;
	headers: { get(name: string): string | null };
}

export interface WallVerdict {
	ok: boolean;
	reason: string;
}

/** A bare host or a full URL, as its origin. */
export function toOrigin(host: string): string {
	const withScheme = /^https?:\/\//.test(host) ? host : `https://${host}`;
	return new URL(withScheme).origin;
}

export interface WallTargets {
	/** Whether this repo carries a route, by its file name in src/routes/. */
	hasRoute: (name: string) => boolean;
	/** The first file under public/images/, as a path from the host root. */
	image?: string;
	/** The first chunk under dist/client/assets/doc/, when the repo is built. */
	docChunk?: string;
	/** The first file under public/brand/, which must stay open. */
	brand?: string;
}

/** The paths to ask for: the documents this repo carries, the held files, then the open mark. */
export function wallProbes({ hasRoute, image, docChunk, brand }: WallTargets): Probe[] {
	const probes: Probe[] = [{ path: "/writeup", kind: "document" }];
	if (hasRoute("report")) probes.push({ path: "/report", kind: "document" });
	if (hasRoute("proposal")) probes.push({ path: "/proposal", kind: "document" });
	probes.push({ path: "/writeup.pdf", kind: "file" });
	if (image) probes.push({ path: image, kind: "file" });
	if (docChunk) probes.push({ path: docChunk, kind: "file" });
	if (brand) probes.push({ path: brand, kind: "open" });
	return probes;
}

/** The address the sign in request posts: on no allowlist, so no link is ever sent. */
export const CHECK_EMAIL = "wall-check@example.com";

/** The two sign in functions, asked by default after the wall's own probes. */
export function signinProbes(): Probe[] {
	return [
		{
			path: "/api/auth/request-link",
			kind: "signin",
			method: "POST",
			body: { email: CHECK_EMAIL },
		},
		{ path: "/api/auth/verify?token=not-a-token", kind: "signin", method: "GET" },
	];
}

/** The first file in a directory, sorted, as `prefix/name`; none if it is empty or absent. */
export function firstFile(dir: string, prefix: string): string | undefined {
	if (!existsSync(dir)) return undefined;
	const name = readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && !entry.name.startsWith("."))
		.map((entry) => entry.name)
		.sort()[0];
	return name ? `${prefix}/${encodeURIComponent(name)}` : undefined;
}

const HOST_DOWN =
	"the host is failing, not walled. On 2026-09-09 a new artifact host answered MIDDLEWARE_INVOCATION_FAILED on every page (ATE-537): verify the host answers before any link goes out.";

/** Whether a brand mark answered open, as it must. */
function classifyOpen(answer: WallAnswer, origin: string): WallVerdict {
	const { status } = answer;
	if (status === 200) {
		return { ok: true, reason: `${status}: open on purpose, a brand mark the header draws` };
	}
	if (status >= 300 && status < 400) {
		const location = answer.headers.get("location");
		const toLogin = location && new URL(location, origin).pathname === "/login";
		return {
			ok: false,
			reason: toLogin
				? `${status} to /login: the wall holds a brand mark, so the login page asks for a file it cannot have. Brand marks stay open under /brand/ (needsSession in @atelic-action/ui/gate)`
				: `${status} to ${location ?? "nowhere"}: a brand mark should answer 200`,
		};
	}
	if (status > 200 && status < 300) {
		return {
			ok: false,
			reason: `${status}: a brand mark should answer 200 with the file, not another success code`,
		};
	}
	if (status === 404) {
		return { ok: false, reason: "404: the brand mark is not on the host. Check the deploy" };
	}
	if (status >= 500) return { ok: false, reason: `${status}: ${HOST_DOWN}` };
	if (status === 0) return { ok: false, reason: `no answer: ${HOST_DOWN}` };
	return { ok: false, reason: `${status}: a brand mark should answer 200` };
}

const FUNCTION_FAILED =
	"the sign in function failed to load. On 2026-10-01 the first host with the wall armed answered FUNCTION_INVOCATION_FAILED here (ERR_MODULE_NOT_FOUND on an extensionless import), so the wall held every page and could send no link: the two files under api/auth/ must each be a re export from @atelic-action/ui, whose gate ships compiled for this reason";

/** Whether a sign in function answered for itself, as it must. */
function classifySignin(
	probe: Extract<Probe, { kind: "signin" }>,
	answer: WallAnswer,
	origin: string,
): WallVerdict {
	const { status } = answer;
	if (status >= 500) return { ok: false, reason: `${status}: ${FUNCTION_FAILED}` };
	if (status === 0) return { ok: false, reason: `no answer: ${HOST_DOWN}` };
	if (status === 401 || status === 403) {
		return {
			ok: false,
			reason: `${status}: Vercel Deployment Protection or another lock answered, not the function. Turn Deployment Protection off (DEPLOY.md)`,
		};
	}
	if (status === 404) {
		return { ok: false, reason: "404: the sign in function is not on the host. Check the deploy" };
	}
	const location = answer.headers.get("location");
	if (probe.method === "POST") {
		if (status === 200) {
			return { ok: true, reason: "200: the request for a link answered, sending nothing" };
		}
		return {
			ok: false,
			reason: `${status}${location ? ` to ${location}` : ""}: the request for a link answers 200 to every address`,
		};
	}
	// A token that is not one gets the function's own redirect, marked expired;
	// the wall's redirect carries ?next= instead, so the two cannot be mistaken.
	const target = location ? new URL(location, origin) : undefined;
	if (
		status === 302 &&
		target?.pathname === "/login" &&
		target.searchParams.get("e") === "expired"
	) {
		return { ok: true, reason: "302 to /login?e=expired: the verify answered a bad token" };
	}
	return {
		ok: false,
		reason: `${status}${location ? ` to ${location}` : ""}: the verify answers a bad token with a 302 to /login?e=expired`,
	};
}

/**
 * Whether one answer is the wall (or, for a brand mark, open, or for a sign
 * in function, its own answer), and if not, what it is instead.
 */
export function classifyWall(probe: Probe, answer: WallAnswer, origin: string): WallVerdict {
	if (probe.kind === "open") return classifyOpen(answer, origin);
	if (probe.kind === "signin") return classifySignin(probe, answer, origin);
	const { status } = answer;
	if (status >= 300 && status < 400) {
		const location = answer.headers.get("location");
		if (location && new URL(location, origin).pathname === "/login") {
			return { ok: true, reason: `${status} to /login: the wall answered` };
		}
		return {
			ok: false,
			reason: `${status} to ${location ?? "nowhere"}, not the wall's /login: something other than the wall answered`,
		};
	}
	if (status >= 200 && status < 300) {
		const type = answer.headers.get("content-type") ?? "no content type";
		return probe.kind === "file"
			? {
					ok: false,
					reason: `${status} (${type}): the file is served outside the wall, so anyone with its address can open it. Check the middleware is the current one (needsSession in @atelic-action/ui/gate) and that the wall is armed`,
				}
			: {
					ok: false,
					reason: `${status} (${type}): the document is served with no wall, so anyone with the link can read it. Arm the wall (ACCESS-GATE.md), redeploy, and run this again`,
				};
	}
	if (status === 404) {
		return probe.kind === "file"
			? {
					ok: false,
					reason:
						"404: the wall never ran for this file. It holds a path whether or not the file is there, so a miss means the middleware let the request through",
				}
			: {
					ok: false,
					reason: "404: the host does not serve this page. Check the deploy and the prerender list",
				};
	}
	if (status === 401 || status === 403) {
		return {
			ok: false,
			reason: `${status}: Vercel Deployment Protection or another lock answered, not the wall. Turn Deployment Protection off (DEPLOY.md) so the wall is what a reader meets`,
		};
	}
	if (status >= 500) return { ok: false, reason: `${status}: ${HOST_DOWN}` };
	if (status === 0) return { ok: false, reason: `no answer: ${HOST_DOWN}` };
	return { ok: false, reason: `${status}: an answer the wall never gives` };
}

export type Fetcher = (url: string, init: RequestInit) => Promise<WallAnswer>;

/** The request for one probe: a GET unless a sign in probe says otherwise, with no cookie. */
export function probeRequest(probe: Probe): RequestInit {
	const headers: Record<string, string> = {
		"user-agent": "Mozilla/5.0 (wall-check; +https://atelic.me)",
	};
	const init: RequestInit = {
		method: probe.kind === "signin" ? probe.method : "GET",
		redirect: "manual",
		headers,
		signal: AbortSignal.timeout(15000),
	};
	if (probe.kind === "signin" && probe.body) {
		headers["content-type"] = "application/json";
		init.body = JSON.stringify(probe.body);
	}
	return init;
}

/** Asks for every probe with no cookie and never follows a redirect. */
export async function checkWall(origin: string, probes: Probe[], fetcher: Fetcher) {
	const results: Array<Probe & WallVerdict> = [];
	for (const probe of probes) {
		let answer: WallAnswer;
		try {
			answer = await fetcher(`${origin}${probe.path}`, probeRequest(probe));
		} catch {
			answer = { status: 0, headers: { get: () => null } };
		}
		results.push({ ...probe, ...classifyWall(probe, answer, origin) });
	}
	return results;
}

/**
 * The command. The routes, the images, the brand marks, and the build it
 * reads are the site's, found from the working directory.
 */
export async function main(args: string[], root: string = process.cwd()): Promise<void> {
	const [host, ...paths] = args;
	if (!host) {
		console.error("usage: bun run check:wall <host> [path ...]");
		process.exit(2);
	}
	const origin = toOrigin(host);
	const probes: Probe[] = paths.length
		? paths.map((path) => ({
				path,
				kind: path.startsWith("/brand/")
					? "open"
					: /\.[a-z0-9]+$/i.test(path)
						? "file"
						: "document",
			}))
		: [
				...wallProbes({
					hasRoute: (name) => existsSync(join(root, "src", "routes", `${name}.tsx`)),
					image: firstFile(join(root, "public", "images"), "/images"),
					docChunk: firstFile(join(root, "dist", "client", "assets", "doc"), "/assets/doc"),
					brand: firstFile(join(root, "public", "brand"), "/brand"),
				}),
				...signinProbes(),
			];
	if (!probes.some((probe) => probe.path.startsWith("/images/"))) {
		console.warn("[wall] no file under public/images/ to ask for; the screenshots go unproven");
	}
	if (!probes.some((probe) => probe.path.startsWith("/assets/doc/"))) {
		console.warn(
			"[wall] no build in dist/client/assets/doc/; run bun run build first to prove the content chunks",
		);
	}
	console.log(`[wall] asking ${origin} for ${probes.length} paths with no cookie`);
	const results = await checkWall(origin, probes, (url, init) => fetch(url, init));
	for (const result of results) {
		const line = `  ${result.ok ? "ok" : "FAIL"} ${result.path}: ${result.reason}`;
		if (result.ok) console.log(line);
		else console.error(line);
	}
	const failed = results.filter((result) => !result.ok).length;
	if (failed > 0) {
		console.error(
			`[wall] ${failed} of ${results.length} failed. No link goes out until this passes.`,
		);
		process.exit(1);
	}
	const signin = probes.some((probe) => probe.kind === "signin");
	console.log(
		signin
			? "[wall] the wall holds every document and file asked for, the brand mark is open, and the sign in functions answered"
			: "[wall] the wall holds every document and file asked for, and the brand mark is open",
	);
}
