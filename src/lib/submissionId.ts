/**
 * The id of one inquiry, made in the visitor's browser (9.7.0, ATE-847).
 *
 * The browser makes the key because only it knows a resubmit is the same
 * inquiry. A visitor whose send timed out presses the button again; the
 * server sees two POSTs it cannot tell apart from two people, so an id it
 * minted per POST let the second one through as a second email. The form
 * makes one id per fill instead, keeps it while the words it sends stay the
 * same, and sends it under `submissionId`, so a resubmit reaches Resend under
 * the key the first try used and sends nothing more. A changed field is a
 * new inquiry and gets a new id (Resend refuses a key it has seen with other
 * words), and so does the next fill after a send went through.
 *
 * The endpoint trusts the id only as far as its shape: a well formed UUID is
 * used, anything else (missing, forged, malformed) is replaced by one the
 * server makes, which is what every POST got before.
 *
 * Plain TypeScript with no browser access at module scope, imported by the
 * built endpoints and by the form components alike.
 */

/** The body key the form sends the id under, which no field may use. */
export const SUBMISSION_ID_KEY = "submissionId";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Whether a value is a well formed UUID, the only id the endpoint accepts. */
export function isSubmissionID(value: unknown): value is string {
	return typeof value === "string" && UUID.test(value);
}

/**
 * The endpoint's side: the browser's id when it is a well formed UUID,
 * lowercased so one id is one key, and otherwise a fresh one.
 */
export function submissionIDOf(value: unknown): string {
	return isSubmissionID(value) ? value.toLowerCase() : crypto.randomUUID();
}

/**
 * The form's side: a fresh id, or none where the browser cannot make one
 * (a page served over plain http), in which case the endpoint makes its own.
 */
export function newSubmissionID(): string | undefined {
	try {
		return globalThis.crypto?.randomUUID?.();
	} catch {
		return undefined;
	}
}

/** The id a form is holding, and the words it was made for. */
export interface HeldSubmission {
	content: string;
	id: string | undefined;
}

/**
 * The id for a send of `content` (the body the form is about to post, with
 * no spam check token in it): the held one when the words are the same as
 * the last send's, else a new one, which is then held. A form drops what it
 * holds once a send goes through, so the next fill starts fresh.
 */
export function submissionIDFor(held: { current: HeldSubmission | null }, content: string) {
	if (held.current?.content !== content) {
		held.current = { content, id: newSubmissionID() };
	}
	return held.current.id;
}
