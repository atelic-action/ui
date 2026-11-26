/**
 * The customer's confirmation of a schedule request: the email that says
 * the request arrived, that it is a request and not a booked appointment,
 * what was asked for, what happens next and when the office confirms, and
 * how to reach the office sooner. It says what the screen said, in the same
 * order, and offers no add to calendar, since no time is set yet.
 *
 * One implementation of its words and its markup: the endpoint sends what
 * `scheduleRequestEmail` makes, and `RequestEmail` in the email kit mounts
 * the same card on a page. Tables for layout and inline styles alone, since
 * a mail client renders nothing else.
 *
 * By default it carries nothing the visitor typed: what was asked for comes
 * from the business's own lists and the day and time from its calendar.
 * The address it goes to is whatever was typed into the form, so an email
 * that repeated a typed name or address would let anyone who solves the
 * challenge send their own words, under the business's name, to any inbox,
 * the open relay the contact receipt is careful of. `copy: true` adds the
 * greeting by first name and the address or the number to call, for a site
 * that accepts that.
 *
 * Built with the gate, as part of `@atelic-action/ui/forms/schedule`.
 */
import { escapeHTML } from "../lib/escapeHTML.js";
import { LOOK, telHref } from "./emailParts.js";
import type { Email } from "./resend.js";
import {
	askedForWords,
	DEFAULT_CONFIRM_WITHIN,
	lengthWords,
	modeWords,
	type ScheduleConfig,
	type ScheduleMode,
} from "./scheduleConfig.js";

/** The colors and the face the email is set in, written into each element. */
export interface RequestEmailLook {
	font: string;
	/** Headings and the body's words. */
	ink: string;
	/** The foot's words. */
	quiet: string;
	/** The brand's color: the rule under the head, the title, the call button. */
	accent: string;
	/** The words on the call button. */
	onAccent: string;
	/** The call box's ground. */
	tint: string;
	/** The card. */
	paper: string;
	/** The page behind the card. */
	ground: string;
	/** The rules between rows and the card's edge. */
	line: string;
}

/** A plain look, every color reading 4.5 to 1 or better where it sets words. */
export const DEFAULT_REQUEST_EMAIL_LOOK: RequestEmailLook = {
	font: LOOK.font,
	ink: LOOK.ink,
	quiet: LOOK.quiet,
	accent: LOOK.ink,
	onAccent: "#ffffff",
	tint: "#f4f1ec",
	paper: "#ffffff",
	ground: "#f4f1ec",
	line: "#e6dfd2",
};

/** A site's words and brand for the confirmation, each with a neutral default. */
export interface ScheduleConfirmationOptions {
	/**
	 * The sender. Defaults to the endpoint's `from` with its address's local
	 * part made `no-reply`, as the contact receipt is sent.
	 */
	from?: string;
	/** The business's name over the email and in its foot. Defaults to the display name of the endpoint's `from`. */
	brandName?: string;
	/** An absolute address of the business's logo, drawn in the head in place of its name. */
	logo?: string;
	/** The lines of the business's address in the foot. None by default. */
	address?: string[];
	/** The foot's last line. Defaults to `DEFAULT_REQUEST_FOOT`. */
	footNote?: string;
	/**
	 * Whether the email repeats what the visitor typed: the greeting by first
	 * name, and the address of a visit or the number for a call. Defaults to
	 * false; see the file's opening note on why.
	 */
	copy?: boolean;
	/** The colors and face, each replacing its default (the brand's color as `accent`). */
	look?: Partial<RequestEmailLook>;
	/** How long the one try may take; never more than 3000 ms. */
	timeoutMs?: number;
}

export const DEFAULT_REQUEST_FOOT =
	"You are getting this because you sent a request on our website.";

/** What the confirmation reads back of a request. */
export interface RequestEmailRequest {
	kindLabel: string;
	materialLabel: string;
	mode: ScheduleMode;
	minutes: number;
	day: string;
	time: string;
	firstName: string;
	phone: string;
	/** The address as one line, empty when none was given. */
	where: string;
}

/** The confirmation's words, in the order the card sets them. */
export interface RequestEmailContent {
	subject: string;
	preheader: string;
	brandName: string;
	logo?: string;
	title: string;
	lead: string;
	rows: { label: string; value: string }[];
	nextHead: string;
	next: string[];
	callLine: string;
	callLabel: string;
	phone: { display: string; e164: string };
	foot: string[];
}

/** "We have your request for Wednesday, December 2". */
export function requestSubject(day: string): string {
	return `We have your request for ${askedForWords(day, "")}`;
}

/** The confirmation's words for a request. */
export function requestEmailContent(
	request: RequestEmailRequest,
	config: ScheduleConfig,
	options: ScheduleConfirmationOptions & { brandName: string },
): RequestEmailContent {
	const within = config.confirmWithin ?? DEFAULT_CONFIRM_WITHIN;
	const way = modeWords(config, request.mode);
	const copy = options.copy === true;
	const first = copy ? request.firstName.trim() : "";
	const rows = [
		{
			label: "What",
			value: [request.kindLabel, request.materialLabel].filter(Boolean).join(", "),
		},
		{
			label: "How",
			value: `${way.long}, ${lengthWords(request.minutes).toLowerCase()}`,
		},
		{ label: "Asked for", value: askedForWords(request.day, request.time) },
		...(copy && request.mode === "visit" && request.where
			? [{ label: "Where", value: request.where }]
			: []),
		...(copy && request.mode === "call" && request.phone
			? [{ label: "Call you at", value: request.phone }]
			: []),
	];
	const lead = `This is a request, not a booked appointment yet. Our office will confirm your time within ${within}, by phone or text.`;
	return {
		subject: requestSubject(request.day),
		preheader: lead,
		brandName: options.brandName,
		logo: options.logo,
		title: first ? `We have your request, ${first}.` : "We have your request.",
		lead,
		rows,
		nextHead: "What Happens Next",
		next: [`Our office confirms your time within ${within}, by phone or text.`, way.next],
		callLine: "Need to change this request, or need us sooner? Call our office.",
		callLabel: `Call ${config.phone.display}`,
		phone: config.phone,
		foot: [
			options.brandName,
			...(options.address ?? []),
			options.footNote ?? DEFAULT_REQUEST_FOOT,
		].filter(Boolean),
	};
}

