/**
 * The pieces a form's endpoint is made of that hold no form's fields: the
 * JSON answer, the production test, the canary's secret compare, an
 * address list read from a variable, the guard asked within its bound, what
 * the endpoint reports of the guard's verdict, and the one try of a copy
 * back to the visitor. The contact endpoint and the schedule request
 * endpoint both take them from here (9.5.0), so the two never answer, time,
 * or report a guard differently.
 *
 * Built with the gate, beside the endpoints that use it. It is not an entry
 * of its own.
 */
import { within } from "../lib/within.js";
import { reportServerErrorLater, scrub } from "../monitoring/server.js";
import type { Guard, GuardVerdict } from "./guard.js";
import { type DestinationResult, down, type RelayResult } from "./relay.js";
import type { Email } from "./resend.js";
import { resendDestination } from "./resend.js";

export function json(status: number, body: Record<string, unknown>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * An unset variable is a fault on the production deploy alone. A preview
 * built before its keys are set answers every submission 500 by design, and
 * reporting each one would bury the reports that matter.
 */
export function isProduction(): boolean {
	return process.env.VERCEL_ENV === "production";
}

/**
 * Whether two secrets are the same, in time that does not depend on where
 * they first differ, so the canary's token cannot be felt out by timing.
 */
export function sameSecret(given: string, secret: string): boolean {
	const encoder = new TextEncoder();
	const a = encoder.encode(given);
	const b = encoder.encode(secret);
	let difference = a.length ^ b.length;
	for (let index = 0; index < b.length; index++) {
		difference |= (a[index % Math.max(a.length, 1)] ?? 0) ^ (b[index] ?? 0);
	}
	return difference === 0;
}

/** A variable's addresses: one, or several split by commas; none when unset. */
export function addresses(value: string | undefined): string[] {
	return (value ?? "")
		.split(",")
		.map((address) => address.trim())
		.filter(Boolean);
}

/**
 * The namespace a site's Resend keys are written under: the host the form
 * posted to. Every site of the practice may share one Resend account, and a
 * key is the browser's id (`submissionIDOf`), so the host in front keeps one
 * site's id from ever meeting another's. A request whose URL cannot be read
 * falls back to "site", which still keeps the id whole.
 */
export function keyNamespace(request: Request): string {
	try {
		return new URL(request.url).host || "site";
	} catch {
		return "site";
	}
}

/**
 * Whether the browser should make a new id for its next try: only when every
 * destination answered a definite no (a refusal, such as Resend's 4xx), so
 * nothing of this try can land later. A destination that was down (a
 * timeout, a 5xx, a 429, a connection that failed) may still have taken the
 * submission, so its id is kept and a retry dedupes against it. A refusal
 * under the kept id would be refused again (a 409 for a key Resend saw with
 * other words), which a new id ends.
 */
export function shouldRenewID(result: RelayResult): boolean {
	return (
		result.legs.length > 0 &&
		result.legs.every((leg) => leg.result.status === "failed" && leg.result.reason === "refused")
	);
}

/**
 * The part of the office email's key that names the guard's verdict:
 * `checked` when it passed, `unchecked` when it could not answer (the email
 * then carries the unchecked line), and none with no guard. The words of the
 * email differ between the two, and Resend refuses a key it has seen with
 * other words, so a resubmit whose verdict flipped is sent under its own key.
 */
export function verdictKey(checked: boolean | undefined): string | undefined {
	if (checked === undefined) return undefined;
	return checked ? "checked" : "unchecked";
}

/**
 * The longest the endpoint waits on any guard: the time a guard that names
 * none is held to, and the ceiling on one that names more.
 */
export const DEFAULT_GUARD_BOUND_MS = 3_500;

/** What the endpoint allows beyond the time a guard says it takes. */
const GUARD_GRACE_MS = 500;

/**
 * The guard's verdict, held to what the guard says its one try takes and
 * half a second more, never past 3.5 seconds, since a site may pass its own
 * guard: a cutoff, and a throw, are read as a guard that could not answer.
 */
export async function askGuard(
	guard: Guard,
	token: string,
	ids: { id: string; requestID: string },
	request: Request,
): Promise<GuardVerdict> {
	const bound =
		guard.timeoutMs === undefined
			? DEFAULT_GUARD_BOUND_MS
			: Math.min(guard.timeoutMs + GUARD_GRACE_MS, DEFAULT_GUARD_BOUND_MS);
	try {
		return await within<GuardVerdict>(
			bound,
			(signal) => guard.check(token, { ...ids, request, signal }),
			() => ({
				status: "unanswered",
				cause: new Error(`${guard.name} sent no verdict within ${bound} ms`),
			}),
		);
	} catch (error) {
		return { status: "unanswered", cause: new Error(`${guard.name} threw`, { cause: error }) };
	}
}

/**
 * What the endpoint reports of a guard that could not answer. A token key
 * that arrived empty is quiet: the form reported a real visitor whose
 * browser could not run the check, and a bot that sends it empty would
 * otherwise file a report for every submission. No token key at all means
 * the form may be running no check, which production hears about. Any other
 * unanswered verdict is reported, an unset secret on production alone.
 */
export function reportVerdict(
	verdict: GuardVerdict,
	guard: Guard,
	data: Record<string, unknown>,
	request: Request,
	tags: Record<string, string>,
): void {
	if (verdict.status !== "unanswered") return;
	if (verdict.quiet) {
		if (!(guard.tokenKey in data) && isProduction()) {
			reportServerErrorLater(
				new Error(
					"Form guard: the endpoint names a guard and the submission carried no token key, so the form may be running no check",
				),
				{ request, tags: { ...tags, guard: guard.name, reason: "guard-no-token-key" } },
			);
		}
	} else if (!verdict.unset || isProduction()) {
		reportServerErrorLater(
			new Error(
				`Form guard: ${guard.name} could not answer, and the submission was let through: ${scrub(verdict.cause.message)}`,
				{ cause: verdict.cause },
			),
			{ request, tags: { ...tags, guard: guard.name, reason: "guard-unanswered" } },
		);
	}
}

/** The longest one copy back to a visitor may take, whatever a site sets. */
export const DEFAULT_COPY_TIMEOUT_MS = 3_000;

/**
 * One copy back to the visitor (the contact receipt, the schedule request's
 * confirmation): one try through Resend under its own idempotency key, held
 * to `timeoutMs` and never past 3000 ms, so an endpoint's stated worst case
 * holds. A copy that fails is reported under `reason` and answers false;
 * the visitor is still answered 200 by the caller.
 */
export async function sendCopy(options: {
	apiKey: string;
	from: string;
	to: string;
	id: string;
	email: Email;
	timeoutMs?: number;
	/** The site's namespace for the idempotency key (`keyNamespace`). */
	keyNamespace?: string;
	request: Request;
	tags: Record<string, string>;
	reason: string;
	what: string;
}): Promise<boolean> {
	const timeoutMs = Math.min(options.timeoutMs ?? DEFAULT_COPY_TIMEOUT_MS, DEFAULT_COPY_TIMEOUT_MS);
	const copy = resendDestination<null>({
		apiKey: options.apiKey,
		from: options.from,
		to: [options.to],
		name: options.reason,
		timeoutMs,
		keyNamespace: options.keyNamespace,
		compose: () => options.email,
	});
	const answer = await within<DestinationResult>(
		timeoutMs,
		(signal) =>
			copy
				.send({ id: options.id, fields: null }, { signal, attempt: 1 })
				.catch((error: unknown) => down(error)),
		() => down(new Error(`${options.reason} sent no answer within ${timeoutMs} ms`)),
	);
	if (answer.status === "failed") {
		reportServerErrorLater(
			new Error(
				`${options.what}: the copy to the visitor was not sent, though the submission was: ${scrub(answer.cause.message)}`,
				{ cause: answer.cause },
			),
			{ request: options.request, tags: { ...options.tags, reason: options.reason } },
		);
		return false;
	}
	return true;
}
