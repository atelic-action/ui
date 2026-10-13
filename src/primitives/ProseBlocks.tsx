/**
 * One block of ported prose. A deliberately tiny vocabulary — headings,
 * paragraphs, lists — because that is what survives extraction from a CMS
 * intact, and because anything richer invites rewriting content that was
 * meant to be carried across verbatim.
 */
export interface ProseBlock {
	type: "h" | "p" | "ul";
	/** Present for "h" and "p". */
	text?: string;
	/** Present for "ul". */
	items?: string[];
}

export interface ProseBlocksProps {
	blocks: ProseBlock[];
	/**
	 * Heading level for "h" blocks. Defaults to h2, since the page's h1
	 * belongs to whatever hero sits above this.
	 */
	headingLevel?: "h2" | "h3";
	className?: string;
}

/**
 * Renders a document body from data rather than markup: legal pages, ported
 * blog posts, anything whose words came from somewhere else and must not be
 * quietly edited on the way in.
 *
 * Keys are derived from content plus position. Repeated text is common in
 * ported prose ("Contact us" appears in three legal documents), so neither
 * alone is stable.
 */
export function ProseBlocks({ blocks, headingLevel = "h2", className }: ProseBlocksProps) {
	const Heading = headingLevel;
	return (
		<div className={["prose-blocks", className].filter(Boolean).join(" ")}>
			{blocks.map((block, i) => {
				if (block.type === "h") {
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
						<Heading className="pb-heading" key={`h-${i}-${block.text?.slice(0, 24)}`}>
							{block.text}
						</Heading>
					);
				}
				if (block.type === "ul") {
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
						<ul className="pb-list" key={`ul-${i}-${(block.items ?? [])[0]?.slice(0, 24)}`}>
							{(block.items ?? []).map((item, j) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
								<li key={`${j}-${item.slice(0, 40)}`}>{item}</li>
							))}
						</ul>
					);
				}
				return (
					// biome-ignore lint/suspicious/noArrayIndexKey: static ported prose; position plus content is the stable key (see above)
					<p className="pb-body" key={`p-${i}-${block.text?.slice(0, 24)}`}>
						{block.text}
					</p>
				);
			})}
		</div>
	);
}
