/**
 * The schedule request form's endpoint, the form relay's second consumer
 * (9.5.0). A site's `api/schedule.ts` names its sender and hands over the
 * same `ScheduleConfig` its page hands `ScheduleRequestForm`:
 *
 *   export const POST = createScheduleRequest({
 *     from: "Alder Roofing <forms@atelic.me>",
 *     config: schedule,
 *     guard: turnstileGuard(),
 *     confirmation: { address: ["100 Main Street", "Fairhaven, CO 80000"] },
 *   });
 *
 * The handler reads the body, drops a honeypot catch behind a quiet success,
 * reads the request and holds it to the business's calendar again (a forged
 * or stale request for a weekend, a holiday, a closed day, a day too soon or
 * too far, or a time off the grid or too late to finish by closing is
 * refused by name, with the step it belongs to), checks it can deliver, asks
 * the guard when the site names one, and hands the submission to the relay:
 * the office's email through Resend, carrying everything the customer
 * entered with the requested day and time leading, then the site's other
 * destinations, all at once. With a confirmation turned on, a request the
 * guard passed and a destination took gets the customer's confirmation, the
 * request email, sent behind the same rule as the contact receipt.
 *
 * The visitor is answered 200 when any destination took the request
 * (`{ ok: true, receipt }`, `receipt` true only when the confirmation went),
 * 400 with a `code` naming the step (`what`, `when`, `who`) when the request
 * is refused, 403 when the guard refused it, 500 when it cannot deliver at
 * all, and 502 when no destination took it, so a request nobody at the
 * business was told about is never answered as sent.
 *
 * Env (set on the Vercel project): RESEND_API_KEY; SCHEDULE_TO, the office's
 * inbox for requests, or several split by commas, falling back to
 * CONTACT_TO and then the practice's inbox; CONTACT_CANARY_TOKEN and
 * CONTACT_CANARY_TO, shared with the contact endpoint; TURNSTILE_SECRET_KEY.
 *
 * Time: the guard 3.5 seconds at most, the relay 8, the confirmation's one
 * try 3, so a visitor waits 14.5 seconds in the worst case, inside the 15 a
 * site states to the platform. A 502 waits on the relay's reports first (2
 * seconds at most, in place of the confirmation it never sends).
 *
 * Built with the gate (`@atelic-action/ui/forms/schedule`).
 */
import { EMAIL_PATTERN, toE164 } from "../lib/contactLinks.js";
import { escapeHTML } from "../lib/escapeHTML.js";
import { isHoneypotFilled } from "../lib/honeypot.js";
import { SUBMISSION_ID_KEY, submissionIDOf } from "../lib/submissionId.js";
import { reportServerErrorLater, withErrorReporting } from "../monitoring/server.js";
import {
	checkDay,
	dayIn,
	isOfferedTime,
	longDayLabel,
	zonedInstant,
	zoneName,
} from "./calendar.js";
import { type Address, DEFAULT_CONTACT_TO, GUARD_REFUSAL, subjectText } from "./contact.js";
import { cell, LOOK, row, rowsTable } from "./emailParts.js";
import {
	addresses,
	askGuard,
	isProduction,
	json,
	keyNamespace,
	reportVerdict,
	sameSecret,
	sendCopy,
} from "./endpoint.js";
import { type Guard, TURNSTILE_TOKEN_KEY } from "./guard.js";
import { displayName, noReplySender } from "./receipt.js";
import { type Destination, relay, type Submission } from "./relay.js";
import { requestEmail, type ScheduleConfirmationOptions } from "./requestEmail.js";
import { type Email, resendDestination } from "./resend.js";
import {
	askedForWords,
	calendarRules,
	DEFAULT_MATERIAL_LABEL,
	findKind,
	findMaterial,
	lengthOf,
	lengthWords,
	modeWords,
	type ScheduleConfig,
	type ScheduleMode,
	scheduleConfigProblems,
	waysFor,
} from "./scheduleConfig.js";
import {
	DEFAULT_SOURCE_OFFICE_LABEL,
	SOURCE_DETAIL_LIMIT,
	sourceDetailFor,
	sourceLabels,
} from "./source.js";

