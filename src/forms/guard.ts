/**
 * The spam guard: one check a submission passes before the contact endpoint
 * delivers it, behind one contract, so the endpoint names its guard and
 * holds no check of its own. `turnstileGuard` is Cloudflare Turnstile's.
 *
 * A check answers one of three ways. `passed`: a person, by the check's
 * lights. `failed`: the check answered no, and the endpoint refuses the
 * submission. `unanswered`: the check could not answer (no token, no
 * secret, no answer in time, its own fault), and the endpoint lets the
 * submission through and reports it, because a lead lost to a check that
 * could not answer costs more than a stray piece of spam.
 *
 * A missing token is unanswered and `quiet`: the endpoint does not report
 * a token key that arrived empty, since a real visitor whose browser could
 * not run the check was already reported by the form, and a bot that sends
 * it empty would otherwise file one report for every submission. A body
 * with no token key at all is reported on production alone, since the form
 * may be running no check. Either way the submission is delivered
 * unchecked, with no receipt.
 *
 * Built with the gate (`@atelic-action/ui/forms/guard`): plain TypeScript,
 * no React, relative imports carrying `.js`.
 */
import { within } from "../lib/within.js";

/** What a guard made of one submission. */
export type GuardVerdict =
	| { status: "passed" }
	/** The check answered no: the submission is refused. */
	| { status: "failed"; cause: Error }
	/**
	 * The check could not answer: the submission is let through and the
	 * cause reported. `unset` marks a cause that is a missing setting (the
	 * secret), which is reported on the production deploy alone, as the
	 * endpoint's other unset settings are. `quiet` marks a missing token,
	 * which the endpoint reports only when the body carried no token key at
	 * all (and then on production alone); an empty token the form reported
	 * itself, from the browser.
	 */
	| { status: "unanswered"; cause: Error; unset?: boolean; quiet?: boolean };

/** What a guard's `check` is handed beside the token. */
export interface GuardContext {
	/**
	 * An id of this request alone, fresh on every POST (9.7.0). It is no
	 * longer the submission's id, which the browser now makes and keeps
	 * across a resubmit, so a fresh token on a resubmit is never checked
	 * under a key an earlier token was checked under.
	 */
	id: string;
	/** The request being handled; a guard may read the visitor's address from its headers. */
	request: Request;
	/**
	 * Aborted when the endpoint stops waiting on the check, so a guard hands
	 * it on to its own calls and stops with the endpoint. A guard's own limit
	 * may be shorter and still applies.
	 */
	signal: AbortSignal;
}

export interface Guard {
	/** What a report calls it: "turnstile". Never a client's name. */
	name: string;
	/** The body key the form sends the token under: "turnstile". */
	tokenKey: string;
	/**
	 * How long the guard says its one try may take, in milliseconds. The
	 * endpoint cuts the check off at this and half a second more, and never
	 * later than 3500 ms whatever a guard names (3500 when it names none), and
	 * takes the cutoff as `unanswered`: a check gets at most 3.5 seconds, so
	 * the endpoint's worst case holds for any guard.
	 */
	timeoutMs?: number;
	/**
	 * Checks the token the form sent, empty when it sent none. Must never
	 * throw; the endpoint takes a throw as `unanswered` all the same. A
	 * cause carries no token and no secret.
	 */
	check(token: string, context: GuardContext): Promise<GuardVerdict>;
}

export interface TurnstileOptions {
	/** The widget's secret key. Defaults to `TURNSTILE_SECRET_KEY`, read at each check. */
	secret?: string;
	/** How long the one try may take, in milliseconds. Defaults to 3000. */
	timeoutMs?: number;
}

/** Where Turnstile tokens are checked. */
export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The body key `ContactForm` sends a Turnstile token under. */
export const TURNSTILE_TOKEN_KEY = "turnstile";

export const DEFAULT_GUARD_TIMEOUT_MS = 3_000;

/** Cloudflare's Turnstile Privacy Addendum, which the notice below references. */
export const TURNSTILE_PRIVACY_ADDENDUM_URL =
	"https://www.cloudflare.com/turnstile-privacy-policy/";

/**
 * The one sentence every site's privacy policy carries once its contact
 * form runs the guard. Cloudflare allows the invisible widget only on a site
 * whose privacy policy references its Turnstile Privacy Addendum, so each
 * site's policy imports this as a paragraph of its legal document, and a
 * change here reaches every policy on its next update of this package. The
 * address is written out because a legal document's blocks are plain text.
 */
