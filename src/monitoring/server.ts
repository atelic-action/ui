/**
 * Error reporting on the server: a dependency free Sentry reporter for a
 * Vercel function or middleware. Built to dist/ with the gate (CLAUDE.md,
 * the built corner), since Vercel runs a function's package imports as
 * shipped, so this file imports nothing and touches only what a function and
 * the middleware runtime both have (fetch, `AbortController`, `crypto`).
 *
 *   import { reportServerError, reportServerErrorLater, withErrorReporting } from "@atelic-action/ui/monitoring/server";
 *
 * Privacy: a report carries the request's method and path, and its user
 * agent, never its body, its query string, or any other header. A contact
 * form's request holds a person's name, address, and message.
 */

/** The parts of a DSN a report is sent with. */
export interface ParsedDSN {
	/** The public key, sent as `sentry_key`. */
	key: string;
	projectId: string;
	/** Where the envelope is posted. */
	envelopeURL: string;
}

export interface ServerReportOptions {
	/** Defaults to `SENTRY_DSN`, then `VITE_SENTRY_DSN`, from the environment. */
	dsn?: string;
	/** The request being handled; only its method, path, and user agent are read. */
	request?: Request;
	/** Tags beside the runtime's, e.g. `{ route: "contact" }`. */
	tags?: Record<string, string>;
	/** Defaults to `VERCEL_GIT_COMMIT_SHA`. */
	release?: string;
	/** Defaults to `VERCEL_ENV`. */
	environment?: string;
	/** How long the send may take, in milliseconds. Defaults to 2000. */
	timeoutMs?: number;
}

/** One stack frame in Sentry's exception format. */
export interface SentryFrame {
	function?: string;
	filename?: string;
	lineno?: number;
	colno?: number;
	in_app: boolean;
}

const SDK = { name: "atelic.server", version: "1" };

function environmentValue(name: string): string | undefined {
	const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
		?.env;
	const value = env?.[name];
	return value === "" ? undefined : value;
}

/**
 * Reads a DSN (`https://<key>@<host>[/<path>]/<project>`) into the URL its
 * envelopes are posted to. Undefined for anything that is not one.
 */
export function parseDSN(dsn: string | undefined): ParsedDSN | undefined {
	if (!dsn) return undefined;
	let url: URL;
	try {
		url = new URL(dsn);
	} catch {
		return undefined;
	}
	const key = url.username;
	const parts = url.pathname.split("/").filter(Boolean);
	const projectId = parts.pop();
	if (!key || !projectId || !/^\d+$/.test(projectId)) return undefined;
	const prefix = parts.length ? `/${parts.join("/")}` : "";
	const envelopeURL = `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/?sentry_key=${encodeURIComponent(key)}&sentry_version=7`;
	return { key, projectId, envelopeURL };
}

/**
 * The frames of a V8 stack (`at fn (file:line:col)`, `at file:line:col`),
 * oldest call first, as Sentry lists them. A frame inside `node_modules` is
 * not the site's own code.
 */
export function parseStack(stack: string | undefined): SentryFrame[] {
	if (!stack) return [];
	const frames: SentryFrame[] = [];
	for (const line of stack.split("\n")) {
		const match = line.match(/^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/);
		if (!match) continue;
		const [, fn, filename, lineno, colno] = match;
		frames.push({
			...(fn ? { function: fn } : {}),
			filename,
			lineno: Number(lineno),
			colno: Number(colno),
			in_app: !filename.includes("node_modules"),
		});
	}
	return frames.reverse();
}

/** The runtime a report came from: Vercel's edge, Node, or neither. */
function runtime(): string {
	if (typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== "undefined") return "edge";
	const node = (globalThis as { process?: { versions?: { node?: string } } }).process?.versions
		?.node;
	return node ? "node" : "unknown";
}

function eventID(): string {
	const random = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID;
	if (random) return random.call(globalThis.crypto).replaceAll("-", "");
	let id = "";
	for (let i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16);
	return id;
}

/** The thrown value as Sentry's exception: its type, message, and frames. */
function exceptionOf(error: unknown) {
	if (error instanceof Error) {
		const frames = parseStack(error.stack);
		return {
			type: error.name || "Error",
			value: error.message,
			...(frames.length ? { stacktrace: { frames } } : {}),
		};
	}
	let value: string;
	try {
		value = typeof error === "string" ? error : JSON.stringify(error);
	} catch {
		value = String(error);
	}
	return { type: "Error", value: value ?? String(error) };
}

/**
 * The request as a report may carry it: the method, the URL with no query
 * string or fragment, and the user agent. Never the body, never another
 * header.
 */