export {
	addBusinessDays,
	addDays,
	type CalendarRules,
	checkDay,
	clockLabel,
	type DayVerdict,
	dayIn,
	federalHolidays,
	firstDay,
	type Holiday,
	holidayOn,
	isWorkingDay,
	lastDay,
	longDayLabel,
	timeSlots,
	zonedInstant,
} from "./calendar.js";
export {
	DEFAULT_REQUEST_EMAIL_LOOK,
	DEFAULT_REQUEST_FOOT,
	type RequestEmailContent,
	type RequestEmailLook,
	type RequestEmailRequest,
	requestEmail,
	requestEmailCard,
	requestEmailContent,
	requestEmailDocument,
	requestEmailLook,
	requestEmailText,
	requestSubject,
	type ScheduleConfirmationOptions,
} from "./requestEmail.js";
export {
	calendarRules,
	DEFAULT_CONFIRM_WITHIN,
	DEFAULT_MATERIAL_LABEL,
	DEFAULT_MODE_WORDS,
	findKind,
	findMaterial,
	lengthOf,
	lengthWords,
	modeFor,
	modeWords,
	oneWayNote,
	SCHEDULE_MODES,
	type ScheduleConfig,
	type ScheduleKind,
	type ScheduleMaterial,
	type ScheduleMode,
	type ScheduleModeWords,
	scheduleConfigProblems,
	waysFor,
} from "./scheduleConfig.js";

/**
 * A schedule request as every destination receives it: what was asked
 * for, when, and who asked, each already read and held to the calendar.
 */
export interface ScheduleFields {
	/** The kind's id, and its words. */
	kind: string;
	kindLabel: string;
	/** The material's id and words, empty when none was chosen. */
	material: string;
	materialLabel: string;
	/** "visit" or "call". */
	mode: ScheduleMode;
	/** The way's words: "A visit at your property". */
	modeLabel: string;
	/** The day asked for, `2026-12-02`, on the business's clock. */
	day: string;
	/** The time asked for, `09:00`, 24 hour, on the business's clock. */
	time: string;
	/** How long the visit or call takes, in minutes. */
	minutes: number;
	/** The business's IANA timezone the day and the time are on. */
	timeZone: string;
	/** The start and end as ISO 8601 instants with the zone's offset for the date. */
	appointmentStart: string;
	appointmentEnd: string;
	firstName: string;
	lastName: string;
	/** The first and last name joined. */
	name: string;
	phone: string;
	email: string;
	/** The address, or null when none was given (a call may leave it out). */
	address: Address | null;
	/** How they heard, one of the site's answers, or empty. */
	source: string;
	/** What they typed for an answer that asks for a detail, or empty. */
	sourceDetail: string;
	/** Anything they want the office to know. */
	note: string;
	/** Whether they ticked the text consent; null when the form draws no such box. */
	textConsent: boolean | null;
}

/** The step a refusal belongs to, so the form can send the visitor back to it. */
export type ScheduleStep = "what" | "when" | "who";

/** A refusal, in the visitor's words, and its step. */
export interface ScheduleRefusal {
	error: string;
	code: ScheduleStep;
}

/**
 * The keys the form sends, beside the endpoint's own (`company`, `canary`,
 * `turnstile`, and `submissionId`, the id the browser made for this fill).
 */
export const SCHEDULE_KEYS = [
	"kind",
	"material",
	"mode",
	"day",
	"time",
	"firstName",
	"lastName",
	"phone",
	"email",
	"address",
	"source",
	"sourceDetail",
	"note",
	"consent",
] as const;

/** Where requests go until a site names its own inbox: the practice's. */
export const DEFAULT_SCHEDULE_TO = DEFAULT_CONTACT_TO;

const LIMITS = {
	name: 100,
	phone: 40,
	email: 320,
	street: 200,
	city: 100,
	state: 40,
	zip: 20,
	note: 5000,
};

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function count(value: string): number {
	return Array.from(value).length;
}

/** "first name", "first name and phone", "first name, last name, and phone". */
function wordList(words: string[]): string {
	if (words.length <= 2) return words.join(" and ");
	return `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]}`;
}

/** The refusal of a day the calendar does not offer, by its reason. */
function dayRefusal(day: string, today: string, config: ScheduleConfig): string | null {
	const verdict = checkDay(day, today, calendarRules(config));
	if (verdict.ok) return null;
	switch (verdict.reason) {
		case "invalid":
			return "Please pick a day from the calendar.";
		case "weekend":
			return "That day is a weekend, and we work Monday to Friday. Please pick another day.";
		case "holiday":
			return `That day is a holiday (${verdict.holiday}). Please pick another day.`;
		case "closed":
			return "Our office is closed that day. Please pick another day.";
		case "tooSoon":
			return `That day is sooner than we can schedule. The first day you can ask for is ${longDayLabel(verdict.bound)}.`;
		case "tooFar":
			return `That day is further out than we schedule. Please pick a day by ${longDayLabel(verdict.bound)}.`;
	}
}