export const TURNSTILE_PRIVACY_NOTICE = `Our contact form uses Cloudflare Turnstile to tell people from automated spam. Turnstile processes signals about your device and browser, such as your IP address, and Cloudflare's Turnstile Privacy Addendum describes how Cloudflare handles them: ${TURNSTILE_PRIVACY_ADDENDUM_URL}`;

/**
 * The error codes that mean Cloudflare looked at the token and said no: a
 * token that is not one, or one already spent or expired. Every other code
 * (a wrong or missing secret, a request it could not read, which is the
 * endpoint's own fault, its own fault, a missing token it says it never
 * got) is Cloudflare unable to answer for this visitor, and lets the
 * submission through.
 */
export const REFUSING_CODES = ["invalid-input-response", "timeout-or-duplicate"];

function unanswered(message: string, cause?: unknown): GuardVerdict {
	return {
		status: "unanswered",
		cause: cause === undefined ? new Error(message) : new Error(message, { cause }),
	};
}

/** The visitor's address as the platform saw it: the first entry of `x-forwarded-for`. */
function visitorIP(request: Request): string | undefined {
	const forwarded = request.headers?.get?.("x-forwarded-for");
	const first = forwarded?.split(",")[0]?.trim();
	return first || undefined;
}

/** The error codes of an answer, each one kept only when it is shaped like a code. */
function codesOf(body: Record<string, unknown>): string[] {
	const codes = body["error-codes"];
	return Array.isArray(codes)
		? codes.filter((code): code is string => typeof code === "string" && /^[a-z-]+$/.test(code))
		: [];
}

/** What one answer from siteverify means. */
async function verdictOf(response: Response): Promise<GuardVerdict> {
	if (!response.ok) return unanswered(`Turnstile answered ${response.status}`);
	let body: unknown;
	try {
		body = await response.json();
	} catch (error) {
		return unanswered("Turnstile's answer was not JSON", error);
	}
	if (!body || typeof body !== "object") return unanswered("Turnstile's answer was not JSON");
	const answer = body as Record<string, unknown>;
	if (answer.success === true) return { status: "passed" };
	const codes = codesOf(answer);
	const said = codes.length > 0 ? codes.join(", ") : "no error code";
	// Refused only when every code is one that means no; a code that means
	// Cloudflare could not answer, beside one or alone, lets it through.
	if (codes.length > 0 && codes.every((code) => REFUSING_CODES.includes(code))) {
		return { status: "failed", cause: new Error(`Turnstile refused the token: ${said}`) };
	}
	return unanswered(`Turnstile could not answer: ${said}`);
}

/**
 * The guard over Cloudflare Turnstile: one POST to siteverify carrying the
 * secret, the token, the visitor's address when the platform gave one, and
 * the request's id as the idempotency key. One try, cut off at
 * `timeoutMs`. An empty token is unanswered without a call, since a form
 * that could not load the challenge sends none and its visitor is still a
 * lead.
 */
export function turnstileGuard(options: TurnstileOptions = {}): Guard {
	const timeoutMs = options.timeoutMs ?? DEFAULT_GUARD_TIMEOUT_MS;
	return {
		name: "turnstile",
		tokenKey: TURNSTILE_TOKEN_KEY,
		timeoutMs,
		async check(token, { id, request, signal: endpoint }) {
			// The secret is looked for first, so a site whose guard is not set
			// up yet reads as one missing setting, whatever its form sent.
			const secret = options.secret ?? process.env.TURNSTILE_SECRET_KEY;
			if (!secret) {
				return {
					status: "unanswered",
					cause: new Error("Turnstile not configured: TURNSTILE_SECRET_KEY unset"),
					unset: true,
				};
			}
			if (!token) {
				return { status: "unanswered", cause: new Error("the form sent no token"), quiet: true };
			}
			const remoteip = visitorIP(request);
			return within(
				timeoutMs,
				async (own): Promise<GuardVerdict> => {
					// Stopped at its own limit or the endpoint's, whichever is first.
					const signal = endpoint ? AbortSignal.any([own, endpoint]) : own;
					let response: Response;
					try {
						response = await fetch(SITEVERIFY_URL, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								secret,
								response: token,
								...(remoteip && { remoteip }),
								idempotency_key: id,
							}),
							signal,
						});
					} catch (error) {
						return unanswered("Turnstile could not be reached", error);
					}
					return verdictOf(response);
				},
				() => unanswered(`Turnstile sent no answer within ${timeoutMs} ms`),
			);
		},
	};
}