function requestOf(request: Request | undefined) {
	if (!request) return undefined;
	let url: string | undefined;
	try {
		const parsed = new URL(request.url);
		url = `${parsed.origin}${parsed.pathname}`;
	} catch {
		url = undefined;
	}
	const agent = request.headers?.get?.("user-agent");
	return {
		method: request.method,
		...(url ? { url } : {}),
		...(agent ? { headers: { "User-Agent": agent } } : {}),
	};
}

/**
 * The envelope a report is sent as: the envelope header, the item header,
 * and the event, one JSON document to a line. Exported for the tests.
 */
export function buildEnvelope(
	error: unknown,
	dsn: string,
	options: Omit<ServerReportOptions, "dsn" | "timeoutMs"> = {},
	now: Date = new Date(),
): string {
	const id = eventID();
	const release = options.release ?? environmentValue("VERCEL_GIT_COMMIT_SHA");
	const environment = options.environment ?? environmentValue("VERCEL_ENV");
	const request = requestOf(options.request);
	const event = {
		event_id: id,
		timestamp: now.getTime() / 1000,
		platform: "javascript",
		level: "error",
		sdk: SDK,
		...(release ? { release } : {}),
		...(environment ? { environment } : {}),
		tags: { runtime: runtime(), ...options.tags },
		...(request ? { request } : {}),
		exception: { values: [exceptionOf(error)] },
	};
	const header = { event_id: id, sent_at: now.toISOString(), dsn, sdk: SDK };
	return [JSON.stringify(header), JSON.stringify({ type: "event" }), JSON.stringify(event)].join(
		"\n",
	);
}

/**
 * Reports an error to Sentry from a function or the middleware. Resolves
 * true when Sentry took it and false otherwise (no DSN, a bad DSN, a failed
 * or slow send), and never throws, so a report can never become a second
 * failure. With no DSN it sends nothing.
 */
export async function reportServerError(
	error: unknown,
	options: ServerReportOptions = {},
): Promise<boolean> {
	try {
		const dsn =
			options.dsn ?? environmentValue("SENTRY_DSN") ?? environmentValue("VITE_SENTRY_DSN");
		const parsed = parseDSN(dsn);
		if (!dsn || !parsed) return false;
		const body = buildEnvelope(error, dsn, options);
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 2000);
		try {
			const response = await fetch(parsed.envelopeURL, {
				method: "POST",
				headers: { "Content-Type": "application/x-sentry-envelope" },
				body,
				signal: controller.signal,
			});
			// The answer's body is never read, so it is let go at once rather
			// than held open until the runtime collects it.
			await response.body?.cancel().catch(() => {});
			return response.ok;
		} finally {
			clearTimeout(timer);
		}
	} catch {
		return false;
	}
}

/**
 * What a handler's context offers to keep work running after the answer has
 * gone: the second argument of an edge middleware or a Vercel function
 * (`context.waitUntil`), or any object holding a `waitUntil` like it.
 */
export interface WaitUntilContext {
	waitUntil(promise: Promise<unknown>): void;
}

/**
 * The platform's own `waitUntil`, read the way `@vercel/functions` reads it,
 * from the request context Vercel keeps on a global symbol, so this file
 * needs no dependency for it. Undefined anywhere else.
 */
