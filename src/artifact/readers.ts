/**
 * Who opened it. An artifact reports every open to the practice's HubSpot
 * portal, and an open lands on a person's contact record only when the visit
 * says who they are. A visit says so one way: the reader signed in at the
 * wall, by the form or by the sign in link a send carried, and the email
 * they signed in with is in the `gate_email` cookie the sign in set. A link
 * never names its reader any other way (FOOTPRINT.md, Privacy).
 *
 * Nothing here touches the page or the network, so it tests without a
 * browser. The root route does the one impure thing, the push to HubSpot.
 *
 * This file is also built to dist/ and exported on its own as
 * `@atelic-action/ui/artifact/readers`, because a site's browser tests
 * import it under Node, which runs no TypeScript inside node_modules. So it
 * keeps the built corner's rules: no JSX, and `.js` on its relative imports.
 */

function domainOf(email: string): string {
	return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

/**
 * The email this visit should be identified as, or undefined to leave it
 * anonymous: the address the reader signed in with, unless it is on the
 * sender's domain, since that is the practice reading its own document. A
 * visit with no sign in (the note, which stays open, or local dev with the
 * wall dormant) is anonymous.
 */
export function whoIsReading(visit: {
	gateEmail: string;
	senderEmail: string;
}): string | undefined {
	const signedIn = visit.gateEmail.trim();
	if (!signedIn.includes("@")) return undefined;
	if (domainOf(signedIn) === domainOf(visit.senderEmail)) return undefined;
	return signedIn;
}