/**
 * Reads a request from a body and holds it to the config and the calendar
 * on `today` (the business's day, `dayIn`). A key the form does not send is
 * never read. `strict` false (a canary) skips the required fields and the
 * calendar and keeps every shape check. `offList` names a source answer not
 * on the list, read as not given.
 */
export function readScheduleRequest(
	body: Record<string, unknown>,
	config: ScheduleConfig,
	today: string,
	strict = true,
): { fields: ScheduleFields; offList: boolean } | { refusal: ScheduleRefusal } {
	const refuse = (code: ScheduleStep, error: string) => ({ refusal: { code, error } });

	// What: the kind, the material under it, and the way.
	const kindId = text(body.kind);
	const kind = findKind(config, kindId);
	if (!kind && (strict || kindId)) {
		return refuse(
			"what",
			kindId
				? "That is not something we schedule here. Please choose again."
				: "Please choose what you need help with.",
		);
	}
	// A material not on the list, or under a kind with none, is read as not given.
	const material = findMaterial(config, kind, text(body.material));
	const ways = waysFor(kind, material);
	const asked = text(body.mode);
	let mode: ScheduleMode | undefined;
	if (ways.length === 1) {
		mode = ways[0];
		if (asked && asked !== mode) {
			return refuse(
				"what",
				`This one is ${modeWords(config, mode as ScheduleMode).short} only. Please choose again.`,
			);
		}
	} else {
		mode = ways.find((way) => way === asked);
		if (!mode && (strict || asked)) {
			return refuse(
				"what",
				asked
					? "That way of meeting is not offered for this. Please choose again."
					: "Please choose a visit or a call.",
			);
		}
	}
	const minutes = kind && mode ? lengthOf(kind, mode) : 0;

	// When: the day and the time, held to the calendar.
	const day = text(body.day);
	const time = text(body.time);
	if (strict) {
		if (!day) return refuse("when", "Please pick a day.");
		const wrongDay = dayRefusal(day, today, config);
		if (wrongDay) return refuse("when", wrongDay);
		if (!time) return refuse("when", "Please pick a time.");
		if (!isOfferedTime(time, calendarRules(config), minutes)) {
			return refuse("when", "That time is not one we offer. Please pick another time.");
		}
	}

	// Who: how to reach them, and where.
	const firstName = text(body.firstName);
	const lastName = text(body.lastName);
	const phone = text(body.phone);
	const email = text(body.email);
	const place = isRecord(body.address) ? body.address : {};
	const street = text(place.street);
	const city = text(place.city);
	const zip = text(place.zip);
	// A state alone is a select's default, not an address anyone wrote.
	const address: Address | null =
		street || city || zip ? { street, city, state: text(place.state), zip } : null;
	const note = text(body.note);
	const over = (
		[
			["First name", firstName, LIMITS.name],
			["Last name", lastName, LIMITS.name],
			["Phone", phone, LIMITS.phone],
			["Email", email, LIMITS.email],
			["The street", street, LIMITS.street],
			["The city", city, LIMITS.city],
			["The state", address?.state ?? "", LIMITS.state],
			["The ZIP", zip, LIMITS.zip],
			["The note", note, LIMITS.note],
		] as const
	).find(([, value, limit]) => count(value) > limit);
	if (over) return refuse("who", `${over[0]} is over ${over[2]} characters.`);
	if (email && !EMAIL_PATTERN.test(email)) {
		return refuse("who", "Email is not an email address we can write to.");
	}
	if (strict) {
		const missing = [
			!firstName && "first name",
			!lastName && "last name",
			!phone && "phone",
			!email && "email",
		].filter((word): word is string => Boolean(word));
		if (missing.length > 0) return refuse("who", `Please fill in your ${wordList(missing)}.`);
		if (toE164(phone) === null) return refuse("who", "Please add a phone number we can call.");
		if (mode === "visit" && !street)
			return refuse("who", "Please add the address we are visiting.");
	}

	// How they heard: one of the site's answers, and a detail only for an answer that asks for one.
	const answered = text(body.source);
	const labels = config.source ? sourceLabels(config.source) : [];
	const onList = labels.includes(answered);
	const source = onList ? answered : "";
	const detailAsked = config.source && source ? sourceDetailFor(config.source, source) : undefined;
	if (strict && config.source?.required && !source) {
		return refuse("who", "Please tell us how you heard about us.");
	}
	const sourceDetail = detailAsked
		? Array.from(text(body.sourceDetail)).slice(0, SOURCE_DETAIL_LIMIT).join("")
		: "";

	const timed = Boolean(day && time && minutes);
	return {
		offList: Boolean(answered) && !onList,
		fields: {
			kind: kind?.id ?? "",
			kindLabel: kind?.label ?? "",
			material: material?.id ?? "",
			materialLabel: material?.label ?? "",
			mode: mode ?? "visit",
			modeLabel: mode ? modeWords(config, mode).long : "",
			day,
			time,
			minutes,
			timeZone: config.timeZone,
			appointmentStart: timed ? zonedInstant(day, time, config.timeZone) : "",
			appointmentEnd: timed ? zonedInstant(day, time, config.timeZone, minutes) : "",
			firstName,
			lastName,
			name: [firstName, lastName].filter(Boolean).join(" "),
			phone,
			email,
			address,
			source,
			sourceDetail,
			note,
			textConsent: typeof body.consent === "boolean" ? body.consent : null,
		},
	};
}

