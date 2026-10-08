/**
 * Mint a named reader and print the two things that come of it: the line
 * that goes in site.config.ts and the link that goes in the email. Every
 * link sent to a named person carries their token, so their open lands on
 * their contact in HubSpot (DEPLOY.md, Who Opened It).
 *
 * The config line holds the reader sealed: a digest of the token and the
 * email encrypted under it. The token itself appears only in the link, so
 * keep the link; it cannot be printed again.
 *
 * A writeup's reader also gets the printed copy's QR: public/images/qr.png
 * is written to carry the same link, so a scan of the sheet lands on that
 * person's contact as an emailed open does. Mint the reader before printing.
 *
 * The sheet belongs to the first reader named. A later reader never
 * repoints it: with a reader already in analytics.identify the QR is left
 * alone unless --qr asks for it.
 *
 * Usage: atelic-reader-link <email> [path] [--token <existing token>] [--qr | --no-qr],
 *   or `bun run reader <email>` in a site, from the site's root.
 *   path defaults to /writeup. --token seals an email under a token that is
 *   already in a sent link, so that link keeps working. --qr writes the QR
 *   for this reader even when another is already named; --no-qr never writes it.
 */
import { resolve } from "node:path";
import QRCode from "qrcode";
import { mintToken, readerLink, sealReader } from "../artifact/readers";
import { loadSite } from "./site-config";

export const USAGE =
	"Usage: bun run reader <email> [path] [--token <existing token>] [--qr | --no-qr]";

/** What the command line asked for. */
export interface ReaderArgs {
	email: string;
	/** The page the link opens, always with one leading slash and none trailing. */
	path: string;
	/** A token already in a sent link, when --token gave one. */
	token?: string;
	/** --qr: write the QR for this reader even when another is already named. */
	forceQr: boolean;
	/** --no-qr: never write the QR. */
	noQr: boolean;
}

/** Reads the command line; undefined when it does not name a reader, which is a usage error. */
export function parseReaderArgs(flags: string[]): ReaderArgs | undefined {
	const noQr = flags.includes("--no-qr");
	const forceQr = flags.includes("--qr");
	const args = flags.filter((flag) => flag !== "--no-qr" && flag !== "--qr");
	const at = args.indexOf("--token");
	const given = at === -1 ? undefined : args[at + 1];
	const rest = at === -1 ? args : args.filter((_, index) => index !== at && index !== at + 1);
	const [email, givenPath = "/writeup"] = rest;
	// "writeup", "/writeup", and "/writeup/" are one page.
	const path = `/${givenPath.replace(/^\/+|\/+$/g, "")}`;

	if (!email?.includes("@") || (at !== -1 && !given)) return undefined;
	return { email, path, token: given, forceQr, noQr };
}

/**
 * The command. The config it reads and the QR it writes are the site's,
 * found from the working directory.
 */
export async function main(flags: string[], cwd: string = process.cwd()): Promise<void> {
	const parsed = parseReaderArgs(flags);
	if (!parsed) {
		console.error(USAGE);
		process.exit(1);
	}
	const { email, path, forceQr, noQr } = parsed;
	let site: Awaited<ReturnType<typeof loadSite>>;
	try {
		site = await loadSite(cwd);
	} catch (error) {
		console.error(`[reader] ${(error as Error).message}`);
		process.exit(1);
	}

	const token = parsed.token ?? mintToken();
	const reader = await sealReader(email, token);
	console.log("Add to analytics.identify in src/site.config.ts:");
	console.log(`  { id: "${reader.id}", sealed: "${reader.sealed}" }, // ${email.split("@")[1]}`);
	console.log("");
	console.log("Send this link, and only to that person. Keep it: it cannot be printed again.");
	const link = readerLink(site.url, token, path);
	console.log(`  ${link}`);

	// The sheet's QR is the reader's link. A private artifact identifies by sign
	// in and never by a token, so its QR stays on the bare host.
	const named = site.analytics?.identify.length ?? 0;
	const sheetIsFree = named === 0 || forceQr;
	if (path === "/writeup" && !noQr && site.access === "public" && !sheetIsFree) {
		console.log("");
		console.log(
			"Left public/images/qr.png alone: a reader is already named, and the sheet is theirs. Pass --qr to give the sheet to this reader.",
		);
	}
	if (path === "/writeup" && !noQr && site.access === "public" && sheetIsFree) {
		const qr = resolve(cwd, "public/images/qr.png");
		await QRCode.toFile(qr, link, { width: 330, margin: 4, errorCorrectionLevel: "M" });
		console.log("");
		console.log(
			"Wrote public/images/qr.png with that link. Print the sheet after this, never before.",
		);
	}
}