/** The look with a site's colors laid over the defaults. */
export function requestEmailLook(look: Partial<RequestEmailLook> = {}): RequestEmailLook {
	return { ...DEFAULT_REQUEST_EMAIL_LOOK, ...look };
}

/** Each word escaped, for an attribute or a cell. */
const e = escapeHTML;

/** The card: the head, the body, and the foot, 600 wide at most, as one table. */
export function requestEmailCard(content: RequestEmailContent, look: RequestEmailLook): string {
	const font = `font-family:${look.font};`;
	const head = content.logo
		? `<img src="${e(content.logo)}" alt="${e(content.brandName)}" height="44" style="display:block;height:44px;width:auto;border:0;">`
		: `<span style="${font}font-size:20px;font-weight:700;color:${look.accent};">${e(content.brandName)}</span>`;
	const rows = content.rows
		.map(
			(row) =>
				`<tr><th scope="row" align="left" valign="top" style="${font}width:104px;padding:11px 12px 11px 0;border-bottom:1px solid ${look.line};font-size:16px;line-height:1.4;font-weight:700;color:${look.ink};text-align:left;vertical-align:top;">${e(row.label)}</th><td valign="top" style="${font}padding:11px 0;border-bottom:1px solid ${look.line};font-size:16px;line-height:1.4;color:${look.ink};overflow-wrap:anywhere;word-break:break-word;vertical-align:top;">${e(row.value)}</td></tr>`,
		)
		.join("");
	const next = content.next.map((step) => `<li style="margin:4px 0 0;">${e(step)}</li>`).join("");
	return (
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;background:${look.paper};border:1px solid ${look.line};border-radius:8px;border-collapse:separate;">` +
		`<tr><td style="padding:22px 28px;border-bottom:3px solid ${look.accent};">${head}</td></tr>` +
		`<tr><td style="${font}padding:26px 28px 8px;color:${look.ink};">` +
		`<h1 style="${font}margin:0;font-size:24px;line-height:1.2;font-weight:700;color:${look.accent};">${e(content.title)}</h1>` +
		`<p style="${font}margin:12px 0 0;font-size:16.5px;line-height:1.5;color:${look.ink};">${e(content.lead)}</p>` +
		`<table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:20px 0 0;border-collapse:collapse;">${rows}</table>` +
		`<p style="${font}margin:24px 0 0;font-size:16.5px;line-height:1.3;font-weight:700;color:${look.ink};">${e(content.nextHead)}</p>` +
		`<ol style="${font}margin:8px 0 0;padding-left:22px;font-size:16px;line-height:1.5;color:${look.ink};">${next}</ol>` +
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:24px 0 0;"><tr><td style="${font}padding:18px 20px;background:${look.tint};border-radius:8px;">` +
		`<p style="${font}margin:0 0 12px;font-size:16px;line-height:1.5;color:${look.ink};">${e(content.callLine)}</p>` +
		`<a href="${e(telHref(content.phone.e164))}" style="${font}display:inline-block;padding:13px 22px;border-radius:999px;background:${look.accent};color:${look.onAccent};font-size:16px;font-weight:700;text-decoration:none;">${e(content.callLabel)}</a>` +
		`</td></tr></table>` +
		`</td></tr>` +
		`<tr><td style="${font}padding:20px 28px 24px;font-size:14px;line-height:1.5;color:${look.quiet};">${content.foot.map(e).join("<br>")}</td></tr>` +
		`</table>`
	);
}

/** The whole document a mail client opens: the preheader, the ground, and the card centered on it. */
export function requestEmailDocument(content: RequestEmailContent, look: RequestEmailLook): string {
	return (
		`<!doctype html><html lang="en"><head><meta charset="utf-8">` +
		`<meta name="viewport" content="width=device-width, initial-scale=1">` +
		`<meta name="color-scheme" content="light"><title>${e(content.subject)}</title></head>` +
		`<body style="margin:0;padding:0;background:${look.ground};-webkit-text-size-adjust:100%;">` +
		`<span style="display:none;font-size:1px;color:${look.ground};max-height:0;overflow:hidden;">${e(content.preheader)}</span>` +
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${look.ground};">` +
		`<tr><td align="center" style="padding:20px 12px 32px;">${requestEmailCard(content, look)}</td></tr>` +
		`</table></body></html>`
	);
}

/** The plain text twin, in the card's order. */
export function requestEmailText(content: RequestEmailContent): string {
	return [
		content.title,
		"",
		content.lead,
		"",
		...content.rows.map((row) => `${row.label}: ${row.value}`),
		"",
		content.nextHead,
		...content.next.map((step, index) => `${index + 1}. ${step}`),
		"",
		`${content.callLine.replace(/\.$/, "")} at ${content.phone.display}.`,
		"",
		...content.foot,
	].join("\n");
}

/** The confirmation as the email the endpoint sends. */
export function requestEmail(
	request: RequestEmailRequest,
	config: ScheduleConfig,
	options: ScheduleConfirmationOptions & { brandName: string },
): Email {
	const content = requestEmailContent(request, config, options);
	const look = requestEmailLook(options.look);
	return {
		subject: content.subject,
		html: requestEmailDocument(content, look),
		text: requestEmailText(content),
	};
}