/** "418 Alder Street, Fairhaven, CO 80000", the empty parts left out. */
export function whereLine(address: Address | null): string {
	if (!address) return "";
	const place = [address.state, address.zip].filter(Boolean).join(" ");
	return [address.street, address.city, place].filter(Boolean).join(", ");
}

/** The footer line of a request the guard could not vouch for. */
export const UNCHECKED_REQUEST_LINE = "This one was not checked for spam.";

/**
 * The office's email: the requested day and time first, in large type with
 * the zone's name, the way and the length under it and a reminder that
 * nothing is booked until the office confirms, then who asked, then a table
 * of everything else the customer entered, then their note. A reply goes to
 * the customer.
 */
export function officeScheduleEmail(
	fields: ScheduleFields,
	config: ScheduleConfig,
	options: { canary?: boolean; checked?: boolean } = {},
): Email {
	const asked = askedForWords(fields.day, fields.time);
	const zone =
		fields.day && fields.time ? ` ${zoneName(fields.day, fields.time, fields.timeZone)}` : "";
	const how = [fields.modeLabel, fields.minutes ? lengthWords(fields.minutes).toLowerCase() : ""]
		.filter(Boolean)
		.join(", ");
	const subject = `${options.canary ? "[Canary] " : ""}Schedule request: ${subjectText(
		[asked, fields.kindLabel].filter(Boolean).join(", ") || "No day given",
	)}`;
	const shown: [string, string, string][] = [
		["Phone", fields.phone, "phone"],
		["Email", fields.email, "email"],
		["Address", whereLine(fields.address), "text"],
		["What", fields.kindLabel, "text"],
		[config.materialLabel ?? DEFAULT_MATERIAL_LABEL, fields.materialLabel, "text"],
		["How", how, "text"],
		...(config.source
			? ([
					[
						config.source.officeLabel ?? DEFAULT_SOURCE_OFFICE_LABEL,
						[fields.source || "Not given", fields.sourceDetail && `(${fields.sourceDetail})`]
							.filter(Boolean)
							.join(" "),
						"text",
					],
				] as [string, string, string][])
			: []),
		[
			"Text consent",
			fields.textConsent === null ? "" : fields.textConsent ? "Checked" : "Not checked",
			"text",
		],
	];
	const rows = shown
		.filter(([, value]) => value)
		.map(([label, value, kind]) => ({
			html: row(
				label,
				cell({ key: label, label, kind: kind as "text" | "phone" | "email" }, value),
			),
			text: `${label}: ${value}`,
		}));
	const unchecked = options.checked === false;
	const reminder =
		"A request, not a booked appointment: nothing is set until the office confirms it with the customer.";
	const html = `
		<div style="font-family: ${LOOK.font}; color: ${LOOK.ink}; line-height: 1.6;">
			<p style="margin: 0 0 2px; color: ${LOOK.quiet};">Asked for</p>
			<p style="margin: 0 0 4px; font-size: 20px;"><strong>${escapeHTML(asked ? `${asked}${zone}` : "No day given")}</strong></p>
			${how ? `<p style="margin: 0 0 4px;">${escapeHTML(how)}</p>` : ""}
			<p style="margin: 0 0 16px; color: ${LOOK.quiet};">${escapeHTML(reminder)}</p>
			${fields.name ? `<p style="margin: 0 0 12px; font-size: 18px;"><strong>${escapeHTML(fields.name)}</strong></p>` : ""}
			${rowsTable(rows)}
			${fields.note ? `<p style="margin: 0 0 4px; color: ${LOOK.quiet};">Note</p><p style="white-space: pre-wrap; margin: 0;">${escapeHTML(fields.note)}</p>` : ""}
			<p style="margin: 24px 0 0; font-size: 12px; color: ${LOOK.faint};">Sent from the website schedule form.${fields.email ? " Reply goes straight to the customer." : ""}${unchecked ? ` ${UNCHECKED_REQUEST_LINE}` : ""}</p>
		</div>`;
	const plain = [
		`Asked for: ${asked ? `${asked}${zone}` : "No day given"}`,
		...(how ? [how] : []),
		reminder,
		"",
		...(fields.name ? [fields.name] : []),
		...rows.map((one) => one.text),
		...(fields.note ? ["", "Note:", fields.note] : []),
		...(unchecked ? ["", UNCHECKED_REQUEST_LINE] : []),
	].join("\n");
	return { subject, html, text: plain, replyTo: fields.email || undefined };
}

