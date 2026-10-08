/**
 * Access gate: verify a sign in link and start a session.
 *
 * Validates the signed token from the emailed link, sets the signed session
 * cookie (plus a readable email cookie for the watermark), and redirects
 * into the site. A site's `api/auth/verify.ts` re exports `GET` from here.
 *
 * Env (set on the Vercel project):
 * - GATE_SESSION_SECRET    signing secret; also the gate's on and off switch
 * - GATE_ALLOWLIST         the link's address must still be on it
 * - GATE_SESSION_DAYS      session lifetime in days (optional, default 7)
 * - GATE_WATERMARK_MODE    "pill" (default) or "tiled"
 */
import { isAllowed, positive } from "./config.js";
import { safeNext } from "./next.js";
import { signToken, verifyToken } from "./tokens.js";

function cookie(name: string, value: string, maxAge: number, httpOnly: boolean): string {
	const flags = ["Path=/", "Secure", "SameSite=Lax", `Max-Age=${maxAge}`];
	if (httpOnly) flags.unshift("HttpOnly");
	return `${name}=${encodeURIComponent(value)}; ${flags.join("; ")}`;
}

function redirect(location: string, headers?: Headers): Response {
	const merged = headers ?? new Headers();
	merged.set("Location", location);
	return new Response(null, { status: 302, headers: merged });
}

export async function GET(request: Request): Promise<Response> {
	const secret = process.env.GATE_SESSION_SECRET;
	if (!secret) return redirect("/login?e=expired");

	const token = new URL(request.url).searchParams.get("token");
	const claims = await verifyToken(token, secret);
	// An address taken off the allowlist after its link went out gets no session.
	if (claims?.p !== "link" || !isAllowed(claims.e, process.env.GATE_ALLOWLIST)) {
		return redirect("/login?e=expired");
	}

	const days = positive(process.env.GATE_SESSION_DAYS, 7);
	const maxAge = days * 24 * 60 * 60;
	const session = await signToken(
		{ e: claims.e, x: Math.floor(Date.now() / 1000) + maxAge, p: "session" },
		secret,
	);
	const mode = process.env.GATE_WATERMARK_MODE || "pill";

	const headers = new Headers();
	headers.append("Set-Cookie", cookie("gate_session", session, maxAge, true));
	headers.append("Set-Cookie", cookie("gate_email", claims.e, maxAge, false));
	headers.append("Set-Cookie", cookie("gate_wm", mode, maxAge, false));
	return redirect(safeNext(claims.n), headers);
}
