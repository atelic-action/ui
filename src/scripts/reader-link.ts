/**
 * Mint the sign in a send carries: a link that signs its named reader in at
 * the wall and lands them on the page, so the person a page was written to
 * never sees the form (FOOTPRINT.md, Privacy). It is the wall's own link
 * token, the one the form emails, with a window sized for a send instead of
 * a sitting, and like that token it keeps working on every open inside its
 * window, because mail clients open links before the reader does.
 *
 * It signs with the host's own secret and checks the host's own list, read
 * from the environment as the wall reads them (`GATE_SESSION_SECRET`,
 * `GATE_ALLOWLIST`), so a link for an address the wall would refuse is never
 * minted. The practice's artifact command fills both from the vault and the
 * folder's wall.json; nothing here reads either.
 *
 * Usage: atelic-reader-link <email> [path] [--days <n>],
 *   or `bun run reader <email>` in a site, from the site's root.
 *   path defaults to /the-read and keeps its query (`/the-read?tab=plan`).
 *   --days is the link's window, 14 by default and 30 at most.
 */
import { isAllowed, positive } from "../gate/config";
import { safeNext } from "../gate/next";
import { signToken } from "../gate/tokens";
import { loadSite } from "./site-config";

export const USAGE = "Usage: bun run reader <email> [path] [--days <n>]";

/** A send's link holds for two weeks unless the command says otherwise. */
export const DEFAULT_DAYS = 14;

/** Past a month a sign in link is a standing key, not a send. */
export const LONGEST_DAYS = 30;

/** What the command line asked for. */
export interface ReaderArgs {
	email: string;
	/** The page the link lands on, one leading slash, its query kept. */
	path: string;
	/** The link's window in days, held to the ceiling. */
	days: number;
}

/** Reads the command line; undefined when it does not name a reader, which is a usage error. */
export function parseReaderArgs(flags: string[]): ReaderArgs | undefined {
	const at = flags.indexOf("--days");
	const given = at === -1 ? undefined : flags[at + 1];
	if (at !== -1 && given === undefined) return undefined;
	const rest = at === -1 ? flags : flags.filter((_, index) => index !== at && index !== at + 1);
	const [email, givenPath = "/the-read"] = rest;
	if (!email?.includes("@") || rest.length > 2) return undefined;

	// "the-read", "/the-read", and "/the-read/" are one page; a query rides along.
	const query = givenPath.indexOf("?");
	const page = query === -1 ? givenPath : givenPath.slice(0, query);
	const search = query === -1 ? "" : givenPath.slice(query);
	const path = `/${page.replace(/^\/+|\/+$/g, "")}${search}`;
	if (safeNext(path) !== path) return undefined;

	// A window that is no number, or none at all, is a typo, never the default.
	if (given !== undefined && !(Number(given) > 0)) return undefined;
	const days = positive(given, DEFAULT_DAYS, LONGEST_DAYS);
	return { email: email.trim().toLowerCase(), path, days };
}

/**
 * The link a send carries for this reader on this host. Throws one line when
 * the wall is not armed, or when the wall would not admit the address, so a
 * dead link never reaches a draft.
 */
export async function sendLink(
	reader: ReaderArgs,
	host: { url: string; secret: string | undefined; allowlist: string | undefined },
	now: number = Date.now(),
): Promise<string> {
	if (!host.secret) {
		throw new Error("no GATE_SESSION_SECRET in the environment, so no link can be signed.");
	}
	if (!isAllowed(reader.email, host.allowlist)) {
		throw new Error(
			`${reader.email} is not on GATE_ALLOWLIST, so the wall would refuse its link. Put the address or its domain on the wall first.`,
		);
	}
	const token = await signToken(
		{
			e: reader.email,
			x: Math.floor(now / 1000) + Math.round(reader.days * 24 * 60 * 60),
			p: "link",
			n: reader.path,
		},
		host.secret,
	);
	const link = new URL("/api/auth/verify", host.url);
	link.searchParams.set("token", token);
	return link.toString();
}

/** The command. The site's address comes from its config, found from the working directory. */
export async function main(flags: string[], cwd: string = process.cwd()): Promise<void> {
	const parsed = parseReaderArgs(flags);
	if (!parsed) {
		console.error(USAGE);
		process.exit(1);
	}
	try {
		const site = await loadSite(cwd);
		const link = await sendLink(parsed, {
			url: site.url,
			secret: process.env.GATE_SESSION_SECRET,
			allowlist: process.env.GATE_ALLOWLIST,
		});
		console.log(link);
	} catch (error) {
		console.error(`[reader] ${(error as Error).message}`);
		process.exit(1);
	}
}
