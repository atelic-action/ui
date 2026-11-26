/**
 * Email through Resend, as a destination of the form relay. The caller says
 * who it is from, who it goes to, and how a submission reads as an email;
 * this file holds the call and what each of Resend's answers means.
 *
 * Built with the gate (`@atelic-action/ui/forms/resend`).
 */
import { refusalError } from "../monitoring/server.js";
import {
	type Destination,
	type DestinationResult,
	down,
	refused,
	type Submission,
} from "./relay.js";

/** A submission as an email. */
export interface Email {
	subject: string;
	html: string;
	text: string;
	/** Where a reply goes: the visitor's address. Left out, a reply goes to the sender. */
	replyTo?: string;
}

export interface ResendOptions<Fields = Record<string, unknown>> {
	/** A sending only Resend API key. */
	apiKey: string;
	/** The sender: `Display Name <address@a-verified-domain>`. */
	from: string;
	/** The inboxes the email goes to. */
	to: string[];
	/** How a submission reads as an email. */
	compose(submission: Submission<Fields>): Email;
	/** The name a report calls this destination by. Defaults to "email". */
	name?: string;
	/** How long one try may take, in milliseconds. Defaults to the relay's 3000. */
	timeoutMs?: number;
	/**
	 * What the idempotency key is prefixed with, so the same id sent by two
	 * sites can never meet under one Resend account. The endpoints pass the
	 * site's host (`keyNamespace`). Left out, the key is the id alone.
	 */
	keyNamespace?: string;
}

const ENDPOINT = "https://api.resend.com/emails";

/** The error name Resend answers a key whose first send is still in flight. */
const STILL_SENDING = "concurrent_idempotent_requests";

/**
 * What Resend's answer means for the relay.
 *
 * - 2xx: delivered, with Resend's message id as the reference. A second try
 *   carrying the same key is answered the first try's response and sends
 *   nothing more, so it reads as delivered too.
 * - 409 naming a send still in flight: the first try is landing, so the
 *   second counts as a duplicate, never a second email, with a warning the
 *   relay reports, since the first try's outcome is never seen.
 * - 429 and 5xx: Resend is down or shedding load, worth the second try.
 * - Anything else: Resend refused the email, and would again.
 */
async function read(response: Response): Promise<DestinationResult> {
	if (response.ok) {
		const body = (await response.json().catch(() => ({}))) as { id?: unknown };
		return { status: "delivered", reference: typeof body.id === "string" ? body.id : undefined };
	}
	if (response.status === 409) {
		// The body is read once, as text, so nothing of the answer is left
		// unread: the refusal below is built from the same words.
		const words = await response.text().catch(() => "");
		let name: unknown;
		try {
			name = (JSON.parse(words) as { name?: unknown } | null)?.name;
		} catch {
			name = undefined;
		}
		if (name === STILL_SENDING) {
			return {
				status: "duplicate",
				// The first try was given up here while Resend was still working
				// on it. It usually lands, but nothing confirms it, so the
				// practice is told.
				warning: new Error(
					"Resend says the first try is still sending, and its outcome was not seen",
				),
			};
		}
		return refused(await refusalError(new Response(words, { status: 409 }), "Resend"));
	}
	const cause = await refusalError(response, "Resend");
	return response.status === 429 || response.status >= 500 ? down(cause) : refused(cause);
}

/**
 * The destination. Each try is one POST carrying the submission's id as
 * Resend's idempotency key, which Resend remembers for a day, so the second
 * try of a submission whose first try landed late sends nothing. The id is
 * the browser's when the form sent a well formed one (`submissionIDOf`), so
 * a visitor's resubmit of the same words after a timeout sends nothing more
 * either; the key carries the site's namespace in front of it.
 */
export function resendDestination<Fields = Record<string, unknown>>(
	options: ResendOptions<Fields>,
): Destination<Fields> {
	return {
		name: options.name ?? "email",
		timeoutMs: options.timeoutMs,
		async send(submission, { signal }) {
			const email = options.compose(submission);
			let response: Response;
			try {
				response = await fetch(ENDPOINT, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${options.apiKey}`,
						"Content-Type": "application/json",
						"Idempotency-Key": options.keyNamespace
							? `${options.keyNamespace}/${submission.id}`
							: submission.id,
					},
					body: JSON.stringify({
						from: options.from,
						to: options.to,
						...(email.replyTo && { reply_to: [email.replyTo] }),
						subject: email.subject,
						html: email.html,
						text: email.text,
					}),
					// The signal also ends the read of the answer's body, so a
					// refusal whose body stalls is cut off with the try.
					signal,
				});
			} catch (error) {
				return down(error);
			}
			try {
				return await read(response);
			} catch (error) {
				return down(error);
			}
		},
	};
}
