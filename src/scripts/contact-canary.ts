/**
 * The contact relay canary: submits a token bearing test message to the live
 * site's /api/contact and asserts the whole pipe worked. A pass means the
 * function is deployed, its env is present, the Resend key is valid, the
 * sending domain is verified, Resend accepted the message (200 plus an id),
 * and the client destination the function is configured with is the one
 * expected. The canary lands in CONTACT_CANARY_TO, never the client's inbox.
 *
 * Env: SITE_URL, CONTACT_EXPECTED_TO, CONTACT_CANARY_TOKEN.
 * Usage: atelic-contact-canary   (a site's daily contact-canary workflow runs it)
 * Exits 1 on any failure, naming the failed assertion.
 *
 * A SITE_URL on the reserved `.invalid` TLD (`https://canary.invalid`) is the
 * explicit off switch, for a repo with no live site (a template): the run
 * passes without submitting anything. An unset SITE_URL still fails, so a
 * site that never configured the canary is caught, not silently skipped.
 */

/** The environment the canary reads: SITE_URL, CONTACT_EXPECTED_TO, and CONTACT_CANARY_TOKEN. */
export type CanaryEnv = Record<string, string | undefined>;

export interface CanaryResult {
	verdict: "pass" | "skip" | "fail";
	message: string;
}

const fail = (reason: string): CanaryResult => ({ verdict: "fail", message: `FAIL: ${reason}` });

/**
 * Runs the canary against the site the environment names. `fetcher` is the
 * fetch to send with, so a test can stand in for the network.
 */
export async function runCanary(
	env: CanaryEnv,
	fetcher: typeof fetch = fetch,
	now: Date = new Date(),
): Promise<CanaryResult> {
	const site = env.SITE_URL?.replace(/\/$/, "");
	if (!site) return fail("SITE_URL is not set");
	let host: string;
	try {
		host = new URL(site).hostname;
	} catch {
		return fail(`SITE_URL is not a URL: ${site}`);
	}
	if (host.endsWith(".invalid")) {
		return { verdict: "skip", message: `skipped: SITE_URL is ${site}, the explicit off switch` };
	}
	const expectedTo = env.CONTACT_EXPECTED_TO;
	const token = env.CONTACT_CANARY_TOKEN;
	if (!expectedTo) return fail("CONTACT_EXPECTED_TO is not set");
	if (!token) return fail("CONTACT_CANARY_TOKEN is not set");

	const endpoint = `${site}/api/contact`;
	let response: Response;
	try {
		response = await fetcher(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			signal: AbortSignal.timeout(20000),
			body: JSON.stringify({
				name: "Contact canary",
				email: "canary@atelic.me",
				topic: "Canary",
				message: `Automated contact relay check at ${now.toISOString()}. If you are reading this in the client inbox, CONTACT_CANARY_TO is misconfigured.`,
				company: "",
				canary: token,
			}),
		});
	} catch (error) {
		return fail(`request failed: ${error instanceof Error ? error.message : String(error)}`);
	}

	const body = (await response.json().catch(() => ({}))) as {
		ok?: boolean;
		id?: string | null;
		to?: string;
		error?: string;
	};
	if (response.status !== 200 || body.ok !== true) {
		return fail(`relay returned ${response.status}${body.error ? `: ${body.error}` : ""}`);
	}
	if (!body.id) return fail("Resend accepted the message without an id (canary path not taken?)");
	if (body.to !== expectedTo) {
		return fail(`configured destination is ${body.to ?? "(none)"}, expected ${expectedTo}`);
	}
	return { verdict: "pass", message: `ok: Resend id ${body.id}, destination ${body.to}` };
}

/** The command: runs the canary the environment configures. */
export async function main(): Promise<void> {
	const result = await runCanary(process.env);
	if (result.verdict === "fail") {
		console.error(`[contact-canary] ${result.message}`);
		process.exit(1);
	}
	console.log(`[contact-canary] ${result.message}`);
}
