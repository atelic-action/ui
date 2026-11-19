import { newTabProps } from "../lib/newTabProps";

/**
 * Plain data text for the documents in @atelic-action/artifact a routine
 * can write as JSON (the note and the read): a paragraph is a string, or runs of text,
 * links, and search queries in order. A link opens in a new tab when it leaves the page, and in place
 * when it is an anchor or a mail link.
 */

/** A link inside running text: the words the reader clicks and where they go. */
export interface ArtifactLink {
	text: string;
	href: string;
}

/** A search someone types, set the way every document sets one: in curly quotes and italics. With an href, the quoted words are the link. */
export interface ArtifactQuery {
	query: string;
	href?: string;
}

/** One run of a paragraph: plain text, a link, or a search query. */
export type ArtifactRun = string | ArtifactLink | ArtifactQuery;

/** A paragraph: a plain string, or runs of text, links, and search queries in order. */
export type ArtifactParagraph = string | Array<ArtifactRun>;

/** Whether a run is a search query rather than text or a link. */
export function isQuery(run: ArtifactRun): run is ArtifactQuery {
	return typeof run !== "string" && "query" in run;
}

/** A link opens in a new tab when it leaves the page, and in place when it is an anchor or a mail link. */
export function ArtifactAnchor({ href, children }: { href: string; children: string }) {
	return (
		<a href={href} {...newTabProps(href, /^https?:/i.test(href))}>
			{children}
		</a>
	);
}

/** A paragraph with nothing to read: a blank string, or runs that are all blank strings. A link or a query always counts. */
export function isEmpty(paragraph: ArtifactParagraph): boolean {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return runs.every((run) => typeof run === "string" && run.trim() === "");
}

/** A search query in curly quotes and italics; the content passes the bare words and never types the quotes. */
function Query({ run }: { run: ArtifactQuery }) {
	const quoted = `“${run.query}”`;
	return (
		<em className="query">
			{run.href ? <ArtifactAnchor href={run.href}>{quoted}</ArtifactAnchor> : quoted}
		</em>
	);
}

/** The runs alone, for a container that is not a paragraph (a list item, a table cell). */
export function Runs({ paragraph }: { paragraph: ArtifactParagraph }) {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return (
		<>
			{runs.map((run, i) => {
				if (typeof run === "string") return run;
				if (isQuery(run)) {
					// biome-ignore lint/suspicious/noArrayIndexKey: runs are static content in a fixed order
					return <Query run={run} key={i} />;
				}
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: runs are static content in a fixed order
					<ArtifactAnchor href={run.href} key={i}>
						{run.text}
					</ArtifactAnchor>
				);
			})}
		</>
	);
}

export function Paragraph({
	paragraph,
	className,
}: {
	paragraph: ArtifactParagraph;
	className?: string;
}) {
	return (
		<p className={className}>
			<Runs paragraph={paragraph} />
		</p>
	);
}
