/**
 * Signed tokens for the access gate: compact JWTs under HS256, signed and
 * verified by jose over Web Crypto, so the same module runs in the routing
 * middleware and in the serverless sign in functions. The secret is always
 * passed in by the caller from the environment, so nothing here can reach a
 * client bundle.
 */
import { jwtVerify, SignJWT } from "jose";

export type TokenPurpose = "link" | "session";

export interface TokenClaims {
	/** Subject email. */
	e: string;
	/** Expiry, epoch seconds. */
	x: number;
	/** Purpose; keeps a short lived link token from being replayed as a session. */
	p: TokenPurpose;
	/** Post sign in path (link tokens only). */
	n?: string;
}

const encoder = new TextEncoder();

export async function signToken(claims: TokenClaims, secret: string): Promise<string> {
	const body: Record<string, unknown> = { p: claims.p };
	if (claims.n !== undefined) body.n = claims.n;
	return new SignJWT(body)
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(claims.e)
		.setExpirationTime(claims.x)
		.sign(encoder.encode(secret));
}

/**
 * The claims of a token this secret signed and that has not expired, or null
 * for anything else. The algorithm is pinned, so a token naming another one
 * (or none) is refused before its signature is read.
 */
export async function verifyToken(
	token: string | undefined | null,
	secret: string,
): Promise<TokenClaims | null> {
	if (!token || !secret) return null;
	try {
		const { payload } = await jwtVerify(token, encoder.encode(secret), {
			algorithms: ["HS256"],
			requiredClaims: ["sub", "exp"],
		});
		const { sub, exp, p, n } = payload;
		if (typeof sub !== "string" || typeof exp !== "number") return null;
		if (p !== "link" && p !== "session") return null;
		return { e: sub, x: exp, p, ...(typeof n === "string" ? { n } : {}) };
	} catch {
		return null;
	}
}