export interface ScheduleRequestOptions {
	/** The sender: `Display Name <forms@a-verified-domain>`. */
	from: string;
	/** The same config the page hands `ScheduleRequestForm`. */
	config: ScheduleConfig;
	/** Destinations beside the office's email (a CRM), each tried alongside it. */
	destinations?: Destination<ScheduleFields>[];
	/** The spam check every request but a canary passes before it is delivered. */
	guard?: Guard;
	/**
	 * The customer's confirmation, the request email, sent only when the
	 * guard passed the request and a destination took it. Requires `guard`.
	 */
	confirmation?: ScheduleConfirmationOptions;
	/** How long one try of the office's email may take. Defaults to 3000. */
	emailTimeoutMs?: number;
	/** The wait before a down destination's second try. Defaults to 1000. */
	retryWaitMs?: number;
	/** The longest the whole relay may run. Defaults to 8000. */
	deadlineMs?: number;
	/** The `route` tag on this endpoint's reports. Defaults to "schedule". */
	route?: string;
	/** The clock, for a test; the business's day is read from it in its timezone. */
	now?: () => Date;
}

/**
 * SCHEDULE_TO as the addresses to send to, else CONTACT_TO, else the
 * practice's inbox.
 */
export function scheduleRecipients(): string[] {
	const named = addresses(process.env.SCHEDULE_TO);
	if (named.length > 0) return named;
	const contact = addresses(process.env.CONTACT_TO);
	return contact.length > 0 ? contact : [DEFAULT_SCHEDULE_TO];
}

/**
 * The handler a site's `api/schedule.ts` exports as `POST`. Throws at once,
 * when the function loads, for a config with a problem
 * (`scheduleConfigProblems`) and for a confirmation with no guard.
 */