function platformWaitUntil(): ((promise: Promise<unknown>) => void) | undefined {
	try {
		const store = (globalThis as Record<symbol, unknown>)[Symbol.for("@vercel/request-context")] as
			| { get?: () => { waitUntil?: (promise: Promise<unknown>) => void } | undefined }
			| undefined;
		const context = store?.get?.();
		const waitUntil = context?.waitUntil;
		return typeof waitUntil === "function" ? waitUntil.bind(context) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Reports an error without making the caller wait for it. The send starts
 * at once and is handed to the platform's `waitUntil` (the `context` given,
 * else Vercel's request context), which keeps the function alive until it
 * finishes after the answer has gone. With neither, the send still runs,
 * never blocking the answer, and may be cut short if the runtime freezes
 * once the answer is out. Never throws, and returns nothing to wait on.
 *
 * Use `reportServerError`, awaited, where the report must land before the
 * handler goes on (before a throw, in a handler that already waits); use
 * this one where the answer should leave at once (a refusal the person is
 * waiting to read).
 */
export function reportServerErrorLater(
	error: unknown,
	options: ServerReportOptions & { context?: WaitUntilContext } = {},
): void {
	const { context, ...report } = options;
	const sending = reportServerError(error, report);
	// The context's own waitUntil first, then the platform's; a context with
	// none that can be called, or one that throws, falls through to the
	// next, and with neither the send runs on its own, never blocking.
	const own = (context as { waitUntil?: unknown } | undefined)?.waitUntil;
	const fromContext =
		typeof own === "function"
			? (promise: Promise<unknown>) => own.call(context, promise)
			: undefined;
	for (const find of [() => fromContext, platformWaitUntil]) {
		try {
			const hold = find();
			if (!hold) continue;
			hold(sending);
			return;
		} catch {
			// This one could not hold the send; the next is tried.
		}
	}
}

/**
 * Anything shaped like an email address, which a refusal may quote (the
 * recipient, the sender). The domain is labels of letters in any script,
 * digits, hyphens, and underscores joined by dots, so an internationalized
 * domain is caught and a sentence's closing period stays outside it.
 */
const ADDRESS = /[^\s@<>()[\]"',;:]+@[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+/gu;

/** A separator inside a phone number: a space, a dot, a slash, or any hyphen or dash. */
const SEP = "[\\s./\\u2010-\\u2015\\u2212-]";

/**
 * A run shaped like a phone number: an optional country code, then an area
 * code in parentheses and the number after it, or at least three groups of
 * digits joined by separators, the last of three or four digits, or a plus
 * sign and seven to fifteen digits run together (E.164). A date
 * (2026-11-23), a bare id (12345678), and a count beside a year (120 2026)
 * are none of these, and stay.
 */
const PHONE = new RegExp(
	`(?<![\\w+-])\\+\\d{7,15}(?![\\w-])|(?<![\\w+-])(?:\\+\\d{1,3}${SEP}?)?(?:\\(\\d{2,4}\\)${SEP}?\\d{2,4}(?:${SEP}\\d{3,4})?|\\d{2,4}(?:${SEP}\\d{2,4}){1,2}${SEP}\\d{3,4})(?![\\w-])`,
	"gu",
);

/** A refusal's field with every address and phone number in it replaced. */
function scrub(text: string): string {
	return text.replace(ADDRESS, "[address]").replace(PHONE, "[number]");
}

/** The longest a refusal's field is kept, so a report never carries a page of text. */
const REFUSAL_FIELD_MAX = 300;

/**
 * A refused upstream answer as an error a report may carry: the service's
 * name, the status, and the error body's `name` and `message` fields alone,
 * each with anything shaped like an email address replaced by `[address]`
 * and anything shaped like a phone number (grouped as one is written) by
 * `[number]`, then cut to 300
 * characters. Nothing else of the body is read, and a body that is not JSON
 * leaves the status alone. Never throws.
 *
 * The scrub takes out the shapes it knows and nothing more: the fields are
 * still the upstream's free text, and a name, a street, or a message quoted
 * in it in words passes through. Report a refusal from a service whose
 * errors are about the request, never one that echoes what a person wrote.
 *
 *   await refusalError(response, "Resend")  // Error("Resend answered 422: validation_error: ...")
 */
export async function refusalError(
	response: Response,
	service = "The upstream service",
): Promise<Error> {
	let body: { name?: unknown; message?: unknown } = {};
	try {
		const parsed: unknown = await response.json();
		if (parsed && typeof parsed === "object") body = parsed as typeof body;
	} catch {
		// Not JSON, or already read: the status says what there is to say.
	}
	const parts = [body.name, body.message]
		.filter((part): part is string => typeof part === "string" && part.trim() !== "")
		.map((part) => scrub(part).slice(0, REFUSAL_FIELD_MAX));
	return new Error(
		`${service} answered ${response.status}${parts.length ? `: ${parts.join(": ")}` : ""}`,
	);
}

/**
 * Reports a refused upstream answer (a send the mail service would not
 * take) without holding the caller's own answer: the error is built by
 * `refusalError`, so no address in the refusal survives, and sent by
 * `reportServerErrorLater`. Resolves once the refusal's body is read, never
 * waiting on the send, and never throws.
 *
 *   if (!response.ok) {
 *     await reportRefusedResponse(response, { service: "Resend", request, tags: { route: "contact" } });
 *     return json(502, { ok: false, error: "Sending failed. Please try again in a moment." });
 *   }
 */
export async function reportRefusedResponse(
	response: Response,
	options: ServerReportOptions & { service?: string; context?: WaitUntilContext } = {},
): Promise<void> {
	const { service, ...report } = options;
	try {
		reportServerErrorLater(await refusalError(response, service), report);
	} catch {
		// A report never becomes a second failure.
	}
}

/**
 * Wraps a function's handler so a throw is reported, then thrown again: the
 * platform still answers the request as it would have, and Sentry hears of
 * it first. `export const POST = withErrorReporting(async (request) => ...)`.
 */
export function withErrorReporting<Args extends [Request, ...unknown[]], Result>(
	handler: (...args: Args) => Result | Promise<Result>,
	options: Omit<ServerReportOptions, "request"> = {},
): (...args: Args) => Promise<Result> {
	return async (...args: Args) => {
		try {
			return await handler(...args);
		} catch (error) {
			await reportServerError(error, { ...options, request: args[0] });
			throw error;
		}
	};
}
