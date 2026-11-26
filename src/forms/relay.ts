/**
 * The form relay: hands one submission to a list of destinations and says
 * what each made of it. A destination is anything that can take a
 * submission (the office's inbox, a CRM), behind one contract, so a form's
 * endpoint names its destinations and holds no delivery logic of its own.
 *
 * Everything happens inside the one request. Every destination is tried at
 * once and none waits on another. A try that is not answered within the
 * destination's limit is given up and counts as the destination being down.
 * A destination that is down is tried once more after a short wait; one that
 * refuses the submission is never tried again. A destination that fails is
 * reported, after the caller's answer has gone, by the package's error
 * reporter, except when no destination took the submission: then the
 * caller is about to answer the visitor a failure they are already waiting
 * for, so the reports are sent before `relay` resolves. Nothing is stored,
 * and no delivery is tried after `relay` resolves.
 *
 * Built with the gate (`@atelic-action/ui/forms/relay`): plain TypeScript, no
 * React, relative imports carrying `.js`.
 */
import {
	reportServerError,
	reportServerErrorLater,
	scrub,
	type WaitUntilContext,
} from "../monitoring/server.js";

/** What a form sent, as every destination receives it. */
export interface Submission<Fields = Record<string, unknown>> {
	/**
	 * One id for this submission, the same on both tries. A destination hands
	 * it to its service as the key that makes a second send safe.
	 */
	id: string;
	/** The fields by key, already read and checked by the endpoint. */
	fields: Fields;
	/**
	 * Whether a spam check vouched for the submission: true when the
	 * endpoint's guard passed it, false when the endpoint has a guard and it
	 * could not answer (the submission is let through rather than lost), and
	 * left out when the endpoint has no guard or the submission is a canary.
	 * A destination may read it to decide what to do with a submission no
	 * check vouched for (a CRM may hold such a lead on a line of its own).
	 */
	checked?: boolean;
}

/** The destination took the submission. */
export interface Delivered {
	status: "delivered";
	/** The destination's own id for what it made (a message id, a lead id). */
	reference?: string;
	/**
	 * Something the practice should hear about though the submission was
	 * taken. The relay reports it, so a doubt is never silent.
	 */
	warning?: Error;
}

/** The destination already had this submission, from an earlier try. */
export interface Duplicate {
	status: "duplicate";
	reference?: string;
	/**
	 * Why the duplicate is not certain (a first try the destination says is
	 * still landing, which nothing here can confirm). The relay reports it.
	 */
	warning?: Error;
}

/**
 * The destination did not take the submission. `down` is a destination that
 * could not answer (no connection, no answer in time, its own server error),
 * which is worth one more try. `refused` is a destination that answered no,
 * which the same submission would be answered again.
 */
export interface Failed {
	status: "failed";
	reason: "down" | "refused";
	/**
	 * What went wrong, as a report may carry it: never the submission's
	 * words and never an address.
	 */
	cause: Error;
}

export type DestinationResult = Delivered | Duplicate | Failed;

/** What a destination's `send` is handed beside the submission. */
export interface SendContext {
	/** Aborted when the try's limit, or the relay's deadline, passes. */
	signal: AbortSignal;
	/** 1 for the first try, 2 for the second. */
	attempt: 1 | 2;
}

export interface Destination<Fields = Record<string, unknown>> {
	/** The name a report calls it by: "email", "crm". Never a client's name. */
	name: string;
	/** How long one try may take, in milliseconds. Defaults to 3000. */
	timeoutMs?: number;
	/**
	 * Hands the submission over and says what happened. It must be safe to
	 * call twice with the same submission. A throw counts as `down`.
	 */
	send(submission: Submission<Fields>, context: SendContext): Promise<DestinationResult>;
}

export interface RelayOptions {
	/** The wait before a down destination's second try, in milliseconds. Defaults to 1000. */
	retryWaitMs?: number;
	/**
	 * The longest the whole relay may run, in milliseconds, whatever the
	 * destinations' own limits add up to. A destination still unanswered then
	 * is cut off and counts as down. Defaults to 8000.
	 */
	deadlineMs?: number;
	/** The request being handled, for the reports; only its method, path, and user agent are read. */
	request?: Request;
	/** Tags for the reports beside the destination's name, e.g. `{ route: "contact" }`. */
	tags?: Record<string, string>;
	/** A handler's context, when it has one, to keep a report running after the answer. */
	context?: WaitUntilContext;
}

/** What one destination made of the submission. */
export interface Leg {
	/** The destination's name. */
	destination: string;
	result: DestinationResult;
	/** How many tries were made. */
	attempts: 1 | 2;
}

export interface RelayResult {
	/** Whether any destination took the submission (delivered or duplicate). */
	taken: boolean;
	/** One per destination, in the order they were given. */
	legs: Leg[];
}

export const DEFAULT_TIMEOUT_MS = 3_000;
export const DEFAULT_RETRY_WAIT_MS = 1_000;
export const DEFAULT_DEADLINE_MS = 8_000;

/** A failure of the kind worth one more try. */
export function down(cause: unknown): Failed {
	return { status: "failed", reason: "down", cause: asError(cause) };
}

/** A failure the same submission would meet again. */
export function refused(cause: unknown): Failed {
	return { status: "failed", reason: "refused", cause: asError(cause) };
}

function asError(cause: unknown): Error {
	return cause instanceof Error ? cause : new Error(String(cause));
}

/** Whether a destination took the submission. */
export function isTaken(result: DestinationResult): boolean {
	return result.status !== "failed";
}

/**
 * One try, ended by whichever comes first: the destination's answer, its
 * own limit, or the relay's deadline. The limit and the deadline abort the
 * signal the destination was handed and answer for it, so a destination
 * that ignores its signal still cannot hold the relay.
 */
