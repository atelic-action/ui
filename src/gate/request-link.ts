/**
 * Access gate: request a sign in link.
 *
 * Emails a signed link through Resend, but only to an allowlisted address.
 * The response is the same whether or not the email matched, in its body and
 * in how long it takes, so the allowlist cannot be probed. A site's
 * `api/auth/request-link.ts` re exports `POST` from here.
 *
 * Env (set on the Vercel project):
 * - GATE_SESSION_SECRET   signing secret; also the gate's on and off switch
 * - GATE_ALLOWLIST        comma separated emails allowed to receive a link
 * - RESEND_API_KEY        sending only Resend key
 * - GATE_FROM             sender display name (optional)
 * - GATE_SUBJECT          email subject (optional)
 * - GATE_LINK_TTL_MIN     link lifetime in minutes (optional, default 15)
 * - GATE_BASE_URL         the host the link points at (optional, see linkBase)
 */
import { safeNext } from "./next.js";
import { signToken } from "./tokens.js";

const DEFAULT_FROM = "Atelic <forms@atelic.me>";

/**
 * How long every valid request takes to answer, whatever it did. Resend
 * answers well inside it; a send that ran longer would still show.
 */
const ANSWER_AFTER_MS = 1200;

export interface RequestLinkOptions {
	/** What the link opens, as the email names it. Defaults to "document". */
	noun?: string;
}

function json(status: number, body: Record<string, unknown>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * Where the emailed link points. Never a forwarded header: a caller can name
 * any host there, and the link carries a signed token. The configured base
 * wins; on production the project's own domain is next; otherwise the host
 * the platform routed this request to, which is the deployment itself.
 */
export function linkBase(request: Request, env: Record<string, string | undefined>): string {
	const configured = env.GATE_BASE_URL?.trim();
	if (configured) return configured.replace(/\/+$/, "");
	if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
		return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
	}
	return new URL(request.url).origin;
}

function linkEmailHtml(link: string, noun: string): string {
	// Gmail renders inline styles only, no style blocks.
	return `
		<div style="font-family: Helvetica, Arial, sans-serif; color: #211c17; line-height: 1.6; max-width: 520px;">
			<p style="margin: 0 0 12px; font-size: 24px; font-weight: 600;">Your private link to the ${noun}.</p>
			<p style="margin: 0 0 24px; color: #4a4137;">Click below to open the site. The link is tied to your inbox and expires shortly. Once you are in, you stay signed in for a while.</p>
			<a href="${link}" style="display: inline-block; background: #211c17; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 26px; border-radius: 8px;">Open the ${noun} &rarr;</a>
			<p style="margin: 24px 0 0; font-size: 13px; color: #4a4137;">If the button does not work, paste this link into your browser:<br><span style="color: #6b5f4f; word-break: break-all;">${link}</span></p>
			<p style="margin: 28px 0 0; font-size: 13px; color: #8a7c68;">If you did not expect this, you can ignore it.</p>
		</div>`;
}

async function sendLink(to: string, link: string, noun: string): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) return;
	await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: process.env.GATE_FROM || DEFAULT_FROM,
			to: [to],
			subject: process.env.GATE_SUBJECT || `Your private link to the ${noun}`,
			html: linkEmailHtml(link, noun),
			text: `Your private link to the ${noun}:\n\n${link}\n\nIf you did not expect this, you can ignore it.`,
		}),
	});
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createRequestLink(options: RequestLinkOptions = {}) {
	const noun = options.noun ?? "document";

	return async function POST(request: Request): Promise<Response> {
		let data: unknown;
		try {
			data = await request.json();
		} catch {
			return json(400, { ok: false, error: "Invalid request body." });
		}
		if (typeof data !== "object" || data === null || Array.isArray(data)) {
			return json(400, { ok: false, error: "Invalid request body." });
		}
		const fields = data as Record<string, unknown>;

		const email = String(fields.email ?? "")
			.trim()
			.toLowerCase();
		const next = safeNext(fields.next);

		const secret = process.env.GATE_SESSION_SECRET;
		const allowlist = (process.env.GATE_ALLOWLIST ?? "")
			.split(",")
			.map((entry) => entry.trim().toLowerCase())
			.filter(Boolean);

		// Every valid request answers after the same wait, so a send in flight
		// reads no differently from no send at all.
		const answered = wait(ANSWER_AFTER_MS);

		if (email && secret && allowlist.includes(email)) {
			const ttlMinutes = Number(process.env.GATE_LINK_TTL_MIN ?? "15") || 15;
			try {
				const token = await signToken(
					{ e: email, x: Math.floor(Date.now() / 1000) + ttlMinutes * 60, p: "link", n: next },
					secret,
				);
				const link = `${linkBase(request, process.env)}/api/auth/verify?token=${encodeURIComponent(token)}`;
				await sendLink(email, link, noun);
			} catch {
				// Swallow: the response must not reveal whether a send happened.
			}
		}

		await answered;
		return json(200, { ok: true });
	};
}

/** The handler a document host exports as is. */
export const POST = createRequestLink();
