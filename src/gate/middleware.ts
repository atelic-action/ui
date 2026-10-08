/**
 * Access gate: the routing middleware.
 *
 * Opt in and fail open: with no GATE_SESSION_SECRET set the gate is dormant
 * and every request passes, so a site is fully public. Set the secret (and an
 * allowlist) on the Vercel project and this same code starts enforcing: a
 * request without a valid session cookie is redirected to /login. The
 * session's address has to be on the allowlist still, so taking one off (and
 * redeploying) ends that reader's session.
 *
 * A site's root `middleware.ts` exports this as its default beside its own
 * `config`, which the platform reads from that file and nowhere else:
 *
 *   export { default } from "@atelic-action/ui/gate/middleware";
 *   export const config = { matcher: ["/((?!api/auth/).*)"] };
 *
 * That matcher keeps only the two sign in functions away from the middleware,
 * so any other function a host adds is held like a page. The default holds
 * back everything `needsSession` in wall.ts does. A site
 * whose matcher already leaves its open paths out passes its own test to
 * `createMiddleware`.
 */
import { isAllowed } from "./config.js";
import { verifyToken } from "./tokens.js";
import { needsSession as wallNeedsSession } from "./wall.js";

export interface MiddlewareOptions {
	/** Whether a path needs a session once the gate is armed. */
	needsSession?: (pathname: string) => boolean;
}

function readCookie(header: string, name: string): string | undefined {
	const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
	if (!match) return undefined;
	try {
		return decodeURIComponent(match[1]);
	} catch {
		return undefined;
	}
}

export function createMiddleware(options: MiddlewareOptions = {}) {
	const needsSession = options.needsSession ?? wallNeedsSession;

	return async function middleware(request: Request): Promise<Response | undefined> {
		const secret = process.env.GATE_SESSION_SECRET;
		if (!secret) return; // gate off, let everything through

		const url = new URL(request.url);
		if (!needsSession(url.pathname)) return; // what the login page needs to render

		const cookies = request.headers.get("cookie") ?? "";
		const claims = await verifyToken(readCookie(cookies, "gate_session"), secret);
		if (claims?.p === "session" && isAllowed(claims.e, process.env.GATE_ALLOWLIST)) {
			return; // valid session, continue to the site
		}

		const login = new URL("/login", url.origin);
		login.searchParams.set("next", url.pathname + url.search);
		return Response.redirect(login.toString(), 302);
	};
}

export default createMiddleware();