async function attemptOnce<Fields>(
	destination: Destination<Fields>,
	submission: Submission<Fields>,
	attempt: 1 | 2,
	deadline: AbortSignal,
	deadlineMs: number,
): Promise<DestinationResult> {
	const limit = destination.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	if (deadline.aborted) return down(deadlineError(deadlineMs));
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let onDeadline: (() => void) | undefined;
	const cutOff = new Promise<DestinationResult>((resolve) => {
		timer = setTimeout(() => {
			controller.abort();
			resolve(down(new Error(`${destination.name} sent no answer within ${limit} ms`)));
		}, limit);
		onDeadline = () => {
			controller.abort();
			resolve(down(deadlineError(deadlineMs)));
		};
		deadline.addEventListener("abort", onDeadline, { once: true });
	});
	// Started inside a promise so a `send` that throws before it awaits is
	// caught like one that rejects.
	const answered = Promise.resolve()
		.then(() => destination.send(submission, { signal: controller.signal, attempt }))
		.catch((error: unknown) => down(error));
	try {
		return await Promise.race([answered, cutOff]);
	} finally {
		clearTimeout(timer);
		if (onDeadline) deadline.removeEventListener("abort", onDeadline);
	}
}

function deadlineError(deadlineMs: number): Error {
	return new Error(`the relay's deadline of ${deadlineMs} ms passed`);
}

/** Waits, unless the deadline passes first. Resolves false when it did. */
function waitWithin(ms: number, deadline: AbortSignal): Promise<boolean> {
	if (deadline.aborted) return Promise.resolve(false);
	return new Promise((resolve) => {
		const onDeadline = () => {
			clearTimeout(timer);
			resolve(false);
		};
		const timer = setTimeout(() => {
			deadline.removeEventListener("abort", onDeadline);
			resolve(true);
		}, ms);
		deadline.addEventListener("abort", onDeadline, { once: true });
	});
}

async function runLeg<Fields>(
	destination: Destination<Fields>,
	submission: Submission<Fields>,
	retryWaitMs: number,
	deadline: AbortSignal,
	deadlineMs: number,
): Promise<Leg> {
	const first = await attemptOnce(destination, submission, 1, deadline, deadlineMs);
	if (first.status !== "failed" || first.reason === "refused") {
		return { destination: destination.name, result: first, attempts: 1 };
	}
	// Down: one more try after the wait, unless the deadline leaves no room.
	if (!(await waitWithin(retryWaitMs, deadline))) {
		return { destination: destination.name, result: first, attempts: 1 };
	}
	const second = await attemptOnce(destination, submission, 2, deadline, deadlineMs);
	return { destination: destination.name, result: second, attempts: 2 };
}

/** The error a failed leg is reported as: the destination, what happened, and why. */
export function legError(leg: Leg): Error | undefined {
	if (leg.result.status !== "failed") return undefined;
	const { reason, cause } = leg.result;
	const what =
		reason === "refused"
			? "refused the submission"
			: `was down on ${leg.attempts === 2 ? "both tries" : "its one try"}, and the submission was dropped for it`;
	// The words of the cause pass through the scrub here, since the reporter
	// scrubs a chained cause and never the error it is handed.
	return new Error(`Form relay: ${leg.destination} ${what}: ${scrub(cause.message)}`, { cause });
}

/**
 * Hands the submission to every destination at once and resolves when each
 * has answered, been given up, or been cut off by the deadline. Never
 * throws. Every failed leg, and every leg taken with a warning, is reported,
 * tagged with the destination's name and the reason: after the caller's
 * answer when a destination took the submission, and before `relay`
 * resolves when none did. That answer is a failure the visitor is already
 * waiting on, and a report left to run after it may be cut short when the
 * runtime freezes, so the one report that matters most is never lost. It
 * adds at most the reporter's 2 seconds (the reports go at once), which the
 * endpoints' worst case already holds, since a failure sends no receipt.
 */
export async function relay<Fields>(
	submission: Submission<Fields>,
	destinations: Destination<Fields>[],
	options: RelayOptions = {},
): Promise<RelayResult> {
	const retryWaitMs = options.retryWaitMs ?? DEFAULT_RETRY_WAIT_MS;
	const deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS;
	const deadline = new AbortController();
	const deadlineTimer = setTimeout(() => deadline.abort(), deadlineMs);
	let legs: Leg[];
	try {
		legs = await Promise.all(
			destinations.map((destination) =>
				runLeg(destination, submission, retryWaitMs, deadline.signal, deadlineMs),
			),
		);
	} finally {
		clearTimeout(deadlineTimer);
	}
	const taken = legs.some((leg) => isTaken(leg.result));
	const held: Promise<boolean>[] = [];
	for (const leg of legs) {
		const report = (error: Error, reason: string) => {
			const sent = {
				request: options.request,
				tags: { ...options.tags, destination: leg.destination, reason },
			};
			if (taken) reportServerErrorLater(error, { ...sent, context: options.context });
			else held.push(reportServerError(error, sent));
		};
		if (leg.result.status === "failed") {
			const error = legError(leg);
			if (error) report(error, leg.result.reason);
		} else if (leg.result.warning) {
			const { warning } = leg.result;
			report(
				new Error(
					`Form relay: ${leg.destination} took the submission, unconfirmed: ${scrub(warning.message)}`,
					{
						cause: warning,
					},
				),
				"unconfirmed",
			);
		}
	}
	// Nothing was taken: the caller answers a failure next, so its reports
	// land first. The reporter never throws.
	await Promise.all(held);
	return { taken, legs };
}
