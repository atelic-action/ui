import { newTabProps } from "../lib/newTabProps";

/**
 * Plain data text for the documents a routine can write as JSON (the note
 * and the read): a paragraph is a string, or runs of text and links in
 * order. A link opens in a new tab when it leaves the page, and in place
 * when it is an anchor or a mail link.
 */

/** A link inside running text: the words the reader clicks and where they go. */
export interface ArtifactLink {
	text: string;
	href: string;
}

/** A paragraph: a plain string, or runs of text and links in order. */
export type ArtifactParagraph = string | Array<string | ArtifactLink>;

/** A link opens in a new tab when it leaves the page, and in place when it is an anchor or a mail link. */
export function ArtifactAnchor({ href, children }: { href: string; children: string }) {
	return (
		<a href={href} {...newTabProps(href, /^https?:/i.test(href))}>
			{children}
		</a>
	);
}

/** A paragraph with nothing to read: a blank string, or runs that are all blank strings. A link always counts. */
export function isEmpty(paragraph: ArtifactParagraph): boolean {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return runs.every((run) => typeof run === "string" && run.trim() === "");
}

/** The runs alone, for a container that is not a paragraph (a list item, a table cell). */
export function Runs({ paragraph }: { paragraph: ArtifactParagraph }) {
	const runs = typeof paragraph === "string" ? [paragraph] : paragraph;
	return (
		<>
			{runs.map((run, i) =>
				typeof run === "string" ? (
					run
				) : (
					// biome-ignore lint/suspicious/noArrayIndexKey: runs are static content in a fixed order
					<ArtifactAnchor href={run.href} key={i}>
						{run.text}
					</ArtifactAnchor>
				),
			)}
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