export function createScheduleRequest(
	options: ScheduleRequestOptions,
): (request: Request) => Promise<Response> {
	const { config, guard, confirmation } = options;
	const problems = scheduleConfigProblems(config);
	if (problems.length > 0) {
		throw new Error(`createScheduleRequest: the config is wrong: ${problems.join("; ")}`);
	}
	if (confirmation && !guard) {
		throw new Error(
			"createScheduleRequest: a confirmation is only ever sent behind a guard; name one (turnstileGuard()) or drop the confirmation",
		);
	}
	const tags = { route: options.route ?? "schedule" };
	const now = options.now ?? (() => new Date());

	return withErrorReporting(
		async (request: Request): Promise<Response> => {
			let data: unknown;
			try {
				data = await request.json();
			} catch {
				return json(400, { ok: false, error: "Invalid request body." });
			}
			if (!isRecord(data)) return json(400, { ok: false, error: "Invalid request body." });

			// Honeypot: the quiet success a real send with the same token would
			// usually get, caught before everything else.
			if (isHoneypotFilled(data.company)) {
				const token = guard ? data[guard.tokenKey] : undefined;
				return json(200, {
					ok: true,
					receipt: Boolean(confirmation) && typeof token === "string" && token !== "",
				});
			}

			const canaryToken = process.env.CONTACT_CANARY_TOKEN;
			const canary =
				Boolean(canaryToken) && sameSecret(String(data.canary ?? ""), canaryToken ?? "");
			// The browser's id for this fill, kept across a resubmit of the same
			// request, so a resubmit after a timeout is sent once; a missing or
			// malformed one is replaced by the server's own. The guard is handed
			// an id of this request alone (`createContact` says why).
			const id = submissionIDOf(data[SUBMISSION_ID_KEY]);
			const requestID = crypto.randomUUID();
			const namespace = keyNamespace(request);

			// The request first, held to the calendar on the business's own day:
			// one about to be refused costs no check and spends no token.
			const today = dayIn(config.timeZone, now());
			const read = readScheduleRequest(data, config, today, !canary);
			if ("refusal" in read) {
				return json(400, { ok: false, code: read.refusal.code, error: read.refusal.error });
			}

			const apiKey = process.env.RESEND_API_KEY;
			const to = scheduleRecipients();
			const others = canary ? [] : (options.destinations ?? []);
			if (!apiKey) {
				if (isProduction()) {
					reportServerErrorLater(new Error("Schedule form not configured: RESEND_API_KEY unset"), {
						request,
						tags,
					});
				}
				if (others.length === 0) {
					return json(500, { ok: false, error: "The schedule form isn't configured yet." });
				}
			}
			const canaryTo = addresses(process.env.CONTACT_CANARY_TO);
			if (canary && canaryTo.length === 0) {
				if (isProduction()) {
					reportServerErrorLater(
						new Error("Schedule canary not configured: CONTACT_CANARY_TO unset"),
						{
							request,
							tags,
						},
					);
				}
				return json(500, { ok: false, error: "The schedule canary isn't configured yet." });
			}

			let checked: boolean | undefined;
			if (guard && !canary) {
				const token = data[guard.tokenKey];
				const verdict = await askGuard(
					guard,
					typeof token === "string" ? token : "",
					requestID,
					request,
				);
				if (verdict.status === "failed") {
					return json(403, { ok: false, code: "guard", error: GUARD_REFUSAL });
				}
				checked = verdict.status === "passed";
				reportVerdict(verdict, guard, data, request, tags);
			}

			if (read.offList && isProduction()) {
				reportServerErrorLater(
					new Error(
						"Schedule form sent a source answer that is not on its list, and it was recorded as not given",
					),
					{ request, tags },
				);
			}
			const token = data[TURNSTILE_TOKEN_KEY];
			if (!guard && typeof token === "string" && token && isProduction()) {
				reportServerErrorLater(
					new Error(
						"Schedule form sends a spam check token and the endpoint names no guard, so nothing is checked",
					),
					{ request, tags },
				);
			}

			const email = !apiKey
				? null
				: resendDestination<ScheduleFields>({
						apiKey,
						from: options.from,
						to: canary ? canaryTo : to,
						timeoutMs: options.emailTimeoutMs,
						keyNamespace: namespace,
						compose: (submission) =>
							officeScheduleEmail(submission.fields, config, {
								canary,
								checked: submission.checked,
							}),
					});
			const submission: Submission<ScheduleFields> = {
				id,
				fields: read.fields,
				...(checked !== undefined && { checked }),
			};
			const result = await relay(submission, [...(email ? [email] : []), ...others], {
				retryWaitMs: options.retryWaitMs,
				deadlineMs: options.deadlineMs,
				request,
				tags,
			});

			if (!result.taken) {
				return json(502, {
					ok: false,
					error: "Sending failed. Please try again in a moment, or call us.",
				});
			}
			if (canary) {
				const sent = result.legs[0]?.result;
				const reference = sent && sent.status !== "failed" ? (sent.reference ?? null) : null;
				return json(200, { ok: true, id: reference, to: to.join(", ") });
			}

			// The confirmation: only behind a guard that passed, never for a
			// canary, and only once a destination took the request.
			let sentConfirmation = false;
			const fields = read.fields;
			if (confirmation && checked === true && apiKey && fields.email) {
				const brandName = confirmation.brandName ?? displayName(options.from);
				sentConfirmation = await sendCopy({
					apiKey,
					from: confirmation.from ?? noReplySender(options.from),
					to: fields.email,
					id: `${id}-confirmation`,
					keyNamespace: namespace,
					email: requestEmail(
						{
							kindLabel: fields.kindLabel,
							materialLabel: fields.materialLabel,
							mode: fields.mode,
							minutes: fields.minutes,
							day: fields.day,
							time: fields.time,
							firstName: fields.firstName,
							phone: fields.phone,
							where: whereLine(fields.address),
						},
						config,
						{ ...confirmation, brandName },
					),
					timeoutMs: confirmation.timeoutMs,
					request,
					tags,
					reason: "confirmation",
					what: "Schedule confirmation",
				});
			}
			return json(200, { ok: true, receipt: sentConfirmation });
		},
		{ tags },
	);
}
